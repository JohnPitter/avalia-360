"use strict";
/**
 * Domain Entity: Response
 *
 * Representa uma resposta de avaliação 360°
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
class Response {
    constructor(id, evaluationId, evaluatorId, evaluatedId, ratings, comments, createdAt) {
        this.id = id;
        this.evaluationId = evaluationId;
        this.evaluatorId = evaluatorId;
        this.evaluatedId = evaluatedId;
        this.ratings = ratings;
        this.comments = comments;
        this.createdAt = createdAt;
        this.validate();
    }
    validate() {
        // ID pode ser vazio antes de salvar no banco (será gerado pelo repository)
        // Apenas valida que não é null/undefined
        if (this.id === null || this.id === undefined) {
            throw new Error('Response ID cannot be null or undefined');
        }
        if (!this.evaluationId || this.evaluationId.trim().length === 0) {
            throw new Error('Evaluation ID is required');
        }
        if (!this.evaluatorId || this.evaluatorId.trim().length === 0) {
            throw new Error('Evaluator ID is required');
        }
        if (!this.evaluatedId || this.evaluatedId.trim().length === 0) {
            throw new Error('Evaluated ID is required');
        }
        if (this.evaluatorId === this.evaluatedId) {
            throw new Error('Cannot evaluate yourself');
        }
        this.validateRatings();
    }
    validateRatings() {
        const { question_1, question_2, question_3, question_4 } = this.ratings;
        const allRatings = [question_1, question_2, question_3, question_4];
        for (const rating of allRatings) {
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                throw new Error('All ratings must be integers between 1 and 5');
            }
        }
    }
    getAverageRating() {
        const { question_1, question_2, question_3, question_4 } = this.ratings;
        return (question_1 + question_2 + question_3 + question_4) / 4;
    }
    hasPositiveComment() {
        return !!this.comments.positive && this.comments.positive.trim().length > 0;
    }
    hasImprovementComment() {
        return !!this.comments.improvement && this.comments.improvement.trim().length > 0;
    }
}
exports.Response = Response;
//# sourceMappingURL=Response.js.map