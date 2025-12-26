"use strict";
/**
 * Use Case: Add Members
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMembersUseCase = void 0;
const Member_1 = require("../../domain/entities/Member");
class AddMembersUseCase {
    constructor(memberRepository) {
        this.memberRepository = memberRepository;
    }
    async execute(dto) {
        if (!dto.evaluationId || !dto.members || dto.members.length < 2) {
            throw new Error('At least 2 members are required');
        }
        const totalEvaluations = dto.members.length - 1;
        const members = [];
        for (const memberDto of dto.members) {
            const accessCode = this.generateAccessCode();
            const member = new Member_1.Member('', dto.evaluationId, memberDto.name, memberDto.email, accessCode, 0, totalEvaluations);
            members.push(member);
        }
        return await this.memberRepository.saveMany(members);
    }
    generateAccessCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
exports.AddMembersUseCase = AddMembersUseCase;
//# sourceMappingURL=AddMembersUseCase.js.map