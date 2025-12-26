"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.countResponses = exports.getMembersWithProgress = exports.getPendingEvaluations = exports.getMemberByAccessCode = exports.activateEvaluation = exports.getEvaluation = exports.validateManagerAccess = void 0;
// Exporta todas as Cloud Functions implementadas com Clean Architecture
__exportStar(require("./presentation/http/functions"), exports);
// Funções auxiliares (serão migradas para Use Cases futuramente)
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const CryptoJS = __importStar(require("crypto-js"));
const db = admin.firestore();
function hash(text) {
    return CryptoJS.SHA256(text).toString();
}
function hashAccessCode(code) {
    return CryptoJS.SHA256(code).toString();
}
exports.validateManagerAccess = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId, email } = data;
        const emailHash = hash(email.toLowerCase().trim());
        const evalDoc = await db.collection('evaluations').doc(evaluationId).get();
        if (!evalDoc.exists)
            return { hasAccess: false };
        const evalData = evalDoc.data();
        return { hasAccess: evalData.creator_email === emailHash };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao validar acesso');
    }
});
exports.getEvaluation = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId } = data;
        const evalDoc = await db.collection('evaluations').doc(evaluationId).get();
        if (!evalDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Avaliação não encontrada');
        }
        const evalData = evalDoc.data();
        return {
            id: evalDoc.id,
            title: evalData.title,
            createdAt: evalData.created_at,
            status: evalData.status,
        };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao buscar avaliação');
    }
});
exports.activateEvaluation = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId } = data;
        await db.collection('evaluations').doc(evaluationId).update({
            status: 'active',
            activated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao ativar avaliação');
    }
});
exports.getMemberByAccessCode = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { accessCode } = data;
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
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao buscar membro');
    }
});
exports.getPendingEvaluations = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId, memberId } = data;
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
        const evaluatedIds = responsesSnapshot.docs.map((doc) => doc.data().evaluated_id);
        const pendingIds = allMemberIds.filter((id) => !evaluatedIds.includes(id));
        return { pendingIds };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao buscar pendentes');
    }
});
exports.getMembersWithProgress = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId } = data;
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
        return { members };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao buscar membros');
    }
});
exports.countResponses = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId } = data;
        const responsesSnapshot = await db
            .collection('responses')
            .where('evaluation_id', '==', evaluationId)
            .get();
        return { count: responsesSnapshot.size };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Erro ao contar respostas');
    }
});
//# sourceMappingURL=index.js.map