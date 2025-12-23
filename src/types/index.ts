// ==========================================
// Tipos principais da aplicação
// ==========================================

/**
 * Status da avaliação
 */
export type EvaluationStatus = 'draft' | 'active' | 'completed';

/**
 * Avaliação 360°
 */
export interface Evaluation {
  id: string;
  creator_email: string; // Hash SHA-256
  creator_token: string; // Token UUID encrypted
  title: string; // Encrypted AES-256
  created_at: number; // Timestamp
  status: EvaluationStatus;
}

/**
 * Membro da equipe
 */
export interface TeamMember {
  id: string;
  avaliation_id: string; // FK para Evaluation
  name: string; // Encrypted AES-256
  email: string; // Hash SHA-256
  access_code: string; // Hash SHA-256 do código de 6 dígitos
  completed_evaluations: number; // Número de avaliações completadas
  total_evaluations: number; // Total de avaliações que precisa fazer (N-1)
  last_access_date: number | null; // Timestamp
}

/**
 * Resposta de avaliação
 */
export interface Response {
  id: string;
  avaliation_id: string; // FK para Evaluation
  evaluator_id: string; // FK para TeamMember (quem está avaliando)
  evaluated_id: string; // FK para TeamMember (quem está sendo avaliado)
  question_1: number; // 1-5 (Satisfação) - Encrypted
  question_2: number; // 1-5 (Proatividade) - Encrypted
  question_3: number; // 1-5 (Qualidade) - Encrypted
  question_4: number; // 1-5 (Trabalho em equipe) - Encrypted
  positive_points: string; // Encrypted AES-256
  improvement_points: string; // Encrypted AES-256
  created_at: number; // Timestamp
}

/**
 * Dados do formulário de criação de avaliação
 */
export interface CreateEvaluationFormData {
  title: string;
  members: Array<{
    name: string;
    email: string;
  }>;
}

/**
 * Dados do formulário de avaliação
 */
export interface EvaluationFormData {
  question_1: number;
  question_2: number;
  question_3: number;
  question_4: number;
  positive_points: string;
  improvement_points: string;
}

/**
 * Progresso de um membro
 */
export interface MemberProgress {
  member: TeamMember;
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Resultado consolidado por pessoa
 */
export interface ConsolidatedResult {
  member: TeamMember;
  averages: {
    overall: number; // Média geral
    question_1: number;
    question_2: number;
    question_3: number;
    question_4: number;
  };
  comments: {
    positive: string[]; // Lista de comentários positivos (anônimos)
    improvement: string[]; // Lista de pontos de melhoria (anônimos)
  };
  totalResponses: number; // Número de respostas recebidas
}

/**
 * Dashboard de progresso
 */
export interface ProgressDashboard {
  evaluation: Evaluation;
  overall: {
    completed: number;
    total: number;
    percentage: number;
  };
  members: MemberProgress[];
}

/**
 * Token de acesso do gestor
 */
export interface ManagerToken {
  evaluationId: string;
  token: string;
}

/**
 * Código de acesso do colaborador
 */
export interface MemberAccessCode {
  memberId: string;
  evaluationId: string;
  code: string; // 6 dígitos
}

/**
 * Log de segurança
 */
export interface SecurityLog {
  id: string;
  timestamp: number;
  event_type: 'login_attempt' | 'login_success' | 'login_fail' | 'unauthorized_access' | 'data_access';
  evaluation_id?: string;
  member_id?: string;
  ip_address?: string;
  user_agent: string;
  details: string;
}

/**
 * Configuração do EmailJS
 */
export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

/**
 * Dados para envio de email
 */
export interface EmailData {
  to_name: string;
  to_email: string;
  manager_name: string;
  evaluation_title: string;
  evaluation_link: string;
  access_code: string;
}

// ==========================================
// Tipos de validação
// ==========================================

/**
 * Resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Erro customizado da aplicação
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
