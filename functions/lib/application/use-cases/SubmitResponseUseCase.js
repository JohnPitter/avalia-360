"use strict";
/**
 * Use Case: Submit Response
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitResponseUseCase = void 0;
const Response_1 = require("../../domain/entities/Response");
class SubmitResponseUseCase {
    constructor(responseRepository, memberRepository) {
        this.responseRepository = responseRepository;
        this.memberRepository = memberRepository;
    }
    async execute(dto) {
        // Verificar se já existe resposta
        const exists = await this.responseRepository.exists(dto.evaluationId, dto.evaluatorId, dto.evaluatedId);
        if (exists) {
            throw new Error('Response already submitted');
        }
        // Criar entidade Response (com validações)
        const response = new Response_1.Response('', dto.evaluationId, dto.evaluatorId, dto.evaluatedId, dto.ratings, dto.comments, new Date());
        // Salvar resposta
        const savedResponse = await this.responseRepository.save(response);
        // Incrementar contador do avaliador
        await this.memberRepository.incrementCompleted(dto.evaluatorId);
        return savedResponse;
    }
}
exports.SubmitResponseUseCase = SubmitResponseUseCase;
//# sourceMappingURL=SubmitResponseUseCase.js.map