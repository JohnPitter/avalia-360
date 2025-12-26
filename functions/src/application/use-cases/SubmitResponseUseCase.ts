/**
 * Use Case: Submit Response
 */

import {Response, Ratings, Comments} from '../../domain/entities/Response';
import {IResponseRepository} from '../../domain/repositories/IResponseRepository';
import {IMemberRepository} from '../../domain/repositories/IMemberRepository';

export interface SubmitResponseDTO {
  evaluationId: string;
  evaluatorId: string;
  evaluatedId: string;
  ratings: Ratings;
  comments: Comments;
}

export class SubmitResponseUseCase {
  constructor(
    private readonly responseRepository: IResponseRepository,
    private readonly memberRepository: IMemberRepository
  ) {}

  async execute(dto: SubmitResponseDTO): Promise<Response> {
    // Verificar se já existe resposta
    const exists = await this.responseRepository.exists(
      dto.evaluationId,
      dto.evaluatorId,
      dto.evaluatedId
    );

    if (exists) {
      throw new Error('Response already submitted');
    }

    // Criar entidade Response (com validações)
    const response = new Response(
      '',
      dto.evaluationId,
      dto.evaluatorId,
      dto.evaluatedId,
      dto.ratings,
      dto.comments,
      new Date()
    );

    // Salvar resposta
    const savedResponse = await this.responseRepository.save(response);

    // Incrementar contador do avaliador
    await this.memberRepository.incrementCompleted(dto.evaluatorId);

    return savedResponse;
  }
}
