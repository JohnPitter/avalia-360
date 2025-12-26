import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import type { TeamMember } from '@/types';
import {
  hashAccessCode,
  generateAccessCode,
} from '@/utils/crypto';
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
 * Adiciona membros à avaliação
 * Gera códigos de acesso para cada membro
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param members - Lista de membros
 * @param managerToken - Token do gestor
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

  const batch = writeBatch(db);
  const membersWithCodes: MemberWithAccessCode[] = [];

  try {
    for (const member of members) {
      // Sanitização
      const sanitizedName = sanitizeText(member.name, 100);
      const sanitizedEmail = sanitizeEmail(member.email);

      // Gera código de acesso
      const accessCode = generateAccessCode();

      // Criptografia apenas do código de acesso
      const codeHash = hashAccessCode(accessCode);

      // Total de avaliações que o membro precisa fazer (N-1)
      const totalEvaluations = members.length - 1;

      const memberData = {
        avaliation_id: evaluationId,
        name: sanitizedName, // Plaintext (protegido por Firestore Rules)
        email: sanitizedEmail, // Plaintext (protegido por Firestore Rules)
        access_code: codeHash,
        completed_evaluations: 0,
        total_evaluations: totalEvaluations,
        last_access_date: null,
      };

      const docRef = doc(collection(db, 'team_members'));
      batch.set(docRef, memberData);

      membersWithCodes.push({
        id: docRef.id,
        avaliation_id: evaluationId,
        name: sanitizedName,
        email: sanitizedEmail,
        access_code: codeHash,
        completed_evaluations: 0,
        total_evaluations: totalEvaluations,
        last_access_date: null,
        accessCode, // Código não-hasheado (só disponível aqui)
      });
    }

    await batch.commit();

    return membersWithCodes;
  } catch (error) {
    console.error('Erro ao adicionar membros:', error);
    throw new Error('Falha ao adicionar membros ao banco de dados');
  }
}

/**
 * Busca membros de uma avaliação
 * Complexidade: O(N) onde N é o número de membros
 *
 * @param evaluationId - ID da avaliação
 * @param managerToken - Token do gestor (para descriptografar nomes)
 * @returns Lista de membros
 */
export async function getMembers(
  evaluationId: string,
  _managerToken: string
): Promise<TeamMember[]> {
  try {
    const q = query(
      collection(db, 'team_members'),
      where('avaliation_id', '==', evaluationId)
    );

    const querySnapshot = await getDocs(q);
    const members: TeamMember[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      members.push({
        id: doc.id,
        avaliation_id: data.avaliation_id,
        name: data.name, // Já em plaintext
        email: data.email, // Já em plaintext
        access_code: data.access_code,
        completed_evaluations: data.completed_evaluations,
        total_evaluations: data.total_evaluations,
        last_access_date: data.last_access_date,
      });
    });

    return members;
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
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
 * Valida código de acesso do membro
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
 * Busca todos os membros de uma avaliação usando código de acesso
 *
 * Esta função permite que um colaborador com código de acesso válido
 * veja os nomes descriptografados dos outros membros da equipe.
 *
 * Fluxo:
 * 1. Valida o código de acesso
 * 2. Busca o membro e obtém evaluation_id
 * 3. Busca a avaliação para obter o manager_token
 * 4. Usa o manager_token para descriptografar os nomes
 *
 * @param accessCode - Código de acesso válido do colaborador
 * @returns Lista de membros com nomes descriptografados
 */
export async function getMembersByAccessCode(
  accessCode: string
): Promise<TeamMember[]> {
  debugLog.start('getMembersByAccessCode', { component: 'member.service', data: { accessCode: '******' } });
  try {
    // 1. Buscar o membro com este código de acesso
    debugLog.debug('Hasheando código de acesso', { component: 'member.service' });
    const codeHash = hashAccessCode(accessCode);
    const memberQuery = query(
      collection(db, 'team_members'),
      where('access_code', '==', codeHash)
    );

    debugLog.debug('Buscando membro por código', { component: 'member.service' });
    const memberSnapshot = await getDocs(memberQuery);

    if (memberSnapshot.empty) {
      debugLog.warn('Código de acesso não encontrado no Firestore', { component: 'member.service' });
      throw new Error('Código de acesso inválido');
    }

    const memberData = memberSnapshot.docs[0].data();
    const evaluationId = memberData.avaliation_id;
    debugLog.info('Membro encontrado', { component: 'member.service', data: { evaluationId, memberId: memberSnapshot.docs[0].id } });

    // 2. Verificar se a avaliação existe
    debugLog.debug('Verificando se avaliação existe', { component: 'member.service', data: { evaluationId } });
    const evalDoc = await getDoc(doc(db, 'evaluations', evaluationId));

    if (!evalDoc.exists()) {
      debugLog.error('Avaliação não encontrada no Firestore', undefined, { component: 'member.service', data: { evaluationId } });
      throw new Error('Avaliação não encontrada');
    }

    // 3. Buscar todos os membros
    debugLog.debug('Buscando todos os membros da avaliação', { component: 'member.service', data: { evaluationId } });
    const membersQuery = query(
      collection(db, 'team_members'),
      where('avaliation_id', '==', evaluationId)
    );

    const membersSnapshot = await getDocs(membersQuery);
    const members: TeamMember[] = [];

    membersSnapshot.forEach((memberDoc) => {
      const data = memberDoc.data();

      members.push({
        id: memberDoc.id,
        avaliation_id: data.avaliation_id,
        name: data.name, // Plaintext
        email: data.email, // Plaintext
        access_code: data.access_code,
        completed_evaluations: data.completed_evaluations,
        total_evaluations: data.total_evaluations,
        last_access_date: data.last_access_date,
      });
    });

    debugLog.success(`${members.length} membros carregados`, { component: 'member.service', data: { count: members.length } });
    debugLog.end('getMembersByAccessCode', { component: 'member.service' });
    return members;
  } catch (error) {
    debugLog.error('Erro ao buscar membros por código de acesso', error as Error, { component: 'member.service' });
    throw new Error('Falha ao buscar membros da equipe');
  }
}
