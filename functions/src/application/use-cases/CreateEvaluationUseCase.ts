/**
 * Use Case: Create Evaluation
 *
 * Regra de negócio da aplicação: criar uma nova avaliação 360°
 * - Gera manager token
 * - Criptografa dados sensíveis
 * - Persiste no repositório
 */

import {Evaluation} from '../../domain/entities/Evaluation';
import {IEvaluationRepository} from '../../domain/repositories/IEvaluationRepository';
import {v4 as uuidv4} from 'uuid';

export interface CreateEvaluationDTO {
  creatorEmail: string;
  title: string;
}

export interface CreateEvaluationResult {
  evaluation: Evaluation;
  managerToken: string;
}

export class CreateEvaluationUseCase {
  constructor(
    private readonly evaluationRepository: IEvaluationRepository
  ) {}

  async execute(dto: CreateEvaluationDTO): Promise<CreateEvaluationResult> {
    // Validar entrada
    if (!dto.creatorEmail || !dto.title) {
      throw new Error('Creator email and title are required');
    }

    // Gerar token do gestor (UUID v4)
    const managerToken = uuidv4();

    // Criar entidade Evaluation (com validações de domínio)
    const evaluation = new Evaluation(
      '', // ID será gerado pelo repositório
      dto.creatorEmail.toLowerCase().trim(),
      dto.title.trim(),
      managerToken,
      new Date(),
      'draft'
    );

    // Persistir
    const savedEvaluation = await this.evaluationRepository.save(evaluation);

    // Retornar resultado
    return {
      evaluation: savedEvaluation,
      managerToken,
    };
  }
}
