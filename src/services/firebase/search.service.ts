/**
 * Search Service - Busca de Avaliações
 *
 * Permite buscar avaliações por:
 * - Email do gestor + Token UUID (gestor)
 * - Código de acesso de 6 dígitos (colaborador)
 *
 * OWASP A01 - Broken Access Control: Valida propriedade antes de retornar dados
 * OWASP A07 - Authentication Failures: Timing-safe comparison, rate limiting
 */

import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import {
  hash,
  hashAccessCode,
  generateEncryptionKey,
  decrypt,
} from '@/utils/crypto';
import { isValidEmail, isValidAccessCode } from '@/utils/validation';
import { sanitizeForFirestore } from '@/utils/sanitization';
import type { Evaluation, TeamMember } from '@/types';
import { logger } from '@/services/observability/logger';

/**
 * Resultado da busca de avaliação do gestor
 */
export interface ManagerSearchResult {
  evaluationId: string;
  evaluation: Evaluation;
  managerToken: string; // Token descriptografado
}

/**
 * Resultado da busca de avaliação do colaborador
 */
export interface MemberSearchResult {
  evaluationId: string;
  member: TeamMember;
  memberName: string; // Nome descriptografado
}

/**
 * Busca avaliação por email do gestor + token
 *
 * Fluxo:
 * 1. Valida email e token
 * 2. Faz hash do email
 * 3. Busca avaliações com esse email hash
 * 4. Para cada avaliação, tenta descriptografar o token armazenado
 * 5. Compara o token descriptografado com o fornecido
 * 6. Retorna a avaliação se match
 *
 * Complexidade: O(N) onde N é o número de avaliações do gestor
 * (Geralmente N=1 ou muito pequeno)
 *
 * @param email - Email do gestor
 * @param managerToken - Token UUID do gestor
 * @returns Avaliação encontrada ou null
 */
export async function searchEvaluationByManager(
  email: string,
  managerToken: string
): Promise<ManagerSearchResult | null> {
  // Validação
  if (!isValidEmail(email)) {
    logger.warn('Invalid email in manager search', {
      component: 'SearchService',
    });
    return null;
  }

  if (!managerToken || managerToken.length !== 36) {
    logger.warn('Invalid token format in manager search', {
      component: 'SearchService',
    });
    return null;
  }

  try {
    // Hash do email
    const sanitizedEmail = sanitizeForFirestore(email.toLowerCase().trim());
    const emailHash = hash(sanitizedEmail);

    // Buscar avaliações com esse email
    const q = query(
      collection(db, 'evaluations'),
      where('creator_email', '==', emailHash)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      logger.info('No evaluations found for email', {
        component: 'SearchService',
        emailHash: emailHash.substring(0, 8) + '...',
      });
      return null;
    }

    // Tentar descriptografar o token de cada avaliação
    const encryptionKey = generateEncryptionKey(managerToken);

    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();

      try {
        // Tenta descriptografar o token armazenado
        const decryptedToken = decrypt(data.creator_token, encryptionKey);

        // Timing-safe comparison
        if (timingSafeCompare(decryptedToken, managerToken)) {
          // Match! Descriptografar título
          const decryptedTitle = decrypt(data.title, encryptionKey);

          const evaluation: Evaluation = {
            id: docSnap.id,
            creator_email: data.creator_email,
            creator_token: data.creator_token,
            title: decryptedTitle,
            created_at: data.created_at,
            status: data.status,
          };

          logger.info('Evaluation found by manager search', {
            component: 'SearchService',
            evaluationId: docSnap.id,
          });

          return {
            evaluationId: docSnap.id,
            evaluation,
            managerToken,
          };
        }
      } catch (error) {
        // Token errado para essa avaliação, continuar
        continue;
      }
    }

    // Nenhuma avaliação com token matching
    logger.warn('No evaluation matched the provided token', {
      component: 'SearchService',
    });
    return null;
  } catch (error) {
    logger.error('Error searching evaluation by manager', error as Error, {
      component: 'SearchService',
    });
    return null;
  }
}

/**
 * Busca avaliação por código de acesso do colaborador
 *
 * Fluxo:
 * 1. Valida código de acesso (6 dígitos)
 * 2. Faz hash do código
 * 3. Busca em team_members qualquer membro com esse código hash
 * 4. Retorna o membro e o ID da avaliação
 *
 * Nota: Nome do membro retorna criptografado (será descriptografado na UI)
 *
 * Complexidade: O(N) onde N é o número total de membros no banco
 * (Firestore indexa access_code, então é relativamente rápido)
 *
 * @param accessCode - Código de acesso de 6 dígitos
 * @returns Membro encontrado ou null
 */
export async function searchEvaluationByAccessCode(
  accessCode: string
): Promise<MemberSearchResult | null> {
  // Validação
  if (!isValidAccessCode(accessCode)) {
    logger.warn('Invalid access code format in member search', {
      component: 'SearchService',
      accessCode: accessCode, // Mostrar código digitado para debug
      accessCodeLength: accessCode.length,
    });
    return null;
  }

  try {
    // Hash do código
    const codeHash = hashAccessCode(accessCode);
    logger.debug('Searching for access code', {
      component: 'SearchService',
      accessCodeLength: accessCode.length,
      codeHash: codeHash.substring(0, 16) + '...', // Primeiros 16 chars do hash
    });

    // Buscar membro com esse código
    const q = query(
      collection(db, 'team_members'),
      where('access_code', '==', codeHash)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      logger.warn('No member found for access code - checking all members', {
        component: 'SearchService',
      });

      // Debug: buscar TODOS os membros para verificar o que há no banco
      const allMembersQuery = query(collection(db, 'team_members'), limit(5));
      const allMembersSnap = await getDocs(allMembersQuery);

      logger.warn('Sample of members in database', {
        component: 'SearchService',
        count: allMembersSnap.size,
        sampleHashes: allMembersSnap.docs.map(doc => ({
          id: doc.id,
          hashPrefix: doc.data().access_code?.substring(0, 16) + '...',
        })),
      });

      return null;
    }

    // Deve retornar apenas um membro (códigos são únicos)
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();

    const member: TeamMember = {
      id: docSnap.id,
      evaluation_id: data.evaluation_id,
      name: data.name, // Ainda criptografado
      email: data.email,
      access_code: data.access_code,
      completed_evaluations: data.completed_evaluations,
      total_evaluations: data.total_evaluations,
      last_access_date: data.last_access_date,
    };

    logger.info('Member found by access code search', {
      component: 'SearchService',
      memberId: docSnap.id,
      evaluationId: data.evaluation_id,
    });

    return {
      evaluationId: data.evaluation_id,
      member,
      memberName: data.name, // Ainda criptografado (será descriptografado depois)
    };
  } catch (error) {
    logger.error('Error searching evaluation by access code', error as Error, {
      component: 'SearchService',
    });
    return null;
  }
}

/**
 * Timing-safe string comparison
 * Previne timing attacks ao comparar strings sensíveis
 *
 * @param a - String A
 * @param b - String B
 * @returns true se iguais
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Busca genérica de avaliação (detecta automaticamente o tipo)
 *
 * Detecta se é:
 * - UUID (36 chars) → Gestor
 * - 6 dígitos → Colaborador
 *
 * @param identifier - Email+token ou código de acesso
 * @returns Resultado da busca
 */
export async function searchEvaluation(
  identifier: string,
  email?: string
): Promise<ManagerSearchResult | MemberSearchResult | null> {
  // Se tem email, é busca de gestor
  if (email) {
    return searchEvaluationByManager(email, identifier);
  }

  // Se é 6 dígitos, é busca de colaborador
  if (isValidAccessCode(identifier)) {
    return searchEvaluationByAccessCode(identifier);
  }

  // Se é UUID (36 chars), precisa de email
  if (identifier.length === 36 && identifier.includes('-')) {
    logger.warn('UUID provided without email', {
      component: 'SearchService',
    });
    return null;
  }

  logger.warn('Invalid identifier format', {
    component: 'SearchService',
    length: identifier.length,
  });
  return null;
}
