import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  and,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';
import type { Response, EvaluationFormData, ConsolidatedResult, TeamMember } from '@/types';
import {
  encrypt,
  decrypt,
  encryptNumber,
  decryptNumber,
  generateEncryptionKey,
} from '@/utils/crypto';
import { validateEvaluationForm } from '@/utils/validation';
import { sanitizeText } from '@/utils/sanitization';
import { debugLog } from '@/services/debug/debugLogger';

/**
 * Serviço de Respostas de Avaliação
 * Gerencia operações de respostas no Firestore
 * Complexidade: O(1) para operações individuais, O(N) para agregações
 */

/**
 * Interface para criação de resposta
 */
export interface CreateResponseData extends EvaluationFormData {
  evaluationId: string;
  evaluatorId: string;
  evaluatedId: string;
}

/**
 * Envia resposta de avaliação via Cloud Function (COM CRIPTOGRAFIA)
 * - Frontend envia dados plaintext
 * - Cloud Function criptografa e salva no Firestore
 * Complexidade: O(1)
 *
 * @param data - Dados da resposta
 * @returns Sucesso
 */
export async function submitResponseEncrypted(
  data: CreateResponseData
): Promise<void> {
  // Validação
  const validation = validateEvaluationForm(data);
  if (!validation.valid) {
    throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
  }

  try {
    debugLog.info('Enviando resposta via Cloud Function', {
      component: 'response.service',
      data: {
        evaluationId: data.evaluationId,
        evaluatorId: data.evaluatorId,
        evaluatedId: data.evaluatedId,
      }
    });

    // Sanitização dos dados antes de enviar
    const sanitizedPositive = sanitizeText(data.positive_points, 500);
    const sanitizedImprovement = sanitizeText(data.improvement_points, 500);

    // Chama Cloud Function que criptografa e salva
    const submitResponse = httpsCallable<
      {
        evaluationId: string;
        evaluatorId: string;
        evaluatedId: string;
        ratings: {
          question_1: number;
          question_2: number;
          question_3: number;
          question_4: number;
        };
        comments: {
          positive_points: string;
          improvement_points: string;
        };
      },
      { success: boolean }
    >(functions, 'submitResponse');

    const result = await submitResponse({
      evaluationId: data.evaluationId,
      evaluatorId: data.evaluatorId,
      evaluatedId: data.evaluatedId,
      ratings: {
        question_1: data.question_1,
        question_2: data.question_2,
        question_3: data.question_3,
        question_4: data.question_4,
      },
      comments: {
        positive_points: sanitizedPositive,
        improvement_points: sanitizedImprovement,
      },
    });

    if (!result.data.success) {
      throw new Error('Cloud Function retornou erro');
    }

    debugLog.success('Resposta enviada com sucesso', {
      component: 'response.service'
    });
  } catch (error) {
    debugLog.error('Erro ao enviar resposta via Cloud Function', error as Error, {
      component: 'response.service'
    });
    throw new Error('Falha ao salvar resposta no banco de dados');
  }
}

/**
 * Cria nova resposta de avaliação
 * Complexidade: O(1)
 *
 * @param data - Dados da resposta
 * @param managerToken - Token do gestor (para criptografia)
 * @returns Resposta criada
 */
export async function createResponse(
  data: CreateResponseData,
  managerToken: string
): Promise<Response> {
  // Validação
  const validation = validateEvaluationForm(data);
  if (!validation.valid) {
    throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
  }

  // Verifica se já existe resposta (evita duplicatas)
  const existing = await getResponse(
    data.evaluationId,
    data.evaluatorId,
    data.evaluatedId
  );

  if (existing) {
    throw new Error('Você já avaliou este membro');
  }

  // Sanitização
  const sanitizedPositive = sanitizeText(data.positive_points, 500);
  const sanitizedImprovement = sanitizeText(data.improvement_points, 500);

  // Criptografia
  const encryptionKey = generateEncryptionKey(managerToken);

  const responseData = {
    evaluation_id: data.evaluationId,
    evaluator_id: data.evaluatorId,
    evaluated_id: data.evaluatedId,
    question_1: parseInt(encryptNumber(data.question_1, encryptionKey)),
    question_2: parseInt(encryptNumber(data.question_2, encryptionKey)),
    question_3: parseInt(encryptNumber(data.question_3, encryptionKey)),
    question_4: parseInt(encryptNumber(data.question_4, encryptionKey)),
    positive_points: encrypt(sanitizedPositive, encryptionKey),
    improvement_points: encrypt(sanitizedImprovement, encryptionKey),
    created_at: Date.now(),
  };

  try {
    const docRef = await addDoc(collection(db, 'responses'), responseData);

    const response: Response = {
      id: docRef.id,
      evaluation_id: responseData.evaluation_id,
      evaluator_id: responseData.evaluator_id,
      evaluated_id: responseData.evaluated_id,
      question_1: data.question_1, // Retorna valores descriptografados
      question_2: data.question_2,
      question_3: data.question_3,
      question_4: data.question_4,
      positive_points: sanitizedPositive,
      improvement_points: sanitizedImprovement,
      created_at: responseData.created_at,
    };

    return response;
  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    throw new Error('Falha ao salvar resposta no banco de dados');
  }
}

/**
 * Busca resposta específica
 * Complexidade: O(N) onde N é o número de respostas (filtrado por índice)
 *
 * @param evaluationId - ID da avaliação
 * @param evaluatorId - ID do avaliador
 * @param evaluatedId - ID do avaliado
 * @returns Resposta ou null
 */
export async function getResponse(
  evaluationId: string,
  evaluatorId: string,
  evaluatedId: string
): Promise<Response | null> {
  try {
    const q = query(
      collection(db, 'responses'),
      and(
        where('evaluation_id', '==', evaluationId),
        where('evaluator_id', '==', evaluatorId),
        where('evaluated_id', '==', evaluatedId)
      )
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();

    return {
      id: docSnap.id,
      evaluation_id: data.evaluation_id,
      evaluator_id: data.evaluator_id,
      evaluated_id: data.evaluated_id,
      question_1: data.question_1,
      question_2: data.question_2,
      question_3: data.question_3,
      question_4: data.question_4,
      positive_points: data.positive_points, // Ainda criptografado
      improvement_points: data.improvement_points, // Ainda criptografado
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Erro ao buscar resposta:', error);
    return null;
  }
}

/**
 * Busca resultados consolidados via Cloud Function (v2 - COM DESCRIPTOGRAFIA BACKEND)
 * - Cloud Function busca dados criptografados do Firestore
 * - Descriptografa nomes, emails e comentários
 * - Calcula médias e agrega comentários
 * - Retorna dados plaintext para o frontend
 * Complexidade: O(N*M) onde N é membros e M é respostas por membro
 *
 * @param evaluationId - ID da avaliação
 * @returns Lista de resultados consolidados
 */
export async function getConsolidatedResultsEncrypted(
  evaluationId: string
): Promise<ConsolidatedResult[]> {
  try {
    debugLog.info('Chamando Cloud Function getResults', {
      component: 'response.service',
      data: { evaluationId }
    });

    // Chama Cloud Function que descriptografa e consolida
    const getResults = httpsCallable<
      { evaluationId: string },
      { results: ConsolidatedResult[] }
    >(functions, 'getResults');

    const result = await getResults({ evaluationId });

    debugLog.success(`${result.data.results.length} resultados consolidados carregados`, {
      component: 'response.service',
      data: { count: result.data.results.length }
    });

    return result.data.results;
  } catch (error) {
    debugLog.error('Erro ao buscar resultados consolidados via Cloud Function', error as Error, {
      component: 'response.service'
    });
    throw new Error('Falha ao carregar resultados consolidados');
  }
}

/**
 * Busca todas as respostas de um avaliado (LEGADO - NÃO RECOMENDADO)
 *
 * @deprecated Use getConsolidatedResultsEncrypted() que usa Cloud Function com criptografia
 *
 * Esta função faz acesso direto ao Firestore e tenta descriptografar dados no frontend.
 * Prefira usar getConsolidatedResultsEncrypted() que chama a Cloud Function.
 *
 * Usado para consolidar resultados
 * Complexidade: O(N) onde N é o número de respostas para o avaliado
 *
 * @param evaluationId - ID da avaliação
 * @param evaluatedId - ID do avaliado
 * @param managerToken - Token do gestor (para descriptografar)
 * @returns Lista de respostas descriptografadas
 */
export async function getResponsesForMember(
  evaluationId: string,
  evaluatedId: string,
  managerToken: string
): Promise<Response[]> {
  try {
    const q = query(
      collection(db, 'responses'),
      and(
        where('evaluation_id', '==', evaluationId),
        where('evaluated_id', '==', evaluatedId)
      )
    );

    const querySnapshot = await getDocs(q);
    const encryptionKey = generateEncryptionKey(managerToken);

    const responses: Response[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      try {
        responses.push({
          id: doc.id,
          evaluation_id: data.evaluation_id,
          evaluator_id: data.evaluator_id,
          evaluated_id: data.evaluated_id,
          question_1: decryptNumber(data.question_1.toString(), encryptionKey),
          question_2: decryptNumber(data.question_2.toString(), encryptionKey),
          question_3: decryptNumber(data.question_3.toString(), encryptionKey),
          question_4: decryptNumber(data.question_4.toString(), encryptionKey),
          positive_points: decrypt(data.positive_points, encryptionKey),
          improvement_points: decrypt(data.improvement_points, encryptionKey),
          created_at: data.created_at,
        });
      } catch (error) {
        console.error(`Erro ao descriptografar resposta ${doc.id}:`, error);
      }
    });

    return responses;
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return [];
  }
}

/**
 * Busca respostas que um membro ainda precisa fazer
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param evaluatorId - ID do avaliador
 * @param allMembers - Lista de todos os membros
 * @returns Lista de IDs dos membros que ainda precisam ser avaliados
 */
export async function getPendingEvaluations(
  evaluationId: string,
  evaluatorId: string,
  allMembers: TeamMember[]
): Promise<string[]> {
  try {
    // Busca todas as respostas já feitas por este avaliador
    const q = query(
      collection(db, 'responses'),
      and(
        where('evaluation_id', '==', evaluationId),
        where('evaluator_id', '==', evaluatorId)
      )
    );

    const querySnapshot = await getDocs(q);

    const completedIds = new Set<string>();
    querySnapshot.forEach((doc) => {
      completedIds.add(doc.data().evaluated_id);
    });

    // Retorna IDs dos membros ainda não avaliados (exceto o próprio avaliador)
    return allMembers
      .filter((member) => member.id !== evaluatorId && !completedIds.has(member.id))
      .map((member) => member.id);
  } catch (error) {
    console.error('Erro ao buscar avaliações pendentes:', error);
    return [];
  }
}

/**
 * Consolida resultados de um membro
 * Calcula médias e agrega comentários
 * Complexidade: O(N) onde N é o número de respostas para o membro
 *
 * @param member - Membro a ser consolidado
 * @param responses - Respostas para este membro
 * @returns Resultado consolidado
 */
export function consolidateMemberResults(
  member: TeamMember,
  responses: Response[]
): ConsolidatedResult {
  if (responses.length === 0) {
    return {
      member,
      averages: {
        overall: 0,
        question_1: 0,
        question_2: 0,
        question_3: 0,
        question_4: 0,
      },
      comments: {
        positive: [],
        improvement: [],
      },
      totalResponses: 0,
    };
  }

  // Calcula médias
  const sum = {
    question_1: 0,
    question_2: 0,
    question_3: 0,
    question_4: 0,
  };

  const positiveComments: string[] = [];
  const improvementComments: string[] = [];

  responses.forEach((response) => {
    sum.question_1 += response.question_1;
    sum.question_2 += response.question_2;
    sum.question_3 += response.question_3;
    sum.question_4 += response.question_4;

    positiveComments.push(response.positive_points);
    improvementComments.push(response.improvement_points);
  });

  const count = responses.length;

  const averages = {
    question_1: parseFloat((sum.question_1 / count).toFixed(2)),
    question_2: parseFloat((sum.question_2 / count).toFixed(2)),
    question_3: parseFloat((sum.question_3 / count).toFixed(2)),
    question_4: parseFloat((sum.question_4 / count).toFixed(2)),
    overall: 0,
  };

  // Média geral
  averages.overall = parseFloat(
    (
      (averages.question_1 +
        averages.question_2 +
        averages.question_3 +
        averages.question_4) /
      4
    ).toFixed(2)
  );

  return {
    member,
    averages,
    comments: {
      positive: positiveComments,
      improvement: improvementComments,
    },
    totalResponses: count,
  };
}

/**
 * Consolida resultados de toda a avaliação (LEGADO - NÃO RECOMENDADO)
 *
 * @deprecated Use getConsolidatedResultsEncrypted() que usa Cloud Function com criptografia
 *
 * Esta função faz acesso direto ao Firestore e tenta descriptografar dados no frontend.
 * Prefira usar getConsolidatedResultsEncrypted() que chama a Cloud Function.
 *
 * Complexidade: O(N*M) onde N é membros e M é respostas por membro
 *
 * @param evaluationId - ID da avaliação
 * @param members - Lista de membros
 * @param managerToken - Token do gestor
 * @returns Lista de resultados consolidados
 */
export async function consolidateAllResults(
  evaluationId: string,
  members: TeamMember[],
  managerToken: string
): Promise<ConsolidatedResult[]> {
  const results: ConsolidatedResult[] = [];

  for (const member of members) {
    const responses = await getResponsesForMember(
      evaluationId,
      member.id,
      managerToken
    );

    const consolidated = consolidateMemberResults(member, responses);
    results.push(consolidated);
  }

  return results;
}

/**
 * Conta total de respostas em uma avaliação
 * Útil para dashboard
 * Complexidade: O(N) onde N é o número total de respostas
 *
 * @param evaluationId - ID da avaliação
 * @returns Número de respostas
 */
export async function countResponses(evaluationId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'responses'),
      where('evaluation_id', '==', evaluationId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar respostas:', error);
    return 0;
  }
}

/**
 * Verifica se todos os membros completaram todas as avaliações
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param totalMembers - Número total de membros
 * @returns true se todos completaram
 */
export async function isEvaluationComplete(
  evaluationId: string,
  totalMembers: number
): Promise<boolean> {
  try {
    const totalResponses = await countResponses(evaluationId);

    // Cada membro avalia N-1 outros membros
    const expectedResponses = totalMembers * (totalMembers - 1);

    return totalResponses >= expectedResponses;
  } catch (error) {
    console.error('Erro ao verificar completude:', error);
    return false;
  }
}
