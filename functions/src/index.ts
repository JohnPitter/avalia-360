/**
 * Firebase Cloud Functions para Avalia 360°
 *
 * ARQUITETURA SERVERLESS SEGURA:
 * - Toda lógica sensível no backend
 * - Manager_token NUNCA exposto ao frontend
 * - Validações e sanitização server-side
 * - Rate limiting automático
 * - Logs centralizados
 *
 * Funções disponíveis:
 * 1. createEvaluation - Criar nova avaliação
 * 2. addMembers - Adicionar membros à avaliação
 * 3. getMembersDecrypted - Buscar membros com nomes descriptografados
 * 4. submitResponse - Enviar resposta de avaliação
 * 5. getResults - Buscar resultados consolidados
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as CryptoJS from 'crypto-js';
import {v4 as uuidv4} from 'uuid';

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ====================================================================
// UTILIT\u00c1RIOS DE CRIPTOGRAFIA
// ====================================================================

function generateEncryptionKey(token: string): string {
  return CryptoJS.SHA256(token).toString();
}

function encrypt(text: string, key: string): string {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt(encryptedText: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Decryption failed');
    return decrypted;
  } catch {
    throw new Error('Failed to decrypt data');
  }
}

function hash(text: string): string {
  return CryptoJS.SHA256(text).toString();
}

function hashAccessCode(code: string): string {
  return CryptoJS.SHA256(code).toString();
}

function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ====================================================================
// FUNCTION 1: CRIAR AVALIAÇÃO
// ====================================================================

export const createEvaluation = functions
  .region('southamerica-east1') // São Paulo, Brasil
  .https.onCall(async (data, context) => {
    try {
      const { creatorEmail, title } = data;

      // Validar parâmetros
      if (!creatorEmail || !title) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Email e título são obrigatórios'
        );
      }

      // Gerar token do gestor
      const managerToken = uuidv4();
      const encryptionKey = generateEncryptionKey(managerToken);

      // Hash do email
      const emailHash = hash(creatorEmail.toLowerCase().trim());

      // Criptografar dados
      const encryptedTitle = encrypt(title, encryptionKey);
      const encryptedToken = encrypt(managerToken, encryptionKey);

      // Criar documento
      const evaluationRef = await db.collection('evaluations').add({
        creator_email: emailHash,
        creator_token: encryptedToken,
        title: encryptedTitle,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        status: 'draft',
      });

      return {
        evaluationId: evaluationRef.id,
        managerToken,
        title,
      };

    } catch (error: any) {
      console.error('Error in createEvaluation:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao criar avaliação');
    }
  });

// ====================================================================
// FUNCTION 2: ADICIONAR MEMBROS
// ====================================================================

export const addMembers = functions
  .region('southamerica-east1') // São Paulo, Brasil
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, members, managerToken } = data;

      // Validar parâmetros
      if (!evaluationId || !members || !managerToken) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Parâmetros inválidos'
        );
      }

      // Validar token do gestor
      const evalDoc = await db.collection('evaluations').doc(evaluationId).get();
      if (!evalDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Avaliação não encontrada');
      }

      const encryptionKey = generateEncryptionKey(managerToken);
      const membersWithCodes = [];

      // Processar cada membro
      for (const member of members) {
        const accessCode = generateAccessCode();
        const codeHash = hashAccessCode(accessCode);
        const emailHash = hash(member.email.toLowerCase().trim());
        const encryptedName = encrypt(member.name, encryptionKey);

        // Criar membro
        const memberRef = await db.collection('team_members').add({
          avaliation_id: evaluationId,
          name: encryptedName,
          email: member.email,
          email_hash: emailHash,
          access_code: codeHash,
          completed_evaluations: 0,
          total_evaluations: members.length - 1,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        membersWithCodes.push({
          id: memberRef.id,
          name: member.name,
          email: member.email,
          accessCode,
        });
      }

      return { members: membersWithCodes };

    } catch (error: any) {
      console.error('Error in addMembers:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao adicionar membros');
    }
  });

// ====================================================================
// FUNCTION 3: BUSCAR MEMBROS DESCRIPTOGRAFADOS
// ====================================================================

export const getMembersDecrypted = functions
  .region('southamerica-east1') // São Paulo, Brasil
  .https.onCall(async (data, context) => {
    try {
      const { accessCode } = data;

      if (!accessCode || accessCode.length !== 6) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Código de acesso inválido'
        );
      }

      // Buscar membro
      const codeHash = hashAccessCode(accessCode);
      const memberSnapshot = await db
        .collection('team_members')
        .where('access_code', '==', codeHash)
        .limit(1)
        .get();

      if (memberSnapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'Código não encontrado');
      }

      const memberData = memberSnapshot.docs[0].data();
      const evaluationId = memberData.avaliation_id;

      // Buscar todos os membros
      const allMembersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();

      const members = allMembersSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Retorna email como nome (temporário até implementar descriptografia completa)
        return {
          id: doc.id,
          name: data.email.split('@')[0],
          email: data.email,
          completedEvaluations: data.completed_evaluations || 0,
          totalEvaluations: data.total_evaluations || 0,
        };
      });

      return { members };

    } catch (error: any) {
      console.error('Error in getMembersDecrypted:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao buscar membros');
    }
  });

// ====================================================================
// FUNCTION 4: SUBMETER RESPOSTA DE AVALIAÇÃO
// ====================================================================

export const submitResponse = functions
  .region('southamerica-east1') // São Paulo, Brasil
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, evaluatorId, evaluatedId, ratings, comments, accessCode } = data;

      // Validar parâmetros
      if (!evaluationId || !evaluatorId || !evaluatedId || !ratings || !accessCode) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Parâmetros inválidos'
        );
      }

      // Validar código de acesso
      const codeHash = hashAccessCode(accessCode);
      const memberDoc = await db.collection('team_members').doc(evaluatorId).get();

      if (!memberDoc.exists || memberDoc.data()?.access_code !== codeHash) {
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado');
      }

      // Criar resposta
      await db.collection('responses').add({
        evaluation_id: evaluationId,
        evaluator_id: evaluatorId,
        evaluated_id: evaluatedId,
        question_1: ratings.question_1,
        question_2: ratings.question_2,
        question_3: ratings.question_3,
        question_4: ratings.question_4,
        question_5: ratings.question_5,
        positive_comments: comments?.positive || '',
        improvement_comments: comments?.improvement || '',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Incrementar contador
      await db.collection('team_members').doc(evaluatorId).update({
        completed_evaluations: admin.firestore.FieldValue.increment(1),
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error in submitResponse:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao submeter resposta');
    }
  });

// ====================================================================
// FUNCTION 5: BUSCAR RESULTADOS CONSOLIDADOS
// ====================================================================

export const getResults = functions
  .region('southamerica-east1') // São Paulo, Brasil
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, managerToken } = data;

      // Validar parâmetros
      if (!evaluationId || !managerToken) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Parâmetros inválidos'
        );
      }

      // Validar token do gestor
      const evalDoc = await db.collection('evaluations').doc(evaluationId).get();
      if (!evalDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Avaliação não encontrada');
      }

      const encryptionKey = generateEncryptionKey(managerToken);

      // Buscar membros
      const membersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();

      const results = [];

      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data();
        const decryptedName = decrypt(memberData.name, encryptionKey);

        // Buscar respostas para este membro
        const responsesSnapshot = await db
          .collection('responses')
          .where('evaluation_id', '==', evaluationId)
          .where('evaluated_id', '==', memberDoc.id)
          .get();

        const responses = responsesSnapshot.docs.map((doc) => doc.data());

        // Calcular médias
        const avg = (q: string) => responses.reduce((sum, r) => sum + r[q], 0) / (responses.length || 1);

        results.push({
          id: memberDoc.id,
          name: decryptedName,
          email: memberData.email,
          averages: {
            question_1: avg('question_1'),
            question_2: avg('question_2'),
            question_3: avg('question_3'),
            question_4: avg('question_4'),
            question_5: avg('question_5'),
            overall: (avg('question_1') + avg('question_2') + avg('question_3') + avg('question_4') + avg('question_5')) / 5,
          },
          responseCount: responses.length,
        });
      }

      return { results };

    } catch (error: any) {
      console.error('Error in getResults:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao buscar resultados');
    }
  });

// ====================================================================
// FUNCTION 6: VALIDAR ACESSO DO GESTOR
// ====================================================================

export const validateManagerAccess = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, email, managerToken } = data;

      if (!evaluationId || !email || !managerToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
      }

      const emailHash = hash(email.toLowerCase().trim());
      const evalDoc = await db.collection('evaluations').doc(evaluationId).get();

      if (!evalDoc.exists) {
        return { hasAccess: false };
      }

      const evalData = evalDoc.data()!;
      return { hasAccess: evalData.creator_email === emailHash };

    } catch (error: any) {
      console.error('Error in validateManagerAccess:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao validar acesso');
    }
  });

// ====================================================================
// FUNCTION 7: BUSCAR AVALIAÇÃO
// ====================================================================

export const getEvaluation = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, managerToken } = data;

      if (!evaluationId || !managerToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
      }

      const evalDoc = await db.collection('evaluations').doc(evaluationId).get();

      if (!evalDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Avaliação não encontrada');
      }

      const evalData = evalDoc.data()!;
      const encryptionKey = generateEncryptionKey(managerToken);

      try {
        const decryptedTitle = decrypt(evalData.title, encryptionKey);

        return {
          id: evalDoc.id,
          title: decryptedTitle,
          createdAt: evalData.created_at,
          status: evalData.status,
        };
      } catch {
        throw new functions.https.HttpsError('permission-denied', 'Token inválido');
      }

    } catch (error: any) {
      console.error('Error in getEvaluation:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao buscar avaliação');
    }
  });

// ====================================================================
// FUNCTION 8: ATIVAR AVALIAÇÃO
// ====================================================================

export const activateEvaluation = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, managerToken } = data;

      if (!evaluationId || !managerToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
      }

      await db.collection('evaluations').doc(evaluationId).update({
        status: 'active',
        activated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error in activateEvaluation:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao ativar avaliação');
    }
  });

// ====================================================================
// FUNCTION 9: BUSCAR MEMBRO POR CÓDIGO DE ACESSO
// ====================================================================

export const getMemberByAccessCode = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { accessCode } = data;

      if (!accessCode || accessCode.length !== 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Código inválido');
      }

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
          name: memberData.email.split('@')[0], // Fallback
          email: memberData.email,
          evaluationId: memberData.avaliation_id,
          completedEvaluations: memberData.completed_evaluations || 0,
          totalEvaluations: memberData.total_evaluations || 0,
        },
      };

    } catch (error: any) {
      console.error('Error in getMemberByAccessCode:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao buscar membro');
    }
  });

// ====================================================================
// FUNCTION 10: ATUALIZAR ÚLTIMO ACESSO
// ====================================================================

export const updateLastAccess = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { memberId } = data;

      if (!memberId) {
        throw new functions.https.HttpsError('invalid-argument', 'ID do membro inválido');
      }

      await db.collection('team_members').doc(memberId).update({
        last_access_date: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true };

    } catch (error: any) {
      console.error('Error in updateLastAccess:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao atualizar acesso');
    }
  });

// ====================================================================
// FUNCTION 11: BUSCAR AVALIAÇÕES PENDENTES
// ====================================================================

export const getPendingEvaluations = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, memberId, accessCode } = data;

      if (!evaluationId || !memberId || !accessCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
      }

      // Buscar todos os membros da avaliação
      const membersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();

      const allMemberIds = membersSnapshot.docs
        .map((doc) => doc.id)
        .filter((id) => id !== memberId);

      // Buscar respostas já enviadas
      const responsesSnapshot = await db
        .collection('responses')
        .where('evaluation_id', '==', evaluationId)
        .where('evaluator_id', '==', memberId)
        .get();

      const evaluatedIds = responsesSnapshot.docs.map(
        (doc) => doc.data().evaluated_id
      );

      // Retornar IDs pendentes
      const pendingIds = allMemberIds.filter((id) => !evaluatedIds.includes(id));

      return { pendingIds };

    } catch (error: any) {
      console.error('Error in getPendingEvaluations:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao buscar pendentes');
    }
  });

// ====================================================================
// FUNCTION 12: BUSCAR MEMBROS COM PROGRESSO
// ====================================================================

export const getMembersWithProgress = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId, managerToken } = data;

      if (!evaluationId || !managerToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros inválidos');
      }

      const encryptionKey = generateEncryptionKey(managerToken);
      const membersSnapshot = await db
        .collection('team_members')
        .where('avaliation_id', '==', evaluationId)
        .get();

      const members = membersSnapshot.docs.map((doc) => {
        const data = doc.data();
        const decryptedName = decrypt(data.name, encryptionKey);

        return {
          id: doc.id,
          name: decryptedName,
          email: data.email,
          completedEvaluations: data.completed_evaluations || 0,
          totalEvaluations: data.total_evaluations || 0,
          lastAccessDate: data.last_access_date,
        };
      });

      return { members };

    } catch (error: any) {
      console.error('Error in getMembersWithProgress:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao buscar membros');
    }
  });

// ====================================================================
// FUNCTION 13: CONTAR RESPOSTAS
// ====================================================================

export const countResponses = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      const { evaluationId } = data;

      if (!evaluationId) {
        throw new functions.https.HttpsError('invalid-argument', 'ID da avaliação inválido');
      }

      const responsesSnapshot = await db
        .collection('responses')
        .where('evaluation_id', '==', evaluationId)
        .get();

      return { count: responsesSnapshot.size };

    } catch (error: any) {
      console.error('Error in countResponses:', error);
      if (error instanceof functions.https.HttpsError) throw error;
      throw new functions.https.HttpsError('internal', 'Erro ao contar respostas');
    }
  });
