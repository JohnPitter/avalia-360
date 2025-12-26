/**
 * HTTP Layer: Firebase Cloud Functions
 *
 * Clean Architecture:
 * Functions → Controllers → Use Cases → Repositories → Firestore
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {EvaluationController} from '../controllers/EvaluationController';
import {MemberController} from '../controllers/MemberController';

// Inicializar Firebase Admin
admin.initializeApp();

const evaluationController = new EvaluationController();
const memberController = new MemberController();

// =================================================================
// EVALUATION FUNCTIONS
// =================================================================

export const createEvaluation = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      return await evaluationController.createEvaluation(data);
    } catch (error: any) {
      console.error('Error in createEvaluation:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao criar avaliação'
      );
    }
  });

export const addMembers = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      return await evaluationController.addMembers(data);
    } catch (error: any) {
      console.error('Error in addMembers:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao adicionar membros'
      );
    }
  });

export const getResults = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      return await evaluationController.getResults(data);
    } catch (error: any) {
      console.error('Error in getResults:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao buscar resultados'
      );
    }
  });

// =================================================================
// MEMBER FUNCTIONS
// =================================================================

export const getMembersDecrypted = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      return await memberController.getMembersByAccessCode(data);
    } catch (error: any) {
      console.error('Error in getMembersDecrypted:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao buscar membros'
      );
    }
  });

export const submitResponse = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      return await memberController.submitResponse(data);
    } catch (error: any) {
      console.error('Error in submitResponse:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao enviar resposta'
      );
    }
  });

export const updateLastAccess = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    try {
      return await memberController.updateLastAccess(data);
    } catch (error: any) {
      console.error('Error in updateLastAccess:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Erro ao atualizar acesso'
      );
    }
  });
