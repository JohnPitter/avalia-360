"use strict";
/**
 * Domain Entity: Evaluation
 *
 * Representa uma avaliação 360° no domínio
 * Regras de negócio puras, sem dependências externas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Evaluation = void 0;
class Evaluation {
    constructor(id, creatorEmail, title, managerToken, createdAt, status) {
        this.id = id;
        this.creatorEmail = creatorEmail;
        this.title = title;
        this.managerToken = managerToken;
        this.createdAt = createdAt;
        this.status = status;
        this.validate();
    }
    validate() {
        if (!this.id || this.id.trim().length === 0) {
            throw new Error('Evaluation ID is required');
        }
        if (!this.creatorEmail || !this.isValidEmail(this.creatorEmail)) {
            throw new Error('Valid creator email is required');
        }
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Evaluation title is required');
        }
        if (!this.managerToken || !this.isValidUUID(this.managerToken)) {
            throw new Error('Valid manager token (UUID) is required');
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    activate() {
        if (this.status !== 'draft') {
            throw new Error('Only draft evaluations can be activated');
        }
        this.status = 'active';
    }
    complete() {
        if (this.status !== 'active') {
            throw new Error('Only active evaluations can be completed');
        }
        this.status = 'completed';
    }
    isDraft() {
        return this.status === 'draft';
    }
    isActive() {
        return this.status === 'active';
    }
    isCompleted() {
        return this.status === 'completed';
    }
}
exports.Evaluation = Evaluation;
//# sourceMappingURL=Evaluation.js.map