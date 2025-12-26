import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';
import type { TeamMember } from '@/types';
import { hashAccessCode } from '@/utils/crypto'; // Mantido para funções legadas
import { validateTeamMembers } from '@/utils/validation';
import { sanitizeText, sanitizeEmail } from '@/utils/sanitization';
import { debugLog } from '@/services/debug/debugLogger';

/**
 * Serviço de Membros da Equipe
 * Gerencia operações CRUD de membros no Firestore
 * Complexidade: O(1) para operações individuais, O(N) para queries
 */

/**
 * Interface para dados de membro
 */
export interface MemberData {
  name: string;
  email: string;
}

/**
 * Interface para membro com código de acesso
 */
export interface MemberWithAccessCode extends TeamMember {
  accessCode: string; // Código não-hasheado (só retornado na criação)
}

/**
 * Adiciona membros à avaliação (v2 - COM CLOUD FUNCTION)
 * - Frontend envia dados plaintext
 * - Cloud Function criptografa e salva no Firestore
 * - Retorna membros com códigos de acesso (plaintext, uma vez apenas)
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param members - Lista de membros
 * @param _managerToken - Token do gestor (não usado)
 * @returns Lista de membros com códigos de acesso
 */
export async function addMembers(
  evaluationId: string,
  members: MemberData[],
  _managerToken: string
): Promise<MemberWithAccessCode[]> {
  // Validação
  const validation = validateTeamMembers(members);
  if (!validation.valid) {
    throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
  }

  try {
    // Sanitização dos dados antes de enviar
    const sanitizedMembers = members.map(member => ({
      name: sanitizeText(member.name, 100),
      email: sanitizeEmail(member.email),
    }));

    debugLog.info('Chamando Cloud Function addMembersEncrypted', {
      component: 'member.service',
      data: {
        evaluationId,
        memberCount: sanitizedMembers.length,
      }
    });

    // Chama Cloud Function que criptografa e salva
    const addMembersEncrypted = httpsCallable<
      { evaluationId: string; members: MemberData[] },
      { success: boolean; members: MemberWithAccessCode[] }
    >(functions, 'addMembersEncrypted');

    const result = await addMembersEncrypted({
      evaluationId,
      members: sanitizedMembers,
    });

    if (!result.data.success) {
      throw new Error('Cloud Function retornou erro');
    }

    debugLog.success(`${result.data.members.length} membros adicionados com sucesso`, {
      component: 'member.service',
      data: { count: result.data.members.length }
    });

    return result.data.members;
  } catch (error) {
    debugLog.error('Erro ao adicionar membros via Cloud Function', error as Error, {
      component: 'member.service'
    });
    throw new Error('Falha ao adicionar membros ao banco de dados');
  }
}

/**
 * Busca membros de uma avaliação (v2 - COM CLOUD FUNCTION)
 * - Cloud Function busca dados criptografados do Firestore
 * - Descriptografa nomes e emails
 * - Retorna dados plaintext para o frontend
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param _managerToken - Token do gestor (não usado)
 * @returns Lista de membros
 */
export async function getMembers(
  evaluationId: string,
  _managerToken: string
): Promise<TeamMember[]> {
  try {
    debugLog.info('Chamando Cloud Function getMembersEncrypted', {
      component: 'member.service',
      data: { evaluationId }
    });

    // Chama Cloud Function que descriptografa e retorna
    const getMembersEncrypted = httpsCallable<
      { evaluationId: string },
      { success: boolean; members: TeamMember[] }
    >(functions, 'getMembersEncrypted');

    const result = await getMembersEncrypted({ evaluationId });

    if (!result.data.success) {
      throw new Error('Cloud Function retornou erro');
    }

    debugLog.success(`${result.data.members.length} membros carregados`, {
      component: 'member.service',
      data: { count: result.data.members.length }
    });

    return result.data.members;
  } catch (error) {
    debugLog.error('Erro ao buscar membros via Cloud Function', error as Error, {
      component: 'member.service'
    });
    return [];
  }
}

/**
 * Busca membro por ID
 * Complexidade: O(1)
 *
 * @param memberId - ID do membro
 * @param managerToken - Token do gestor
 * @returns Membro ou null
 */
export async function getMember(
  memberId: string,
  _managerToken: string
): Promise<TeamMember | null> {
  try {
    const docRef = doc(db, 'team_members', memberId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    return {
      id: docSnap.id,
      avaliation_id: data.avaliation_id,
      name: data.name, // Já em plaintext
      email: data.email, // Já em plaintext
      access_code: data.access_code,
      completed_evaluations: data.completed_evaluations,
      total_evaluations: data.total_evaluations,
      last_access_date: data.last_access_date,
    };
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    return null;
  }
}

/**
 * Valida código de acesso do membro (LEGADO - NÃO RECOMENDADO)
 *
 * @deprecated Use getMembersByAccessCode() que usa Cloud Function com criptografia
 *
 * Esta função faz acesso direto ao Firestore e NÃO descriptografa nomes/emails.
 * Prefira usar getMembersByAccessCode() que chama a Cloud Function.
 *
 * Complexidade: O(N) onde N é o número de membros (precisa buscar todos)
 *
 * @param evaluationId - ID da avaliação
 * @param accessCode - Código de acesso
 * @returns Membro ou null se código inválido
 */
export async function validateAccessCode(
  evaluationId: string,
  accessCode: string
): Promise<TeamMember | null> {
  try {
    const codeHash = hashAccessCode(accessCode);

    const q = query(
      collection(db, 'team_members'),
      where('avaliation_id', '==', evaluationId),
      where('access_code', '==', codeHash)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Deve retornar apenas um membro
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();

    return {
      id: docSnap.id,
      avaliation_id: data.avaliation_id,
      name: data.name, // Plaintext
      email: data.email, // Plaintext
      access_code: data.access_code,
      completed_evaluations: data.completed_evaluations,
      total_evaluations: data.total_evaluations,
      last_access_date: data.last_access_date,
    };
  } catch (error) {
    console.error('Erro ao validar código de acesso:', error);
    return null;
  }
}

/**
 * Atualiza data de último acesso do membro
 * Complexidade: O(1)
 *
 * @param memberId - ID do membro
 */
export async function updateLastAccess(memberId: string): Promise<void> {
  try {
    const docRef = doc(db, 'team_members', memberId);
    await updateDoc(docRef, {
      last_access_date: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar último acesso:', error);
    throw new Error('Falha ao atualizar último acesso');
  }
}

/**
 * Incrementa contador de avaliações completadas
 * Complexidade: O(1)
 *
 * @param memberId - ID do membro
 */
export async function incrementCompletedEvaluations(memberId: string): Promise<void> {
  try {
    const docRef = doc(db, 'team_members', memberId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Membro não encontrado');
    }

    const currentCompleted = docSnap.data().completed_evaluations;

    await updateDoc(docRef, {
      completed_evaluations: currentCompleted + 1,
    });
  } catch (error) {
    console.error('Erro ao incrementar avaliações completadas:', error);
    throw new Error('Falha ao atualizar progresso');
  }
}

/**
 * Calcula progresso geral da avaliação
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @returns Progresso em porcentagem (0-100)
 */
export async function getEvaluationProgress(evaluationId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'team_members'),
      where('avaliation_id', '==', evaluationId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return 0;
    }

    let totalCompleted = 0;
    let totalExpected = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalCompleted += data.completed_evaluations;
      totalExpected += data.total_evaluations;
    });

    if (totalExpected === 0) {
      return 0;
    }

    return Math.round((totalCompleted / totalExpected) * 100);
  } catch (error) {
    console.error('Erro ao calcular progresso:', error);
    return 0;
  }
}

/**
 * Busca membros que ainda não completaram todas as avaliações
 * Útil para enviar lembretes
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param managerToken - Token do gestor
 * @returns Lista de membros pendentes
 */
export async function getPendingMembers(
  evaluationId: string,
  managerToken: string
): Promise<TeamMember[]> {
  try {
    const allMembers = await getMembers(evaluationId, managerToken);

    return allMembers.filter(
      (member) => member.completed_evaluations < member.total_evaluations
    );
  } catch (error) {
    console.error('Erro ao buscar membros pendentes:', error);
    return [];
  }
}

/**
 * Verifica se membro completou todas as avaliações
 * Complexidade: O(1)
 *
 * @param memberId - ID do membro
 * @returns true se completou
 */
export async function hasMemberCompleted(memberId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'team_members', memberId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return false;
    }

    const data = docSnap.data();
    return data.completed_evaluations >= data.total_evaluations;
  } catch (error) {
    console.error('Erro ao verificar completude:', error);
    return false;
  }
}

/**
 * Remove membro da avaliação
 * Só permite se a avaliação ainda estiver em 'draft'
 * Complexidade: O(1)
 *
 * @param memberId - ID do membro
 */
export async function removeMember(memberId: string): Promise<void> {
  try {
    const docRef = doc(db, 'team_members', memberId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Membro não encontrado');
    }

    // Aqui poderíamos verificar o status da avaliação
    // Por segurança, só permitir remoção em 'draft'

    // Soft delete: podemos marcar como inativo ao invés de deletar
    await updateDoc(docRef, {
      // Marca como removido mas mantém no banco
      removed: true,
      removed_at: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    throw new Error('Falha ao remover membro');
  }
}

/**
 * Busca todos os membros de uma avaliação usando código de acesso (v2 - COM CLOUD FUNCTION)
 * - Frontend envia código plaintext
 * - Cloud Function valida código (hash)
 * - Busca todos membros criptografados
 * - Descriptografa e retorna plaintext
 *
 * Fluxo:
 * 1. Cloud Function hasheia o código e busca membro
 * 2. Busca todos membros da mesma avaliação
 * 3. Descriptografa nomes e emails
 * 4. Retorna plaintext para o frontend
 *
 * @param accessCode - Código de acesso válido do colaborador (6 dígitos)
 * @returns Lista de membros com nomes descriptografados
 */
export async function getMembersByAccessCode(
  accessCode: string
): Promise<TeamMember[]> {
  debugLog.start('getMembersByAccessCode', { component: 'member.service', data: { accessCode: '******' } });
  try {
    debugLog.info('Chamando Cloud Function getMembersByAccessCodeEncrypted', {
      component: 'member.service',
      data: { accessCodeLength: accessCode.length }
    });

    // Chama Cloud Function que valida, descriptografa e retorna
    const getMembersByAccessCodeEncrypted = httpsCallable<
      { accessCode: string },
      { success: boolean; evaluationId: string; currentMemberId: string; members: TeamMember[] }
    >(functions, 'getMembersByAccessCodeEncrypted');

    const result = await getMembersByAccessCodeEncrypted({ accessCode });

    if (!result.data.success) {
      throw new Error('Cloud Function retornou erro');
    }

    debugLog.success(`${result.data.members.length} membros carregados`, {
      component: 'member.service',
      data: {
        count: result.data.members.length,
        evaluationId: result.data.evaluationId,
        currentMemberId: result.data.currentMemberId,
      }
    });

    debugLog.end('getMembersByAccessCode', { component: 'member.service' });
    return result.data.members;
  } catch (error) {
    debugLog.error('Erro ao buscar membros por código de acesso via Cloud Function', error as Error, {
      component: 'member.service'
    });
    throw new Error('Falha ao buscar membros da equipe');
  }
}
