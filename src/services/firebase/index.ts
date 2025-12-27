/**
 * Firebase Services
 * Exporta todos os serviços do Firebase
 */

// Config
export { db } from './config';

// Evaluation Service
export {
  createEvaluation,
  getEvaluation,
  getEvaluationsByCreator,
  updateEvaluationStatus,
  activateEvaluation,
  completeEvaluation,
  validateManagerToken,
  updateEvaluationTitle,
  deleteEvaluation,
  countEvaluationsByStatus,
} from './evaluation.service';

export type { CreateEvaluationData } from './evaluation.service';

// Member Service
export {
  addMembers,
  getMembers,
  getMember,
  getMembersByAccessCode,
  validateAccessCode,
  updateLastAccess,
  incrementCompletedEvaluations,
  getEvaluationProgress,
  getPendingMembers,
  hasMemberCompleted,
  removeMember,
} from './member.service';

export type { MemberData, MemberWithAccessCode } from './member.service';

// Response Service
export {
  createResponse,
  submitResponseEncrypted,
  getResponse,
  getResponsesForMember,
  getPendingEvaluations,
  consolidateMemberResults,
  consolidateAllResults,
  countResponses,
  isEvaluationComplete,
} from './response.service';

export type { CreateResponseData } from './response.service';

// Manager Service
export {
  searchManagerEvaluations,
  getManagerEvaluationByToken,
  listManagerEvaluations,
  validateManagerAccess,
} from './manager.service';

export type { ManagerEvaluationResult } from './manager.service';
