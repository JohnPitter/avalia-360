"use strict";
/**
 * Infrastructure: Firestore Member Repository
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
exports.FirestoreMemberRepository = void 0;
const admin = __importStar(require("firebase-admin"));
const Member_1 = require("../../domain/entities/Member");
const HashService_1 = require("../security/HashService");
class FirestoreMemberRepository {
    constructor() {
        this.collection = admin.firestore().collection('team_members');
    }
    async save(member) {
        const docRef = await this.collection.add(this.toFirestore(member));
        return new Member_1.Member(docRef.id, member.evaluationId, member.name, member.email, member.accessCode, member.completedEvaluations, member.totalEvaluations, member.lastAccessDate);
    }
    async saveMany(members) {
        const saved = [];
        for (const member of members) {
            saved.push(await this.save(member));
        }
        return saved;
    }
    async findById(id) {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists)
            return null;
        return this.fromFirestore(doc.id, doc.data());
    }
    async findByAccessCode(accessCodeHash) {
        const snapshot = await this.collection
            .where('access_code', '==', accessCodeHash)
            .limit(1)
            .get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        return this.fromFirestore(doc.id, doc.data());
    }
    async findByEvaluationId(evaluationId) {
        const snapshot = await this.collection
            .where('evaluation_id', '==', evaluationId)
            .get();
        return snapshot.docs.map((doc) => this.fromFirestore(doc.id, doc.data()));
    }
    async updateLastAccess(id, date) {
        await this.collection.doc(id).update({
            last_access_date: admin.firestore.Timestamp.fromDate(date),
        });
    }
    async incrementCompleted(id) {
        await this.collection.doc(id).update({
            completed_evaluations: admin.firestore.FieldValue.increment(1),
        });
    }
    async delete(id) {
        await this.collection.doc(id).delete();
    }
    toFirestore(member) {
        return {
            evaluation_id: member.evaluationId,
            name: member.name,
            email: member.email,
            email_hash: HashService_1.HashService.hashEmail(member.email),
            access_code: HashService_1.HashService.hashAccessCode(member.accessCode),
            completed_evaluations: member.completedEvaluations,
            total_evaluations: member.totalEvaluations,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            last_access_date: member.lastAccessDate ?
                admin.firestore.Timestamp.fromDate(member.lastAccessDate) :
                null,
        };
    }
    fromFirestore(id, data) {
        var _a;
        return new Member_1.Member(id, data.evaluation_id, data.name, data.email, '', // access_code hasheado não retorna
        data.completed_evaluations || 0, data.total_evaluations || 0, (_a = data.last_access_date) === null || _a === void 0 ? void 0 : _a.toDate());
    }
}
exports.FirestoreMemberRepository = FirestoreMemberRepository;
//# sourceMappingURL=FirestoreMemberRepository.js.map