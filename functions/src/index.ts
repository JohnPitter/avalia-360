/**
 * Firebase Cloud Functions - Avalia 360°
 *
 * ✨ CLEAN ARCHITECTURE IMPLEMENTADA ✨
 *
 * Estrutura:
 * - Domain: Entities + Repository Interfaces (núcleo puro)
 * - Application: Use Cases (regras de negócio)
 * - Infrastructure: Repositories + Services (Firestore, Crypto)
 * - Presentation: Controllers + HTTP (Cloud Functions)
 *
 * Benefícios:
 * ✅ Testabilidade: Cada camada pode ser testada isoladamente
 * ✅ Manutenibilidade: Mudanças isoladas por responsabilidade
 * ✅ Escalabilidade: Fácil adicionar novos use cases
 * ✅ Independência: Domain não depende de frameworks
 */

// Exporta todas as Cloud Functions implementadas com Clean Architecture
export * from './presentation/http/functions';

// Funções auxiliares (serão migradas para Use Cases futuramente)
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as CryptoJS from 'crypto-js';

const db = admin.firestore();

function hash(text: string): string {
  return CryptoJS.SHA256(text).toString();
}

function hashAccessCode(code: string): string {
  return CryptoJS.SHA256(code).toString();
}

export const validateManagerAccess = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId, email} = data;
      const emailHash = hash(email.toLowerCase().trim());
      const evalDoc = await db.collection('evaluations').doc(evaluationId).get();
      if (!evalDoc.exists) return {hasAccess: false};
      const evalData = evalDoc.data()!;
      return {hasAccess: evalData.creator_email === emailHash};
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao validar acesso');
    }
  });

export const getEvaluation = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId} = data;
      const evalDoc = await db.collection('evaluations').doc(evaluationId).get();
      if (!evalDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Avaliação não encontrada');
      }
      const evalData = evalDoc.data()!;
      return {
        id: evalDoc.id,
        title: evalData.title,
        createdAt: evalData.created_at,
        status: evalData.status,
      };
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao buscar avaliação');
    }
  });

export const activateEvaluation = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId} = data;
      await db.collection('evaluations').doc(evaluationId).update({
        status: 'active',
        activated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {success: true};
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao ativar avaliação');
    }
  });

export const getMemberByAccessCode = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {accessCode} = data;
      const codeHash = hashAccessCode(accessCode);
      const memberSnapshot = await db
        .collection('team_members')
        .where('access_code', '==', codeHash)
        .limit(1)
        .get();
      if (memberSnapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'Código não encontrado');
      }
      const memberDoc = memberSnapshot.docs[0];
      const memberData = memberDoc.data();
      return {
        member: {
          id: memberDoc.id,
          name: memberData.email.split('@')[0],
          email: memberData.email,
          evaluationId: memberData.avaliation_id,
          completedEvaluations: memberData.completed_evaluations || 0,
          totalEvaluations: memberData.total_evaluations || 0,
        },
      };
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao buscar membro');
    }
  });

export const getPendingEvaluations = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId, memberId} = data;
      const membersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();
      const allMemberIds = membersSnapshot.docs
        .map((doc) => doc.id)
        .filter((id) => id !== memberId);
      const responsesSnapshot = await db
        .collection('responses')
        .where('evaluation_id', '==', evaluationId)
        .where('evaluator_id', '==', memberId)
        .get();
      const evaluatedIds = responsesSnapshot.docs.map(
        (doc) => doc.data().evaluated_id
      );
      const pendingIds = allMemberIds.filter((id) => !evaluatedIds.includes(id));
      return {pendingIds};
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao buscar pendentes');
    }
  });

export const getMembersWithProgress = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId} = data;
      const membersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();
      const members = membersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.email.split('@')[0],
          email: data.email,
          completedEvaluations: data.completed_evaluations || 0,
          totalEvaluations: data.total_evaluations || 0,
          lastAccessDate: data.last_access_date,
        };
      });
      return {members};
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao buscar membros');
    }
  });

export const countResponses = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const {evaluationId} = data;
      const responsesSnapshot = await db
        .collection('responses')
        .where('evaluation_id', '==', evaluationId)
        .get();
      return {count: responsesSnapshot.size};
    } catch (error: any) {
      throw new functions.https.HttpsError('internal', 'Erro ao contar respostas');
    }
  });
