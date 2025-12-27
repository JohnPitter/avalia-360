"use strict";
/**
 * Use Case: Get Results
 * Retorna resultados consolidados COM COMENTÁRIOS
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
            const comments = this.aggregateComments(responses);
            results.push({
                member,
                averages,
                comments,
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
        const count = responses.length;
        const q1 = responses.reduce((acc, r) => acc + r.ratings.question_1, 0) / count;
        const q2 = responses.reduce((acc, r) => acc + r.ratings.question_2, 0) / count;
        const q3 = responses.reduce((acc, r) => acc + r.ratings.question_3, 0) / count;
        const q4 = responses.reduce((acc, r) => acc + r.ratings.question_4, 0) / count;
        return {
            question_1: parseFloat(q1.toFixed(2)),
            question_2: parseFloat(q2.toFixed(2)),
            question_3: parseFloat(q3.toFixed(2)),
            question_4: parseFloat(q4.toFixed(2)),
            overall: parseFloat(((q1 + q2 + q3 + q4) / 4).toFixed(2)),
        };
    }
    /**
     * Agrega comentários de todas as respostas
     * Filtra comentários vazios
     */
    aggregateComments(responses) {
        const positive = [];
        const improvement = [];
        for (const response of responses) {
            // Adiciona comentários positivos (se não vazios)
            if (response.comments.positive && response.comments.positive.trim().length > 0) {
                positive.push(response.comments.positive.trim());
            }
            // Adiciona comentários de melhoria (se não vazios)
            if (response.comments.improvement && response.comments.improvement.trim().length > 0) {
                improvement.push(response.comments.improvement.trim());
            }
        }
        return { positive, improvement };
    }
}
exports.GetResultsUseCase = GetResultsUseCase;
//# sourceMappingURL=GetResultsUseCase.js.map