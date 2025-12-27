"use strict";
/**
 * Use Case: Get Results
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetResultsUseCase = void 0;
class GetResultsUseCase {
    constructor(memberRepository, responseRepository) {
        this.memberRepository = memberRepository;
        this.responseRepository = responseRepository;
    }
    async execute(evaluationId) {
        const members = await this.memberRepository.findByEvaluationId(evaluationId);
        const results = [];
        for (const member of members) {
            const responses = await this.responseRepository.findByEvaluatedId(evaluationId, member.id);
            const averages = this.calculateAverages(responses);
            results.push({
                member,
                averages,
                responseCount: responses.length,
            });
        }
        return results;
    }
    calculateAverages(responses) {
        if (responses.length === 0) {
            return {
                question_1: 0,
                question_2: 0,
                question_3: 0,
                question_4: 0,
                overall: 0,
            };
        }
        const sum = (q) => responses.reduce((acc, r) => acc + r.ratings[q], 0) / responses.length;
        const q1 = sum('question_1');
        const q2 = sum('question_2');
        const q3 = sum('question_3');
        const q4 = sum('question_4');
        return {
            question_1: q1,
            question_2: q2,
            question_3: q3,
            question_4: q4,
            overall: (q1 + q2 + q3 + q4) / 4,
        };
    }
}
exports.GetResultsUseCase = GetResultsUseCase;
//# sourceMappingURL=GetResultsUseCase.js.map