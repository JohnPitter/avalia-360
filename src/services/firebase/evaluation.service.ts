import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import type { Evaluation, EvaluationStatus } from '@/types';
import { encrypt, decrypt, hash, generateToken, generateEncryptionKey } from '@/utils/crypto';
import { isValidTitle, isValidEmail } from '@/utils/validation';
import { sanitizeText, sanitizeForFirestore } from '@/utils/sanitization';

/**
 * Serviço de Avaliações
 * Gerencia operações CRUD de avaliações no Firestore
 * Complexidade: O(1) para operações individuais, O(N) para queries
 */

/**
 * Interface para criação de avaliação
 */
export interface CreateEvaluationData {
  creatorEmail: string;
  title: string;
}

/**
 * Cria nova avaliação
 * Complexidade: O(1)
 *
 * @param data - Dados da avaliação
 * @returns Avaliação criada com token do gestor
 */
export async function createEvaluation(
  data: CreateEvaluationData
): Promise<{ evaluation: Evaluation; managerToken: string }> {
  // Validação
  if (!isValidEmail(data.creatorEmail)) {
    throw new Error('Email do criador inválido');
  }

  if (!isValidTitle(data.title)) {
    throw new Error('Título inválido (1-200 caracteres)');
  }

  // Sanitização
  const sanitizedEmail = sanitizeForFirestore(data.creatorEmail.toLowerCase().trim());
  const sanitizedTitle = sanitizeText(data.title, 200);

  // Gera token UUID para o gestor
  const managerToken = generateToken();

  // Criptografia
  const encryptionKey = generateEncryptionKey(managerToken);
  const emailHash = hash(sanitizedEmail);
  const encryptedTitle = encrypt(sanitizedTitle, encryptionKey);
  const encryptedToken = encrypt(managerToken, encryptionKey);

  // Cria documento
  const evaluationData = {
    creator_email: emailHash,
    creator_token: encryptedToken,
    title: encryptedTitle,
    created_at: Date.now(),
    status: 'draft' as EvaluationStatus,
  };

  try {
    const docRef = await addDoc(collection(db, 'evaluations'), evaluationData);

    const evaluation: Evaluation = {
      id: docRef.id,
      ...evaluationData,
    };

    return { evaluation, managerToken };
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    throw new Error('Falha ao criar avaliação no banco de dados');
  }
}

/**
 * Busca avaliação por ID
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 * @param managerToken - Token do gestor (para descriptografar)
 * @returns Avaliação descriptografada
 */
export async function getEvaluation(
  evaluationId: string,
  managerToken: string
): Promise<Evaluation | null> {
  try {
    const docRef = doc(db, 'evaluations', evaluationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const encryptionKey = generateEncryptionKey(managerToken);

    // Descriptografa dados sensíveis
    const decryptedTitle = decrypt(data.title, encryptionKey);

    const evaluation: Evaluation = {
      id: docSnap.id,
      creator_email: data.creator_email,
      creator_token: data.creator_token,
      title: decryptedTitle,
      created_at: data.created_at,
      status: data.status,
    };

    return evaluation;
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    return null;
  }
}

/**
 * Busca avaliações por email do criador (hasheado)
 * Complexidade: O(N) onde N é o número de avaliações do criador
 *
 * @param creatorEmail - Email do criador
 * @param managerToken - Token do gestor
 * @returns Lista de avaliações
 */
export async function getEvaluationsByCreator(
  creatorEmail: string,
  managerToken: string
): Promise<Evaluation[]> {
  try {
    const emailHash = hash(creatorEmail.toLowerCase().trim());
    const q = query(
      collection(db, 'evaluations'),
      where('creator_email', '==', emailHash)
    );

    const querySnapshot = await getDocs(q);
    const encryptionKey = generateEncryptionKey(managerToken);

    const evaluations: Evaluation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      try {
        const decryptedTitle = decrypt(data.title, encryptionKey);

        evaluations.push({
          id: doc.id,
          creator_email: data.creator_email,
          creator_token: data.creator_token,
          title: decryptedTitle,
          created_at: data.created_at,
          status: data.status,
        });
      } catch (error) {
        console.error(`Erro ao descriptografar avaliação ${doc.id}:`, error);
      }
    });

    return evaluations;
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return [];
  }
}

/**
 * Atualiza status da avaliação
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 * @param status - Novo status
 */
export async function updateEvaluationStatus(
  evaluationId: string,
  status: EvaluationStatus
): Promise<void> {
  try {
    const docRef = doc(db, 'evaluations', evaluationId);
    await updateDoc(docRef, {
      status,
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw new Error('Falha ao atualizar status da avaliação');
  }
}

/**
 * Ativa avaliação (muda status para 'active')
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 */
export async function activateEvaluation(evaluationId: string): Promise<void> {
  await updateEvaluationStatus(evaluationId, 'active');
}

/**
 * Completa avaliação (muda status para 'completed')
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 */
export async function completeEvaluation(evaluationId: string): Promise<void> {
  await updateEvaluationStatus(evaluationId, 'completed');
}

/**
 * Valida token do gestor contra avaliação
 * Verifica se o token corresponde ao criador da avaliação
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 * @param managerToken - Token do gestor
 * @returns true se válido
 */
export async function validateManagerToken(
  evaluationId: string,
  managerToken: string
): Promise<boolean> {
  try {
    const docRef = doc(db, 'evaluations', evaluationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data();
    const encryptionKey = generateEncryptionKey(managerToken);

    // Tenta descriptografar o token armazenado
    const decryptedToken = decrypt(data.creator_token, encryptionKey);

    // Se descriptografar com sucesso e os tokens coincidirem
    return decryptedToken === managerToken;
  } catch (error) {
    // Falha na descriptografia significa token inválido
    return false;
  }
}

/**
 * Atualiza título da avaliação
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 * @param newTitle - Novo título
 * @param managerToken - Token do gestor
 */
export async function updateEvaluationTitle(
  evaluationId: string,
  newTitle: string,
  managerToken: string
): Promise<void> {
  if (!isValidTitle(newTitle)) {
    throw new Error('Título inválido (1-200 caracteres)');
  }

  const sanitizedTitle = sanitizeText(newTitle, 200);
  const encryptionKey = generateEncryptionKey(managerToken);
  const encryptedTitle = encrypt(sanitizedTitle, encryptionKey);

  try {
    const docRef = doc(db, 'evaluations', evaluationId);
    await updateDoc(docRef, {
      title: encryptedTitle,
    });
  } catch (error) {
    console.error('Erro ao atualizar título:', error);
    throw new Error('Falha ao atualizar título da avaliação');
  }
}

/**
 * Deleta avaliação (soft delete - marca como completed)
 * Complexidade: O(1)
 *
 * @param evaluationId - ID da avaliação
 */
export async function deleteEvaluation(evaluationId: string): Promise<void> {
  // Soft delete: apenas marca como completed
  // Não deletamos para manter histórico e auditoria
  await completeEvaluation(evaluationId);
}

/**
 * Conta avaliações por status
 * Útil para dashboard
 * Complexidade: O(N) onde N é o número total de avaliações
 *
 * @param creatorEmail - Email do criador
 * @returns Contagem por status
 */
export async function countEvaluationsByStatus(
  creatorEmail: string
): Promise<Record<EvaluationStatus, number>> {
  try {
    const emailHash = hash(creatorEmail.toLowerCase().trim());
    const q = query(
      collection(db, 'evaluations'),
      where('creator_email', '==', emailHash)
    );

    const querySnapshot = await getDocs(q);

    const counts: Record<EvaluationStatus, number> = {
      draft: 0,
      active: 0,
      completed: 0,
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      counts[data.status as EvaluationStatus]++;
    });

    return counts;
  } catch (error) {
    console.error('Erro ao contar avaliações:', error);
    return { draft: 0, active: 0, completed: 0 };
  }
}
