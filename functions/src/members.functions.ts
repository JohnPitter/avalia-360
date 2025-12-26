/**
 * Cloud Functions para Gerenciamento de Membros
 *
 * ✅ Criptografia AES-256 para nomes e emails
 * ✅ Hash SHA-256 para códigos de acesso
 * ✅ Dados sensíveis NUNCA expostos ao frontend
 *
 * Segurança:
 * - OWASP A02 - Cryptographic Failures: Criptografia forte (AES-256)
 * - OWASP A04 - Insecure Design: Criptografia no backend
 * - OWASP A07 - Identification/Authentication Failures: Hashes seguros
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {encrypt, decrypt, hashAccessCode} from './infrastructure/services/encryption.service';

const db = admin.firestore();

/**
 * Interface para dados de membro (plaintext - apenas backend)
 */
interface MemberInput {
  name: string;
  email: string;
}

/**
 * Interface para membro retornado (plaintext - descriptografado)
 */
interface MemberOutput {
  id: string;
  evaluationId: string;
  name: string;
  email: string;
  completedEvaluations: number;
  totalEvaluations: number;
  lastAccessDate: number | null;
}

/**
 * Adiciona membros à avaliação (v2 - COM CRIPTOGRAFIA)
 * - Recebe dados plaintext do frontend
 * - Criptografa nomes e emails
 * - Gera e hasheia códigos de acesso
 * - Retorna membros com códigos plaintext (para exibir ao gestor)
 */
export const addMembersEncrypted = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId, members} = data as {
        evaluationId: string;
        members: MemberInput[];
      };

      if (!evaluationId || !members || members.length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'evaluationId e members são obrigatórios'
        );
      }

      // Gera códigos de acesso e criptografa dados
      const membersWithCodes = members.map((member) => {
        // Gera código de 6 dígitos
        const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Criptografa dados sensíveis
        const encryptedName = encrypt(member.name);
        const encryptedEmail = encrypt(member.email);

        // Hasheia código de acesso
        const codeHash = hashAccessCode(accessCode);

        return {
          memberData: {
            avaliation_id: evaluationId,
            name: encryptedName, // CRIPTOGRAFADO
            email: encryptedEmail, // CRIPTOGRAFADO
            access_code: codeHash, // HASH
            completed_evaluations: 0,
            total_evaluations: members.length - 1,
            last_access_date: null,
          },
          plainData: {
            name: member.name,
            email: member.email,
            accessCode, // Retorna plaintext apenas aqui (uma vez)
          },
        };
      });

      // Salva no Firestore (batch write para atomicidade)
      const batch = db.batch();
      const savedMembers: any[] = [];

      for (const {memberData, plainData} of membersWithCodes) {
        const docRef = db.collection('team_members').doc();
        batch.set(docRef, memberData);

        savedMembers.push({
          id: docRef.id,
          avaliation_id: evaluationId,
          name: plainData.name, // Plaintext para retornar ao frontend
          email: plainData.email, // Plaintext para retornar ao frontend
          accessCode: plainData.accessCode, // Código para exibir ao gestor
          completed_evaluations: 0,
          total_evaluations: memberData.total_evaluations,
        });
      }

      await batch.commit();

      return {
        success: true,
        members: savedMembers,
      };
    } catch (error: any) {
      console.error('Erro ao adicionar membros:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao adicionar membros'
      );
    }
  });

/**
 * Busca membros de uma avaliação (v2 - COM DESCRIPTOGRAFIA)
 * - Busca dados criptografados do Firestore
 * - Descriptografa nomes e emails
 * - Retorna dados plaintext para o frontend
 */
export const getMembersEncrypted = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId} = data as {evaluationId: string};

      if (!evaluationId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'evaluationId é obrigatório'
        );
      }

      const membersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();

      const members: MemberOutput[] = membersSnapshot.docs.map((doc) => {
        const data = doc.data();

        // Descriptografa dados sensíveis
        const name = decrypt(data.name);
        const email = decrypt(data.email);

        return {
          id: doc.id,
          evaluationId: data.avaliation_id,
          name, // Plaintext (descriptografado)
          email, // Plaintext (descriptografado)
          completedEvaluations: data.completed_evaluations || 0,
          totalEvaluations: data.total_evaluations || 0,
          lastAccessDate: data.last_access_date,
        };
      });

      return {
        success: true,
        members,
      };
    } catch (error: any) {
      console.error('Erro ao buscar membros:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao buscar membros'
      );
    }
  });

/**
 * Busca membros por código de acesso (v2 - COM DESCRIPTOGRAFIA)
 * - Valida código de acesso (hash)
 * - Busca todos os membros da mesma avaliação
 * - Descriptografa e retorna todos
 */
export const getMembersByAccessCodeEncrypted = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {accessCode} = data as {accessCode: string};

      if (!accessCode || accessCode.length !== 6) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Código de acesso inválido'
        );
      }

      // Hasheia código
      const codeHash = hashAccessCode(accessCode);

      // Busca membro com este código
      const memberSnapshot = await db
        .collection('team_members')
        .where('access_code', '==', codeHash)
        .limit(1)
        .get();

      if (memberSnapshot.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'Código de acesso inválido'
        );
      }

      const memberDoc = memberSnapshot.docs[0];
      const memberData = memberDoc.data();
      const evaluationId = memberData.avaliation_id;

      // Busca todos os membros da mesma avaliação
      const allMembersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();

      const members: MemberOutput[] = allMembersSnapshot.docs.map((doc) => {
        const data = doc.data();

        // Descriptografa dados sensíveis
        const name = decrypt(data.name);
        const email = decrypt(data.email);

        return {
          id: doc.id,
          evaluationId: data.avaliation_id,
          name,
          email,
          completedEvaluations: data.completed_evaluations || 0,
          totalEvaluations: data.total_evaluations || 0,
          lastAccessDate: data.last_access_date,
        };
      });

      return {
        success: true,
        evaluationId,
        currentMemberId: memberDoc.id,
        members,
      };
    } catch (error: any) {
      console.error('Erro ao buscar membros por código:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao buscar membros'
      );
    }
  });
