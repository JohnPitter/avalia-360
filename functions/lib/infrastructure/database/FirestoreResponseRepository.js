"use strict";
/**
 * Infrastructure: Firestore Response Repository
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
exports.FirestoreResponseRepository = void 0;
const admin = __importStar(require("firebase-admin"));
const Response_1 = require("../../domain/entities/Response");
class FirestoreResponseRepository {
    constructor() {
        this.collection = admin.firestore().collection('responses');
    }
    async save(response) {
        const docRef = await this.collection.add({
            evaluation_id: response.evaluationId,
            evaluator_id: response.evaluatorId,
            evaluated_id: response.evaluatedId,
            question_1: response.ratings.question_1,
            question_2: response.ratings.question_2,
            question_3: response.ratings.question_3,
            question_4: response.ratings.question_4,
            question_5: response.ratings.question_5,
            positive_comments: response.comments.positive || '',
            improvement_comments: response.comments.improvement || '',
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        return new Response_1.Response(docRef.id, response.evaluationId, response.evaluatorId, response.evaluatedId, response.ratings, response.comments, response.createdAt);
    }
    async findById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists)
            return null;
        return this.fromFirestore(doc.id, doc.data());
    }
    async findByEvaluationId(evaluationId) {
        const snapshot = await this.collection
            .where('evaluation_id', '==', evaluationId)
            .get();
        return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
    }
    async findByEvaluatorId(evaluationId, evaluatorId) {
        const snapshot = await this.collection
            .where('evaluation_id', '==', evaluationId)
            .where('evaluator_id', '==', evaluatorId)
            .get();
        return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
    }
    async findByEvaluatedId(evaluationId, evaluatedId) {
        const snapshot = await this.collection
            .where('evaluation_id', '==', evaluationId)
            .where('evaluated_id', '==', evaluatedId)
            .get();
        return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
    }
    async countByEvaluationId(evaluationId) {
        const snapshot = await this.collection
            .where('evaluation_id', '==', evaluationId)
            .get();
        return snapshot.size;
    }
    async exists(evaluationId, evaluatorId, evaluatedId) {
        const snapshot = await this.collection
            .where('evaluation_id', '==', evaluationId)
            .where('evaluator_id', '==', evaluatorId)
            .where('evaluated_id', '==', evaluatedId)
            .limit(1)
            .get();
        return !snapshot.empty;
    }
    fromFirestore(id, data) {
        var _a;
        return new Response_1.Response(id, data.evaluation_id, data.evaluator_id, data.evaluated_id, {
            question_1: data.question_1,
            question_2: data.question_2,
            question_3: data.question_3,
            question_4: data.question_4,
            question_5: data.question_5,
        }, {
            positive: data.positive_comments,
            improvement: data.improvement_comments,
        }, ((_a = data.created_at) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date());
    }
}
exports.FirestoreResponseRepository = FirestoreResponseRepository;
//# sourceMappingURL=FirestoreResponseRepository.js.map