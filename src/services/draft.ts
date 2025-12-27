import { EvaluationFormData } from '@/types';

// Storage key prefix para rascunhos no localStorage
const DRAFT_STORAGE_PREFIX = 'avalia360_draft_';

/**
 * Rascunho de avaliação salvo no localStorage
 */
export interface Draft {
  evaluation_id: string;
  evaluator_id: string;
  evaluated_id: string;
  form_data: EvaluationFormData; // Dados plaintext no localStorage
  saved_at: number; // Timestamp
  expires_at: number; // Timestamp (7 dias)
}

/**
 * Dados do rascunho descriptografados
 */
export interface DraftData {
  formData: EvaluationFormData;
  savedAt: number;
}

const DRAFT_EXPIRATION_DAYS = 7; // Rascunhos expiram em 7 dias

/**
 * Gera chave única para o rascunho no localStorage
 * Formato: avalia360_draft_{evaluator_id}_{evaluated_id}
 *
 * Complexidade: O(1)
 */
function generateDraftKey(evaluatorId: string, evaluatedId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${evaluatorId}_${evaluatedId}`;
}

/**
 * Salva rascunho da avaliação no localStorage
 *
 * @param evaluationId ID da avaliação
 * @param evaluatorId ID de quem está avaliando
 * @param evaluatedId ID de quem está sendo avaliado
 * @param formData Dados do formulário
 *
 * Complexidade: O(1) - Operação de escrita no localStorage
 * Performance: ~1-5ms (síncrono, sem latência de rede)
 */
export async function saveDraft(
  evaluationId: string,
  evaluatorId: string,
  evaluatedId: string,
  formData: EvaluationFormData
): Promise<void> {
  try {
    const draftKey = generateDraftKey(evaluatorId, evaluatedId);
    const now = Date.now();
    const expiresAt = now + DRAFT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    const draft: Draft = {
      evaluation_id: evaluationId,
      evaluator_id: evaluatorId,
      evaluated_id: evaluatedId,
      form_data: formData,
      saved_at: now,
      expires_at: expiresAt,
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    throw new Error('Falha ao salvar rascunho');
  }
}

/**
 * Carrega rascunho salvo do localStorage
 *
 * @param evaluatorId ID de quem está avaliando
 * @param evaluatedId ID de quem está sendo avaliado
 * @returns Dados do rascunho ou null se não existir
 *
 * Complexidade: O(1) - Operação de leitura do localStorage
 * Performance: ~1-5ms (síncrono)
 */
export async function loadDraft(
  evaluatorId: string,
  evaluatedId: string
): Promise<DraftData | null> {
  try {
    const draftKey = generateDraftKey(evaluatorId, evaluatedId);
    const draftJson = localStorage.getItem(draftKey);

    if (!draftJson) {
      return null;
    }

    const draft = JSON.parse(draftJson) as Draft;

    // Verificar expiração
    const now = Date.now();
    if (draft.expires_at < now) {
      // Rascunho expirado, deletar
      localStorage.removeItem(draftKey);
      return null;
    }

    return {
      formData: draft.form_data,
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
 * Complexidade: O(1) - Operação de deleção do localStorage
 * Performance: ~1-5ms (síncrono)
 */
export async function deleteDraft(
  evaluatorId: string,
  evaluatedId: string
): Promise<void> {
  try {
    const draftKey = generateDraftKey(evaluatorId, evaluatedId);
    localStorage.removeItem(draftKey);
  } catch (error) {
    console.error('Erro ao deletar rascunho:', error);
    // Não lançar erro - deleção de rascunho não é crítica
  }
}

/**
 * Limpa rascunhos expirados do localStorage
 * Varre todos os drafts e remove os expirados
 *
 * Complexidade: O(N) onde N = número de itens no localStorage
 * Performance: ~10-50ms dependendo do tamanho do localStorage
 */
export async function cleanExpiredDrafts(): Promise<number> {
  try {
    const now = Date.now();
    let deletedCount = 0;

    // Varrer todas as chaves do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(DRAFT_STORAGE_PREFIX)) {
        const draftJson = localStorage.getItem(key);

        if (draftJson) {
          try {
            const draft = JSON.parse(draftJson) as Draft;

            if (draft.expires_at < now) {
              localStorage.removeItem(key);
              deletedCount++;
            }
          } catch {
            // JSON inválido, remover
            localStorage.removeItem(key);
            deletedCount++;
          }
        }
      }
    }

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
 * Complexidade: O(1) - Operação de leitura do localStorage
 * Performance: ~1-5ms (síncrono)
 */
export async function hasDraft(
  evaluatorId: string,
  evaluatedId: string
): Promise<boolean> {
  try {
    const draftKey = generateDraftKey(evaluatorId, evaluatedId);
    const draftJson = localStorage.getItem(draftKey);

    if (!draftJson) {
      return false;
    }

    const draft = JSON.parse(draftJson) as Draft;
    const now = Date.now();

    // Verificar se não expirou
    return draft.expires_at >= now;
  } catch (error) {
    console.error('Erro ao verificar rascunho:', error);
    return false;
  }
}
