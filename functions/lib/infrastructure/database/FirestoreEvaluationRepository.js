"use strict";
/**
 * Infrastructure: Firestore Evaluation Repository
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
exports.FirestoreEvaluationRepository = void 0;
const admin = __importStar(require("firebase-admin"));
const Evaluation_1 = require("../../domain/entities/Evaluation");
const CryptoService_1 = require("../security/CryptoService");
const HashService_1 = require("../security/HashService");
class FirestoreEvaluationRepository {
    constructor() {
        this.collection = admin.firestore().collection('evaluations');
    }
    async save(evaluation) {
        const key = CryptoService_1.CryptoService.generateKey(evaluation.managerToken);
        const encryptedTitle = CryptoService_1.CryptoService.encrypt(evaluation.title, key);
        const encryptedToken = CryptoService_1.CryptoService.encrypt(evaluation.managerToken, key);
        const emailHash = HashService_1.HashService.hashEmail(evaluation.creatorEmail);
        const docRef = await this.collection.add({
            creator_email: emailHash,
            creator_token: encryptedToken,
            title: encryptedTitle,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            status: evaluation.status,
        });
        return new Evaluation_1.Evaluation(docRef.id, evaluation.creatorEmail, evaluation.title, evaluation.managerToken, evaluation.createdAt, evaluation.status);
    }
    async findById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists)
            return null;
        const data = doc.data();
        // Converte created_at para Date de forma segura
        let createdAt = new Date();
        if (data.created_at) {
            if (typeof data.created_at.toDate === 'function') {
                createdAt = data.created_at.toDate();
            }
            else if (typeof data.created_at === 'number') {
                createdAt = new Date(data.created_at);
            }
            else if (data.created_at instanceof Date) {
                createdAt = data.created_at;
            }
        }
        return new Evaluation_1.Evaluation(doc.id, '', // Email criptografado
        '', // Título criptografado - precisa token para descriptografar
        '', createdAt, data.status);
    }
    async findByCreatorEmail(emailHash) {
        const snapshot = await this.collection
            .where('creator_email', '==', emailHash)
            .get();
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            // Converte created_at para Date de forma segura
            let createdAt = new Date();
            if (data.created_at) {
                if (typeof data.created_at.toDate === 'function') {
                    createdAt = data.created_at.toDate();
                }
                else if (typeof data.created_at === 'number') {
                    createdAt = new Date(data.created_at);
                }
                else if (data.created_at instanceof Date) {
                    createdAt = data.created_at;
                }
            }
            return new Evaluation_1.Evaluation(doc.id, '', '', '', createdAt, data.status);
        });
    }
    async updateStatus(id, status) {
        await this.collection.doc(id).update({ status });
    }
    async delete(id) {
        await this.collection.doc(id).delete();
    }
}
exports.FirestoreEvaluationRepository = FirestoreEvaluationRepository;
//# sourceMappingURL=FirestoreEvaluationRepository.js.map