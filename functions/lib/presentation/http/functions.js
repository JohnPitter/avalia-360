"use strict";
/**
 * HTTP Layer: Firebase Cloud Functions
 *
 * Clean Architecture:
 * Functions → Controllers → Use Cases → Repositories → Firestore
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLastAccess = exports.submitResponse = exports.getMembersDecrypted = exports.getResults = exports.addMembers = exports.createEvaluation = void 0;
const functions = __importStar(require("firebase-functions"));
const EvaluationController_1 = require("../controllers/EvaluationController");
const MemberController_1 = require("../controllers/MemberController");
// Firebase Admin já inicializado em index.ts
const evaluationController = new EvaluationController_1.EvaluationController();
const memberController = new MemberController_1.MemberController();
// =================================================================
// EVALUATION FUNCTIONS
// =================================================================
exports.createEvaluation = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        return await evaluationController.createEvaluation(data);
    }
    catch (error) {
        console.error('Error in createEvaluation:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao criar avaliação');
    }
});
exports.addMembers = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        return await evaluationController.addMembers(data);
    }
    catch (error) {
        console.error('Error in addMembers:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao adicionar membros');
    }
});
exports.getResults = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        return await evaluationController.getResults(data);
    }
    catch (error) {
        console.error('Error in getResults:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao buscar resultados');
    }
});
// =================================================================
// MEMBER FUNCTIONS
// =================================================================
exports.getMembersDecrypted = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        return await memberController.getMembersByAccessCode(data);
    }
    catch (error) {
        console.error('Error in getMembersDecrypted:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao buscar membros');
    }
});
exports.submitResponse = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        return await memberController.submitResponse(data);
    }
    catch (error) {
        console.error('Error in submitResponse:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao enviar resposta');
    }
});
exports.updateLastAccess = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        return await memberController.updateLastAccess(data);
    }
    catch (error) {
        console.error('Error in updateLastAccess:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao atualizar acesso');
    }
});
//# sourceMappingURL=functions.js.map