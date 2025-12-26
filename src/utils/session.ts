import { isValidUUID, isValidAccessCode } from './validation';
import { hash, compareHashes } from './crypto';

/**
 * Tipos de sessão
 */
export type SessionType = 'manager' | 'member';

/**
 * Interface da sessão
 */
export interface Session {
  type: SessionType;
  evaluationId: string;
  userId: string; // ID do gestor ou membro
  token: string; // Token UUID (gestor) ou código hasheado (membro)
  accessCode?: string; // Código plaintext (apenas para membros) - usado para buscar dados
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
}

/**
 * Configuração de sessão
 */
export interface SessionConfig {
  maxAge: number; // Tempo máximo de vida (ms)
  inactivityTimeout: number; // Timeout por inatividade (ms)
}

/**
 * Configuração padrão
 * - maxAge: 7 dias
 * - inactivityTimeout: 2 horas
 */
const DEFAULT_CONFIG: SessionConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  inactivityTimeout: 2 * 60 * 60 * 1000, // 2 horas
};

/**
 * Chaves do localStorage
 */
const STORAGE_KEY = 'avalia360_session';
const CONFIG_KEY = 'avalia360_session_config';

/**
 * Gerenciador de sessão
 * Complexidade: Todas as operações O(1)
 */
class SessionManager {
  private config: SessionConfig;
  private activityTimer: number | null = null;

  constructor(config: SessionConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.startActivityTracking();
  }

  /**
   * Cria sessão de gestor com token UUID
   * Complexidade: O(1)
   */
  createManagerSession(
    evaluationId: string,
    managerId: string,
    token: string
  ): Session | null {
    if (!isValidUUID(token)) {
      console.error('Token UUID inválido');
      return null;
    }

    const now = Date.now();
    const session: Session = {
      type: 'manager',
      evaluationId,
      userId: managerId,
      token,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.maxAge,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Cria sessão de membro com código de acesso
   * Complexidade: O(1)
   */
  createMemberSession(
    evaluationId: string,
    memberId: string,
    accessCode: string
  ): Session | null {
    if (!isValidAccessCode(accessCode)) {
      console.error('Código de acesso inválido');
      return null;
    }

    const now = Date.now();
    const session: Session = {
      type: 'member',
      evaluationId,
      userId: memberId,
      token: hash(accessCode), // Hash para validação
      accessCode, // Código plaintext para buscar dados
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.config.maxAge,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Obtém sessão atual
   * Complexidade: O(1)
   */
  getSession(): Session | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const session: Session = JSON.parse(stored);

      // Valida se a sessão ainda é válida
      if (!this.isSessionValid(session)) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Valida se a sessão ainda é válida
   * Verifica:
   * - Se não expirou (maxAge)
   * - Se não está inativa (inactivityTimeout)
   * Complexidade: O(1)
   */
  isSessionValid(session: Session | null): boolean {
    if (!session) {
      return false;
    }

    const now = Date.now();

    // Verifica se expirou
    if (now > session.expiresAt) {
      console.log('Sessão expirada');
      return false;
    }

    // Verifica inatividade
    const inactiveTime = now - session.lastActivity;
    if (inactiveTime > this.config.inactivityTimeout) {
      console.log('Sessão inativa há muito tempo');
      return false;
    }

    return true;
  }

  /**
   * Atualiza última atividade da sessão
   * Deve ser chamado em cada interação do usuário
   * Complexidade: O(1)
   */
  updateActivity(): void {
    const session = this.getSession();
    if (!session) {
      return;
    }

    session.lastActivity = Date.now();
    this.saveSession(session);
  }

  /**
   * Valida token de gestor
   * Complexidade: O(1)
   */
  validateManagerToken(token: string): boolean {
    const session = this.getSession();

    if (!session || session.type !== 'manager') {
      return false;
    }

    return session.token === token;
  }

  /**
   * Valida código de acesso de membro
   * Usa timing-safe comparison para prevenir timing attacks
   * Complexidade: O(N) onde N é o tamanho do código
   */
  validateMemberCode(accessCode: string): boolean {
    const session = this.getSession();

    if (!session || session.type !== 'member') {
      return false;
    }

    const codeHash = hash(accessCode);
    return compareHashes(session.token, codeHash);
  }

  /**
   * Limpa sessão atual
   * Complexidade: O(1)
   */
  clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.stopActivityTracking();
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }
  }

  /**
   * Verifica se existe sessão ativa
   * Complexidade: O(1)
   */
  hasActiveSession(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Obtém tipo da sessão atual
   * Complexidade: O(1)
   */
  getSessionType(): SessionType | null {
    const session = this.getSession();
    return session?.type || null;
  }

  /**
   * Obtém ID da avaliação da sessão atual
   * Complexidade: O(1)
   */
  getEvaluationId(): string | null {
    const session = this.getSession();
    return session?.evaluationId || null;
  }

  /**
   * Obtém ID do usuário da sessão atual
   * Complexidade: O(1)
   */
  getUserId(): string | null {
    const session = this.getSession();
    return session?.userId || null;
  }

  /**
   * Obtém tempo restante até expiração (em ms)
   * Complexidade: O(1)
   */
  getTimeUntilExpiration(): number | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    return Math.max(0, session.expiresAt - Date.now());
  }

  /**
   * Obtém tempo de inatividade (em ms)
   * Complexidade: O(1)
   */
  getInactivityTime(): number | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    return Date.now() - session.lastActivity;
  }

  /**
   * Renova sessão (estende expiração)
   * Complexidade: O(1)
   */
  renewSession(): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    const now = Date.now();
    session.expiresAt = now + this.config.maxAge;
    session.lastActivity = now;
    this.saveSession(session);
    return true;
  }

  /**
   * Salva sessão no localStorage
   * Privado - uso interno
   * Complexidade: O(1)
   */
  private saveSession(session: Session): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      throw new Error('Falha ao salvar sessão');
    }
  }

  /**
   * Inicia tracking de atividade
   * Atualiza lastActivity a cada 30 segundos se houver sessão
   * Privado - uso interno
   */
  private startActivityTracking(): void {
    // Atualiza atividade a cada 30 segundos
    this.activityTimer = window.setInterval(() => {
      const session = this.getSession();
      if (session) {
        this.updateActivity();
      }
    }, 30 * 1000);
  }

  /**
   * Para tracking de atividade
   * Privado - uso interno
   */
  private stopActivityTracking(): void {
    if (this.activityTimer !== null) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }
}

/**
 * Instância singleton do SessionManager
 */
export const sessionManager = new SessionManager();

/**
 * Funções utilitárias para facilitar uso
 */

export function createManagerSession(
  evaluationId: string,
  managerId: string,
  token: string
): Session | null {
  return sessionManager.createManagerSession(evaluationId, managerId, token);
}

export function createMemberSession(
  evaluationId: string,
  memberId: string,
  accessCode: string
): Session | null {
  return sessionManager.createMemberSession(evaluationId, memberId, accessCode);
}

export function getSession(): Session | null {
  return sessionManager.getSession();
}

export function clearSession(): void {
  sessionManager.clearSession();
}

export function hasActiveSession(): boolean {
  return sessionManager.hasActiveSession();
}

export function updateActivity(): void {
  sessionManager.updateActivity();
}

export function validateManagerToken(token: string): boolean {
  return sessionManager.validateManagerToken(token);
}

export function validateMemberCode(accessCode: string): boolean {
  return sessionManager.validateMemberCode(accessCode);
}

export function getSessionType(): SessionType | null {
  return sessionManager.getSessionType();
}

export function getEvaluationId(): string | null {
  return sessionManager.getEvaluationId();
}

export function getUserId(): string | null {
  return sessionManager.getUserId();
}

export function renewSession(): boolean {
  return sessionManager.renewSession();
}
