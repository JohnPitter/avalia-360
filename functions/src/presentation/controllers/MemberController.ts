/**
 * Presentation: Member Controller
 * Orquestra Use Cases relacionados a Member e Response
 */

import {SubmitResponseUseCase} from '../../application/use-cases/SubmitResponseUseCase';
import {FirestoreMemberRepository} from '../../infrastructure/database/FirestoreMemberRepository';
import {FirestoreResponseRepository} from '../../infrastructure/database/FirestoreResponseRepository';
import {HashService} from '../../infrastructure/security/HashService';

export class MemberController {
  private memberRepo = new FirestoreMemberRepository();
  private responseRepo = new FirestoreResponseRepository();

  async getMembersByAccessCode(data: any) {
    const codeHash = HashService.hashAccessCode(data.accessCode);
    const member = await this.memberRepo.findByAccessCode(codeHash);

    if (!member) {
      throw new Error('Access code not found');
    }

    const allMembers = await this.memberRepo.findByEvaluationId(
      member.evaluationId
    );

    return {
      members: allMembers.map((m) => ({
        id: m.id,
        name: m.email.split('@')[0], // Fallback
        email: m.email,
        completedEvaluations: m.completedEvaluations,
        totalEvaluations: m.totalEvaluations,
      })),
    };
  }

  async submitResponse(data: any) {
    const useCase = new SubmitResponseUseCase(
      this.responseRepo,
      this.memberRepo
    );

    await useCase.execute({
      evaluationId: data.evaluationId,
      evaluatorId: data.evaluatorId,
      evaluatedId: data.evaluatedId,
      ratings: data.ratings,
      comments: data.comments,
    });

    return {success: true};
  }

  async updateLastAccess(data: any) {
    await this.memberRepo.updateLastAccess(data.memberId, new Date());
    return {success: true};
  }
}
