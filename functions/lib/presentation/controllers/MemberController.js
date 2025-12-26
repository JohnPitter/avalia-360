"use strict";
/**
 * Presentation: Member Controller
 * Orquestra Use Cases relacionados a Member e Response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberController = void 0;
const SubmitResponseUseCase_1 = require("../../application/use-cases/SubmitResponseUseCase");
const FirestoreMemberRepository_1 = require("../../infrastructure/database/FirestoreMemberRepository");
const FirestoreResponseRepository_1 = require("../../infrastructure/database/FirestoreResponseRepository");
const HashService_1 = require("../../infrastructure/security/HashService");
class MemberController {
    constructor() {
        this.memberRepo = new FirestoreMemberRepository_1.FirestoreMemberRepository();
        this.responseRepo = new FirestoreResponseRepository_1.FirestoreResponseRepository();
    }
    async getMembersByAccessCode(data) {
        const codeHash = HashService_1.HashService.hashAccessCode(data.accessCode);
        const member = await this.memberRepo.findByAccessCode(codeHash);
        if (!member) {
            throw new Error('Access code not found');
        }
        const allMembers = await this.memberRepo.findByEvaluationId(member.evaluationId);
        return {
            members: allMembers.map((m) => ({
                id: m.id,
                name: m.email.split('@')[0], // Fallback
                email: m.email,
                completedEvaluations: m.completedEvaluations,
                totalEvaluations: m.totalEvaluations,
            })),
        };
    }
    async submitResponse(data) {
        const useCase = new SubmitResponseUseCase_1.SubmitResponseUseCase(this.responseRepo, this.memberRepo);
        await useCase.execute({
            evaluationId: data.evaluationId,
            evaluatorId: data.evaluatorId,
            evaluatedId: data.evaluatedId,
            ratings: data.ratings,
            comments: data.comments,
        });
        return { success: true };
    }
    async updateLastAccess(data) {
        await this.memberRepo.updateLastAccess(data.memberId, new Date());
        return { success: true };
    }
}
exports.MemberController = MemberController;
//# sourceMappingURL=MemberController.js.map