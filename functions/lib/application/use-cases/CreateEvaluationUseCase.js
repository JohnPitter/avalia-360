"use strict";
/**
 * Use Case: Create Evaluation
 *
 * Regra de negócio da aplicação: criar uma nova avaliação 360°
 * - Gera manager token
 * - Criptografa dados sensíveis
 * - Persiste no repositório
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEvaluationUseCase = void 0;
const Evaluation_1 = require("../../domain/entities/Evaluation");
const uuid_1 = require("uuid");
class CreateEvaluationUseCase {
    constructor(evaluationRepository) {
        this.evaluationRepository = evaluationRepository;
    }
    async execute(dto) {
        // Validar entrada
        if (!dto.creatorEmail || !dto.title) {
            throw new Error('Creator email and title are required');
        }
        // Gerar token do gestor (UUID v4)
        const managerToken = (0, uuid_1.v4)();
        // Criar entidade Evaluation (com validações de domínio)
        const evaluation = new Evaluation_1.Evaluation('', // ID será gerado pelo repositório
        dto.creatorEmail.toLowerCase().trim(), dto.title.trim(), managerToken, new Date(), 'draft');
        // Persistir
        const savedEvaluation = await this.evaluationRepository.save(evaluation);
        // Retornar resultado
        return {
            evaluation: savedEvaluation,
            managerToken,
        };
    }
}
exports.CreateEvaluationUseCase = CreateEvaluationUseCase;
//# sourceMappingURL=CreateEvaluationUseCase.js.map