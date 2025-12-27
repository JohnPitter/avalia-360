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
const encryption_service_1 = require("../../infrastructure/services/encryption.service");
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
        console.log(`[getResults] Total de resultados: ${results.length}`);
        return {
            results: results.map((r) => {
                var _a;
                console.log(`[getResults] Processando membro ${r.member.id}:`);
                console.log(`  - Comentários positivos (cript): ${r.comments.positive.length}`);
                console.log(`  - Comentários melhoria (cript): ${r.comments.improvement.length}`);
                // Descriptografa nome e email do membro
                let memberName = r.member.name;
                let memberEmail = r.member.email;
                try {
                    memberName = (0, encryption_service_1.decrypt)(r.member.name);
                }
                catch (error) {
                    console.error(`Erro ao descriptografar nome do membro ${r.member.id}:`, error);
                }
                try {
                    memberEmail = (0, encryption_service_1.decrypt)(r.member.email);
                }
                catch (error) {
                    console.error(`Erro ao descriptografar email do membro ${r.member.id}:`, error);
                }
                // Comentários já vêm descriptografados do repository
                return {
                    member: {
                        id: r.member.id,
                        name: memberName, // Descriptografado
                        email: memberEmail, // Descriptografado
                        evaluation_id: r.member.evaluationId,
                        access_code: r.member.accessCode,
                        completed_evaluations: r.member.completedEvaluations,
                        total_evaluations: r.member.totalEvaluations,
                        last_access_date: ((_a = r.member.lastAccessDate) === null || _a === void 0 ? void 0 : _a.getTime()) || null,
                    },
                    averages: r.averages,
                    comments: r.comments, // Já descriptografados pelo repository
                    totalResponses: r.responseCount,
                };
            }),
        };
    }
}
exports.EvaluationController = EvaluationController;
//# sourceMappingURL=EvaluationController.js.map