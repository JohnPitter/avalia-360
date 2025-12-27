/**
 * Use Case: Get Results
 * Retorna resultados consolidados COM COMENTÁRIOS
 */

import {Member} from '../../domain/entities/Member';
import {Response} from '../../domain/entities/Response';
import {IMemberRepository} from '../../domain/repositories/IMemberRepository';
import {IResponseRepository} from '../../domain/repositories/IResponseRepository';

export interface MemberResult {
  member: Member;
  averages: {
    question_1: number;
    question_2: number;
    question_3: number;
    question_4: number;
    overall: number;
  };
  comments: {
    positive: string[];
    improvement: string[];
  };
  responseCount: number;
}

export class GetResultsUseCase {
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly responseRepository: IResponseRepository
  ) {}

  async execute(evaluationId: string): Promise<MemberResult[]> {
    const members = await this.memberRepository.findByEvaluationId(evaluationId);
    const results: MemberResult[] = [];

    for (const member of members) {
      const responses = await this.responseRepository.findByEvaluatedId(
        evaluationId,
        member.id
      );

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

  private calculateAverages(responses: Response[]): any {
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
  private aggregateComments(responses: Response[]): {positive: string[]; improvement: string[]} {
    const positive: string[] = [];
    const improvement: string[] = [];

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

    return {positive, improvement};
  }
}
