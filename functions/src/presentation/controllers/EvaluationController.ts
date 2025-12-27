/**
 * Presentation: Evaluation Controller
 * Orquestra Use Cases relacionados a Evaluation
 */

import {CreateEvaluationUseCase} from '../../application/use-cases/CreateEvaluationUseCase';
import {AddMembersUseCase} from '../../application/use-cases/AddMembersUseCase';
import {GetResultsUseCase} from '../../application/use-cases/GetResultsUseCase';
import {FirestoreEvaluationRepository} from '../../infrastructure/database/FirestoreEvaluationRepository';
import {FirestoreMemberRepository} from '../../infrastructure/database/FirestoreMemberRepository';
import {FirestoreResponseRepository} from '../../infrastructure/database/FirestoreResponseRepository';
import {decrypt} from '../../infrastructure/services/encryption.service';

export class EvaluationController {
  private evaluationRepo = new FirestoreEvaluationRepository();
  private memberRepo = new FirestoreMemberRepository();
  private responseRepo = new FirestoreResponseRepository();

  async createEvaluation(data: any) {
    const useCase = new CreateEvaluationUseCase(this.evaluationRepo);
    const result = await useCase.execute({
      creatorEmail: data.creatorEmail,
      title: data.title,
    });

    return {
      evaluationId: result.evaluation.id,
      managerToken: result.managerToken,
      title: result.evaluation.title,
    };
  }

  async addMembers(data: any) {
    const useCase = new AddMembersUseCase(this.memberRepo);
    const members = await useCase.execute({
      evaluationId: data.evaluationId,
      members: data.members,
    });

    return {
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        accessCode: m.accessCode,
      })),
    };
  }

  async getResults(data: any) {
    const useCase = new GetResultsUseCase(this.memberRepo, this.responseRepo);
    const results = await useCase.execute(data.evaluationId);

    console.log(`[getResults] Total de resultados: ${results.length}`);

    return {
      results: results.map((r) => {
        console.log(`[getResults] Processando membro ${r.member.id}:`);
        console.log(`  - Comentários positivos (cript): ${r.comments.positive.length}`);
        console.log(`  - Comentários melhoria (cript): ${r.comments.improvement.length}`);
        // Descriptografa nome e email do membro
        let memberName = r.member.name;
        let memberEmail = r.member.email;

        try {
          memberName = decrypt(r.member.name);
        } catch (error) {
          console.error(`Erro ao descriptografar nome do membro ${r.member.id}:`, error);
        }

        try {
          memberEmail = decrypt(r.member.email);
        } catch (error) {
          console.error(`Erro ao descriptografar email do membro ${r.member.id}:`, error);
        }

        // Comentários já vêm descriptografados do repository
        return {
          member: {
            id: r.member.id,
            name: memberName, // Descriptografado
            email: memberEmail, // Descriptografado
            evaluation_id: r.member.evaluationId,
            access_code: r.member.accessCode,
            completed_evaluations: r.member.completedEvaluations,
            total_evaluations: r.member.totalEvaluations,
            last_access_date: r.member.lastAccessDate?.getTime() || null,
          },
          averages: r.averages,
          comments: r.comments, // Já descriptografados pelo repository
          totalResponses: r.responseCount,
        };
      }),
    };
  }
}
