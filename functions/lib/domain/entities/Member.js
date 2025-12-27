"use strict";
/**
 * Domain Entity: Member
 *
 * Representa um membro da equipe em uma avaliação 360°
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Member = void 0;
class Member {
    constructor(id, evaluationId, name, email, accessCode, completedEvaluations, totalEvaluations, lastAccessDate) {
        this.id = id;
        this.evaluationId = evaluationId;
        this.name = name;
        this.email = email;
        this.accessCode = accessCode;
        this.completedEvaluations = completedEvaluations;
        this.totalEvaluations = totalEvaluations;
        this.lastAccessDate = lastAccessDate;
        this.validate();
    }
    validate() {
        if (!this.id || this.id.trim().length === 0) {
            throw new Error('Member ID is required');
        }
        if (!this.evaluationId || this.evaluationId.trim().length === 0) {
            throw new Error('Evaluation ID is required');
        }
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Member name is required');
        }
        // Email pode ser plaintext OU hash SHA-256 (64 caracteres hex)
        // Aceita ambos os formatos
        if (!this.email || this.email.trim().length === 0) {
            throw new Error('Email is required');
        }
        // Access code pode ser plaintext (6 dígitos) OU hash (quando vem do Firestore)
        // Aceita ambos os formatos
        if (!this.accessCode || this.accessCode.trim().length === 0) {
            throw new Error('Access code is required');
        }
        if (this.completedEvaluations < 0) {
            throw new Error('Completed evaluations cannot be negative');
        }
        if (this.totalEvaluations < 0) {
            throw new Error('Total evaluations cannot be negative');
        }
        if (this.completedEvaluations > this.totalEvaluations) {
            throw new Error('Completed evaluations cannot exceed total evaluations');
        }
    }
    incrementCompletedEvaluations() {
        if (this.completedEvaluations >= this.totalEvaluations) {
            throw new Error('All evaluations already completed');
        }
        this.completedEvaluations++;
    }
    updateLastAccess() {
        this.lastAccessDate = new Date();
    }
    hasCompletedAll() {
        return this.completedEvaluations === this.totalEvaluations;
    }
    getProgressPercentage() {
        if (this.totalEvaluations === 0)
            return 0;
        return Math.round((this.completedEvaluations / this.totalEvaluations) * 100);
    }
}
exports.Member = Member;
//# sourceMappingURL=Member.js.map