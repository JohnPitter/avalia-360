/**
 * Serviço de gerenciamento de avaliações do gestor
 * Busca e lista avaliações criadas por um gestor específico
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';
import { hash } from '@/utils/crypto';
import type { Evaluation } from '@/types';
import { debugLog } from '@/services/debug/debugLogger';

/**
 * Resultado da busca de avaliações do gestor
 */
export interface ManagerEvaluationResult {
  evaluation: Evaluation;
  hasAccess: boolean;
}

/**
 * Busca avaliações criadas por um gestor específico
 *
 * @param email - Email do gestor (será hasheado)
 * @param token - Token UUID do gestor (opcional, para validar acesso)
 * @returns Lista de avaliações encontradas
 *
 * @example
 * ```ts
 * const evaluations = await searchManagerEvaluations('manager@company.com', 'uuid-token');
 * if (evaluations.length > 0) {
 *   // Gestor tem avaliações
 * }
 * ```
 */
export async function searchManagerEvaluations(
  email: string,
  token?: string
): Promise<ManagerEvaluationResult[]> {
  debugLog.start('searchManagerEvaluations', { component: 'manager.service', data: { email: '******', hasToken: !!token } });
  try {
    // Hash do email do gestor
    debugLog.debug('Hasheando email do gestor', { component: 'manager.service' });
    const emailHash = hash(email.toLowerCase().trim());

    // Buscar todas as avaliações criadas por este email
    debugLog.debug('Buscando avaliações por email hash', { component: 'manager.service' });
    const q = query(
      collection(db, 'evaluations'),
      where('creator_email', '==', emailHash)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      debugLog.info('Nenhuma avaliação encontrada', { component: 'manager.service' });
      return [];
    }

    debugLog.info(`${querySnapshot.docs.length} avaliações encontradas`, { component: 'manager.service', data: { count: querySnapshot.docs.length } });

    // Mapear resultados
    const results: ManagerEvaluationResult[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // created_at pode ser number (Date.now()) ou Timestamp do Firestore
      let createdAtTimestamp: number;
      if (typeof data.created_at === 'number') {
        createdAtTimestamp = data.created_at;
      } else if (data.created_at?.toDate) {
        createdAtTimestamp = data.created_at.toDate().getTime();
      } else {
        createdAtTimestamp = Date.now();
      }

      const evaluation: Evaluation = {
        id: doc.id,
        title: data.title || '',
        creator_email: data.creator_email,
        creator_token: data.creator_token,
        created_at: createdAtTimestamp,
        status: data.status || 'draft',
      };

      // Verificar se o token fornecido tem acesso
      const hasAccess = token ? data.creator_token === token : false;

      debugLog.debug('Verificando acesso', {
        component: 'manager.service',
        data: {
          evaluationId: doc.id,
          hasToken: !!token,
          tokenMatch: hasAccess,
          storedTokenType: typeof data.creator_token,
          providedTokenType: typeof token
        }
      });

      return {
        evaluation,
        hasAccess,
      };
    });

    debugLog.success(`${results.length} avaliações mapeadas com sucesso`, { component: 'manager.service' });
    debugLog.end('searchManagerEvaluations', { component: 'manager.service' });
    return results;
  } catch (error) {
    debugLog.error('Erro ao buscar avaliações do gestor', error as Error, { component: 'manager.service' });
    throw new Error(
      `Erro ao buscar avaliações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Busca uma avaliação específica do gestor usando email + token
 * Valida que o gestor tem acesso à avaliação
 *
 * @param email - Email do gestor
 * @param token - Token UUID do gestor
 * @returns Primeira avaliação encontrada com acesso válido, ou null
 *
 * @example
 * ```ts
 * const evaluation = await getManagerEvaluationByToken(email, token);
 * if (evaluation) {
 *   // Gestor tem acesso
 * }
 * ```
 */
export async function getManagerEvaluationByToken(
  email: string,
  token: string
): Promise<Evaluation | null> {
  try {
    const results = await searchManagerEvaluations(email, token);

    // Buscar primeira avaliação com acesso válido
    const validResult = results.find((r) => r.hasAccess);

    if (!validResult) {
      return null;
    }

    return validResult.evaluation;
  } catch (error) {
    throw error;
  }
}

/**
 * Lista todas as avaliações do gestor (sem validação de token)
 * Útil para mostrar histórico de avaliações criadas
 *
 * @param email - Email do gestor
 * @returns Lista de avaliações
 */
export async function listManagerEvaluations(
  email: string
): Promise<Evaluation[]> {
  try {
    const results = await searchManagerEvaluations(email);
    return results.map((r) => r.evaluation);
  } catch (error) {
    throw error;
  }
}

/**
 * Valida se um gestor tem acesso a uma avaliação específica
 *
 * @param evaluationId - ID da avaliação
 * @param email - Email do gestor
 * @param token - Token do gestor
 * @returns true se tem acesso, false caso contrário
 */
export async function validateManagerAccess(
  evaluationId: string,
  email: string,
  token: string
): Promise<boolean> {
  try {
    const results = await searchManagerEvaluations(email, token);

    // Verificar se alguma avaliação corresponde ao ID e tem acesso válido
    const hasAccess = results.some(
      (r) => r.evaluation.id === evaluationId && r.hasAccess
    );

    return hasAccess;
  } catch (error) {
    return false;
  }
}
