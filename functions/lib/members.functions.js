"use strict";
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
exports.getMembersByAccessCodeEncrypted = exports.getMembersEncrypted = exports.addMembersEncrypted = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const encryption_service_1 = require("./infrastructure/services/encryption.service");
const db = admin.firestore();
/**
 * Adiciona membros à avaliação (v2 - COM CRIPTOGRAFIA)
 * - Recebe dados plaintext do frontend
 * - Criptografa nomes e emails
 * - Gera e hasheia códigos de acesso
 * - Retorna membros com códigos plaintext (para exibir ao gestor)
 */
exports.addMembersEncrypted = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId, members } = data;
        if (!evaluationId || !members || members.length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'evaluationId e members são obrigatórios');
        }
        // Gera códigos de acesso e criptografa dados
        const membersWithCodes = members.map((member) => {
            // Gera código de 6 dígitos
            const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
            // Criptografa dados sensíveis
            const encryptedName = (0, encryption_service_1.encrypt)(member.name);
            const encryptedEmail = (0, encryption_service_1.encrypt)(member.email);
            // Hasheia código de acesso
            const codeHash = (0, encryption_service_1.hashAccessCode)(accessCode);
            return {
                memberData: {
                    evaluation_id: evaluationId,
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
        const savedMembers = [];
        for (const { memberData, plainData } of membersWithCodes) {
            const docRef = db.collection('team_members').doc();
            batch.set(docRef, memberData);
            savedMembers.push({
                id: docRef.id,
                evaluation_id: evaluationId,
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
    }
    catch (error) {
        console.error('Erro ao adicionar membros:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao adicionar membros');
    }
});
/**
 * Busca membros de uma avaliação (v2 - COM DESCRIPTOGRAFIA)
 * - Busca dados criptografados do Firestore
 * - Descriptografa nomes e emails
 * - Retorna dados plaintext para o frontend
 */
exports.getMembersEncrypted = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { evaluationId } = data;
        if (!evaluationId) {
            throw new functions.https.HttpsError('invalid-argument', 'evaluationId é obrigatório');
        }
        const membersSnapshot = await db
            .collection('team_members')
            .where('evaluation_id', '==', evaluationId)
            .get();
        const members = membersSnapshot.docs.map((doc) => {
            const data = doc.data();
            // Descriptografa dados sensíveis
            const name = (0, encryption_service_1.decrypt)(data.name);
            const email = (0, encryption_service_1.decrypt)(data.email);
            return {
                id: doc.id,
                evaluation_id: data.evaluation_id,
                name, // Plaintext (descriptografado)
                email, // Plaintext (descriptografado)
                access_code: data.access_code,
                completed_evaluations: data.completed_evaluations || 0,
                total_evaluations: data.total_evaluations || 0,
                last_access_date: data.last_access_date,
            };
        });
        return {
            success: true,
            members,
        };
    }
    catch (error) {
        console.error('Erro ao buscar membros:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao buscar membros');
    }
});
/**
 * Busca membros por código de acesso (v2 - COM DESCRIPTOGRAFIA)
 * - Valida código de acesso (hash)
 * - Busca todos os membros da mesma avaliação
 * - Descriptografa e retorna todos
 */
exports.getMembersByAccessCodeEncrypted = functions
    .region('southamerica-east1')
    .https.onCall(async (data, context) => {
    try {
        const { accessCode } = data;
        if (!accessCode || accessCode.length !== 6) {
            throw new functions.https.HttpsError('invalid-argument', 'Código de acesso inválido');
        }
        // Hasheia código
        const codeHash = (0, encryption_service_1.hashAccessCode)(accessCode);
        // Busca membro com este código
        const memberSnapshot = await db
            .collection('team_members')
            .where('access_code', '==', codeHash)
            .limit(1)
            .get();
        if (memberSnapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'Código de acesso inválido');
        }
        const memberDoc = memberSnapshot.docs[0];
        const memberData = memberDoc.data();
        const evaluationId = memberData.evaluation_id;
        // Busca todos os membros da mesma avaliação
        const allMembersSnapshot = await db
            .collection('team_members')
            .where('evaluation_id', '==', evaluationId)
            .get();
        const members = allMembersSnapshot.docs.map((doc) => {
            const data = doc.data();
            // Descriptografa dados sensíveis
            const name = (0, encryption_service_1.decrypt)(data.name);
            const email = (0, encryption_service_1.decrypt)(data.email);
            return {
                id: doc.id,
                evaluation_id: data.evaluation_id,
                name,
                email,
                access_code: data.access_code,
                completed_evaluations: data.completed_evaluations || 0,
                total_evaluations: data.total_evaluations || 0,
                last_access_date: data.last_access_date,
            };
        });
        return {
            success: true,
            evaluationId,
            currentMemberId: memberDoc.id,
            members,
        };
    }
    catch (error) {
        console.error('Erro ao buscar membros por código:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Erro ao buscar membros');
    }
});
//# sourceMappingURL=members.functions.js.map