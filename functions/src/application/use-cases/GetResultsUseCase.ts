/**
 * Use Case: Get Results
 */

import {Member} from '../../domain/entities/Member';
import {IMemberRepository} from '../../domain/repositories/IMemberRepository';
import {IResponseRepository} from '../../domain/repositories/IResponseRepository';

export interface MemberResult {
  member: Member;
  averages: {
    question_1: number;
    question_2: number;
    question_3: number;
    question_4: number;
    question_5: number;
    overall: number;
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

      results.push({
        member,
        averages,
        responseCount: responses.length,
      });
    }

    return results;
  }

  private calculateAverages(responses: any[]): any {
    if (responses.length === 0) {
      return {
        question_1: 0,
        question_2: 0,
        question_3: 0,
        question_4: 0,
        question_5: 0,
        overall: 0,
      };
    }

    const sum = (q: string) =>
      responses.reduce((acc, r) => acc + r.ratings[q], 0) / responses.length;

    const q1 = sum('question_1');
    const q2 = sum('question_2');
    const q3 = sum('question_3');
    const q4 = sum('question_4');
    const q5 = sum('question_5');

    return {
      question_1: q1,
      question_2: q2,
      question_3: q3,
      question_4: q4,
      question_5: q5,
      overall: (q1 + q2 + q3 + q4 + q5) / 5,
    };
  }
}
