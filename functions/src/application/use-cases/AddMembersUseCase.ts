/**
 * Use Case: Add Members
 */

import {Member} from '../../domain/entities/Member';
import {IMemberRepository} from '../../domain/repositories/IMemberRepository';

export interface MemberDTO {
  name: string;
  email: string;
}

export interface AddMembersDTO {
  evaluationId: string;
  members: MemberDTO[];
}

export class AddMembersUseCase {
  constructor(private readonly memberRepository: IMemberRepository) {}

  async execute(dto: AddMembersDTO): Promise<Member[]> {
    if (!dto.evaluationId || !dto.members || dto.members.length < 2) {
      throw new Error('At least 2 members are required');
    }

    const totalEvaluations = dto.members.length - 1;
    const members: Member[] = [];

    for (const memberDto of dto.members) {
      const accessCode = this.generateAccessCode();

      const member = new Member(
        '',
        dto.evaluationId,
        memberDto.name,
        memberDto.email,
        accessCode,
        0,
        totalEvaluations
      );

      members.push(member);
    }

    return await this.memberRepository.saveMany(members);
  }

  private generateAccessCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
