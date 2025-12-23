import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { EvaluationFormData } from '@/types';
import { encrypt, decrypt } from '@/utils/crypto';

// Chave para criptografia de rascunhos (deve ser a mesma que a evaluation)
const DRAFT_ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-draft-key-change-in-production';

/**
 * Rascunho de avaliação salvo no Firestore
 */
export interface Draft {
  id: string; // evaluator_id + evaluated_id
  evaluation_id: string;
  evaluator_id: string;
  evaluated_id: string;
  form_data: string; // Encrypted EvaluationFormData JSON
  saved_at: number; // Timestamp
  expires_at: number; // Timestamp (30 dias)
}

/**
 * Dados do rascunho descriptografados
 */
export interface DraftData {
  formData: EvaluationFormData;
  savedAt: number;
}

const DRAFTS_COLLECTION = 'drafts';
const DRAFT_EXPIRATION_DAYS = 30; // Rascunhos expiram em 30 dias

/**
 * Gera ID único para o rascunho
 * Formato: {evaluator_id}_{evaluated_id}
 *
 * Complexidade: O(1)
 */
function generateDraftId(evaluatorId: string, evaluatedId: string): string {
  return `${evaluatorId}_${evaluatedId}`;
}

/**
 * Salva rascunho da avaliação no Firestore
 *
 * @param evaluationId ID da avaliação
 * @param evaluatorId ID de quem está avaliando
 * @param evaluatedId ID de quem está sendo avaliado
 * @param formData Dados do formulário
 *
 * Complexidade: O(1) - Operação Firestore de escrita
 * Performance: ~100-200ms (latência de rede)
 */
export async function saveDraft(
  evaluationId: string,
  evaluatorId: string,
  evaluatedId: string,
  formData: EvaluationFormData
): Promise<void> {
  try {
    const draftId = generateDraftId(evaluatorId, evaluatedId);
    const now = Date.now();
    const expiresAt = now + DRAFT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    // Criptografar dados do formulário
    const encryptedData = encrypt(JSON.stringify(formData), DRAFT_ENCRYPTION_KEY);

    const draft: Draft = {
      id: draftId,
      evaluation_id: evaluationId,
      evaluator_id: evaluatorId,
      evaluated_id: evaluatedId,
      form_data: encryptedData,
      saved_at: now,
      expires_at: expiresAt,
    };

    const draftRef = doc(db, DRAFTS_COLLECTION, draftId);
    await setDoc(draftRef, draft);
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    throw new Error('Falha ao salvar rascunho');
  }
}

/**
 * Carrega rascunho salvo do Firestore
 *
 * @param evaluatorId ID de quem está avaliando
 * @param evaluatedId ID de quem está sendo avaliado
 * @returns Dados do rascunho ou null se não existir
 *
 * Complexidade: O(1) - Operação Firestore de leitura por ID
 * Performance: ~50-100ms (latência de rede)
 */
export async function loadDraft(
  evaluatorId: string,
  evaluatedId: string
): Promise<DraftData | null> {
  try {
    const draftId = generateDraftId(evaluatorId, evaluatedId);
    const draftRef = doc(db, DRAFTS_COLLECTION, draftId);
    const draftSnap = await getDoc(draftRef);

    if (!draftSnap.exists()) {
      return null;
    }

    const draft = draftSnap.data() as Draft;

    // Verificar expiração
    const now = Date.now();
    if (draft.expires_at < now) {
      // Rascunho expirado, deletar
      await deleteDoc(draftRef);
      return null;
    }

    // Descriptografar dados
    const decryptedData = decrypt(draft.form_data, DRAFT_ENCRYPTION_KEY);
    const formData = JSON.parse(decryptedData) as EvaluationFormData;

    return {
      formData,
      savedAt: draft.saved_at,
    };
  } catch (error) {
    console.error('Erro ao carregar rascunho:', error);
    return null;
  }
}

/**
 * Deleta rascunho após submissão final
 *
 * @param evaluatorId ID de quem está avaliando
 * @param evaluatedId ID de quem está sendo avaliado
 *
 * Complexidade: O(1) - Operação Firestore de deleção
 * Performance: ~50-100ms (latência de rede)
 */
export async function deleteDraft(
  evaluatorId: string,
  evaluatedId: string
): Promise<void> {
  try {
    const draftId = generateDraftId(evaluatorId, evaluatedId);
    const draftRef = doc(db, DRAFTS_COLLECTION, draftId);
    await deleteDoc(draftRef);
  } catch (error) {
    console.error('Erro ao deletar rascunho:', error);
    // Não lançar erro - deleção de rascunho não é crítica
  }
}

/**
 * Limpa rascunhos expirados de uma avaliação
 * Deve ser chamado periodicamente (ex: daily job)
 *
 * @param evaluationId ID da avaliação
 *
 * Complexidade: O(N) onde N = número de rascunhos da avaliação
 * Performance: ~100ms + (50ms * N) para N rascunhos
 */
export async function cleanExpiredDrafts(evaluationId: string): Promise<number> {
  try {
    const now = Date.now();
    const draftsRef = collection(db, DRAFTS_COLLECTION);
    const q = query(
      draftsRef,
      where('evaluation_id', '==', evaluationId),
      where('expires_at', '<', now)
    );

    const querySnapshot = await getDocs(q);
    let deletedCount = 0;

    // Deletar todos os rascunhos expirados
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    deletedCount = querySnapshot.docs.length;

    return deletedCount;
  } catch (error) {
    console.error('Erro ao limpar rascunhos expirados:', error);
    return 0;
  }
}

/**
 * Verifica se existe rascunho para uma avaliação específica
 *
 * @param evaluatorId ID de quem está avaliando
 * @param evaluatedId ID de quem está sendo avaliado
 * @returns true se existe rascunho válido
 *
 * Complexidade: O(1) - Operação Firestore de leitura
 * Performance: ~50-100ms (latência de rede)
 */
export async function hasDraft(
  evaluatorId: string,
  evaluatedId: string
): Promise<boolean> {
  try {
    const draftId = generateDraftId(evaluatorId, evaluatedId);
    const draftRef = doc(db, DRAFTS_COLLECTION, draftId);
    const draftSnap = await getDoc(draftRef);

    if (!draftSnap.exists()) {
      return false;
    }

    const draft = draftSnap.data() as Draft;
    const now = Date.now();

    // Verificar se não expirou
    return draft.expires_at >= now;
  } catch (error) {
    console.error('Erro ao verificar rascunho:', error);
    return false;
  }
}
