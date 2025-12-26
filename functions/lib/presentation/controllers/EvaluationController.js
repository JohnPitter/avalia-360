"use strict";
/**
 * Presentation: Evaluation Controller
 * Orquestra Use Cases relacionados a Evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationController = void 0;
const CreateEvaluationUseCase_1 = require("../../application/use-cases/CreateEvaluationUseCase");
const AddMembersUseCase_1 = require("../../application/use-cases/AddMembersUseCase");
const GetResultsUseCase_1 = require("../../application/use-cases/GetResultsUseCase");
const FirestoreEvaluationRepository_1 = require("../../infrastructure/database/FirestoreEvaluationRepository");
const FirestoreMemberRepository_1 = require("../../infrastructure/database/FirestoreMemberRepository");
const FirestoreResponseRepository_1 = require("../../infrastructure/database/FirestoreResponseRepository");
class EvaluationController {
    constructor() {
        this.evaluationRepo = new FirestoreEvaluationRepository_1.FirestoreEvaluationRepository();
        this.memberRepo = new FirestoreMemberRepository_1.FirestoreMemberRepository();
        this.responseRepo = new FirestoreResponseRepository_1.FirestoreResponseRepository();
    }
    async createEvaluation(data) {
        const useCase = new CreateEvaluationUseCase_1.CreateEvaluationUseCase(this.evaluationRepo);
        const result = await useCase.execute({
            creatorEmail: data.creatorEmail,
            title: data.title,
        });
        return {
            evaluationId: result.evaluation.id,
            managerToken: result.managerToken,
            title: result.evaluation.title,
        };
    }
    async addMembers(data) {
        const useCase = new AddMembersUseCase_1.AddMembersUseCase(this.memberRepo);
        const members = await useCase.execute({
            evaluationId: data.evaluationId,
            members: data.members,
        });
        return {
            members: members.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                accessCode: m.accessCode,
            })),
        };
    }
    async getResults(data) {
        const useCase = new GetResultsUseCase_1.GetResultsUseCase(this.memberRepo, this.responseRepo);
        const results = await useCase.execute(data.evaluationId);
        return {
            results: results.map((r) => ({
                id: r.member.id,
                name: r.member.name,
                email: r.member.email,
                averages: r.averages,
                responseCount: r.responseCount,
            })),
        };
    }
}
exports.EvaluationController = EvaluationController;
//# sourceMappingURL=EvaluationController.js.map