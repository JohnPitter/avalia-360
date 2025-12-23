import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sessionManager,
  createManagerSession,
  createMemberSession,
  getSession,
  clearSession,
  hasActiveSession,
  updateActivity,
  validateManagerToken,
  validateMemberCode,
  getSessionType,
  getEvaluationId,
  getUserId,
  renewSession,
  type Session,
} from './session';
import { generateToken, generateAccessCode } from './crypto';

describe('Session Management', () => {
  beforeEach(() => {
    // Limpa localStorage antes de cada teste
    localStorage.clear();
    clearSession();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Manager Session', () => {
    it('should create manager session with valid token', () => {
      const token = generateToken();
      const evaluationId = 'eval-123';
      const managerId = 'manager-456';

      const session = createManagerSession(evaluationId, managerId, token);

      expect(session).not.toBeNull();
      expect(session?.type).toBe('manager');
      expect(session?.evaluationId).toBe(evaluationId);
      expect(session?.userId).toBe(managerId);
      expect(session?.token).toBe(token);
    });

    it('should reject invalid UUID token', () => {
      const invalidToken = 'not-a-uuid';
      const session = createManagerSession('eval-123', 'manager-456', invalidToken);

      expect(session).toBeNull();
    });

    it('should validate correct manager token', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      expect(validateManagerToken(token)).toBe(true);
    });

    it('should reject incorrect manager token', () => {
      const token1 = generateToken();
      const token2 = generateToken();

      createManagerSession('eval-123', 'manager-456', token1);

      expect(validateManagerToken(token2)).toBe(false);
    });
  });

  describe('Member Session', () => {
    it('should create member session with valid access code', () => {
      const accessCode = generateAccessCode();
      const evaluationId = 'eval-123';
      const memberId = 'member-789';

      const session = createMemberSession(evaluationId, memberId, accessCode);

      expect(session).not.toBeNull();
      expect(session?.type).toBe('member');
      expect(session?.evaluationId).toBe(evaluationId);
      expect(session?.userId).toBe(memberId);
      // Token deve ser hash do código, não o código em si
      expect(session?.token).not.toBe(accessCode);
    });

    it('should reject invalid access code', () => {
      const invalidCode = '12345'; // Apenas 5 dígitos
      const session = createMemberSession('eval-123', 'member-789', invalidCode);

      expect(session).toBeNull();
    });

    it('should validate correct member code', () => {
      const accessCode = generateAccessCode();
      createMemberSession('eval-123', 'member-789', accessCode);

      expect(validateMemberCode(accessCode)).toBe(true);
    });

    it('should reject incorrect member code', () => {
      const code1 = '123456';
      const code2 = '654321';

      createMemberSession('eval-123', 'member-789', code1);

      expect(validateMemberCode(code2)).toBe(false);
    });
  });

  describe('Session Retrieval', () => {
    it('should retrieve active session', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session?.type).toBe('manager');
    });

    it('should return null when no session exists', () => {
      const session = getSession();
      expect(session).toBeNull();
    });

    it('should check if session exists', () => {
      expect(hasActiveSession()).toBe(false);

      createManagerSession('eval-123', 'manager-456', generateToken());

      expect(hasActiveSession()).toBe(true);
    });
  });

  describe('Session Type and Data', () => {
    it('should return correct session type', () => {
      expect(getSessionType()).toBeNull();

      createManagerSession('eval-123', 'manager-456', generateToken());
      expect(getSessionType()).toBe('manager');

      clearSession();

      createMemberSession('eval-123', 'member-789', '123456');
      expect(getSessionType()).toBe('member');
    });

    it('should return evaluation ID', () => {
      const evaluationId = 'eval-abc-123';
      createManagerSession(evaluationId, 'manager-456', generateToken());

      expect(getEvaluationId()).toBe(evaluationId);
    });

    it('should return user ID', () => {
      const managerId = 'manager-xyz-789';
      createManagerSession('eval-123', managerId, generateToken());

      expect(getUserId()).toBe(managerId);
    });
  });

  describe('Session Expiration', () => {
    it('should expire session after maxAge', () => {
      const token = generateToken();
      const session = createManagerSession('eval-123', 'manager-456', token);

      expect(session).not.toBeNull();

      // Simula expiração modificando expiresAt
      if (session) {
        session.expiresAt = Date.now() - 1000; // Expirou há 1 segundo
        localStorage.setItem('avalia360_session', JSON.stringify(session));
      }

      const retrievedSession = getSession();
      expect(retrievedSession).toBeNull();
    });

    it('should expire session after inactivity', () => {
      const token = generateToken();
      const session = createManagerSession('eval-123', 'manager-456', token);

      expect(session).not.toBeNull();

      // Simula inatividade modificando lastActivity
      if (session) {
        session.lastActivity = Date.now() - (3 * 60 * 60 * 1000); // 3 horas atrás
        localStorage.setItem('avalia360_session', JSON.stringify(session));
      }

      const retrievedSession = getSession();
      expect(retrievedSession).toBeNull();
    });

    it('should not expire valid session', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      const session = getSession();
      expect(session).not.toBeNull();
    });
  });

  describe('Session Activity', () => {
    it('should update last activity', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      const session1 = getSession();
      const initialActivity = session1?.lastActivity;

      // Aguarda 100ms
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      updateActivity();

      vi.useRealTimers();

      const session2 = getSession();
      const updatedActivity = session2?.lastActivity;

      expect(updatedActivity).toBeGreaterThan(initialActivity || 0);
    });

    it('should not update activity if no session', () => {
      // Não deve lançar erro
      expect(() => updateActivity()).not.toThrow();
    });
  });

  describe('Session Renewal', () => {
    it('should renew active session', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      const session1 = getSession();
      const initialExpiry = session1?.expiresAt;

      // Aguarda 100ms
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      const renewed = renewSession();
      expect(renewed).toBe(true);

      vi.useRealTimers();

      const session2 = getSession();
      const newExpiry = session2?.expiresAt;

      expect(newExpiry).toBeGreaterThan(initialExpiry || 0);
    });

    it('should not renew if no session', () => {
      const renewed = renewSession();
      expect(renewed).toBe(false);
    });
  });

  describe('Session Clearing', () => {
    it('should clear active session', () => {
      createManagerSession('eval-123', 'manager-456', generateToken());

      expect(hasActiveSession()).toBe(true);

      clearSession();

      expect(hasActiveSession()).toBe(false);
      expect(getSession()).toBeNull();
    });

    it('should not throw error when clearing non-existent session', () => {
      expect(() => clearSession()).not.toThrow();
    });
  });

  describe('Session Validation', () => {
    it('should validate session structure', () => {
      const token = generateToken();
      const session = createManagerSession('eval-123', 'manager-456', token);

      expect(session).toHaveProperty('type');
      expect(session).toHaveProperty('evaluationId');
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('token');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('lastActivity');
      expect(session).toHaveProperty('expiresAt');
    });

    it('should validate timestamps', () => {
      const token = generateToken();
      const session = createManagerSession('eval-123', 'manager-456', token);

      expect(session?.createdAt).toBeLessThanOrEqual(Date.now());
      expect(session?.lastActivity).toBeLessThanOrEqual(Date.now());
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should handle corrupted session data', () => {
      // Corrompe dados no localStorage
      localStorage.setItem('avalia360_session', 'invalid-json');

      const session = getSession();
      expect(session).toBeNull();

      // Deve ter limpado a sessão corrompida
      expect(localStorage.getItem('avalia360_session')).toBeNull();
    });
  });

  describe('Manager vs Member Validation', () => {
    it('should not validate member code for manager session', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      expect(validateMemberCode('123456')).toBe(false);
    });

    it('should not validate manager token for member session', () => {
      const token = generateToken();
      createMemberSession('eval-123', 'member-789', '123456');

      expect(validateManagerToken(token)).toBe(false);
    });
  });

  describe('SessionManager Class', () => {
    it('should validate session', () => {
      const validSession: Session = {
        type: 'manager',
        evaluationId: 'eval-123',
        userId: 'user-456',
        token: generateToken(),
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hora
      };

      expect(sessionManager.isSessionValid(validSession)).toBe(true);
    });

    it('should invalidate null session', () => {
      expect(sessionManager.isSessionValid(null)).toBe(false);
    });

    it('should invalidate expired session', () => {
      const expiredSession: Session = {
        type: 'manager',
        evaluationId: 'eval-123',
        userId: 'user-456',
        token: generateToken(),
        createdAt: Date.now() - 10000,
        lastActivity: Date.now() - 5000,
        expiresAt: Date.now() - 1000, // Expirou
      };

      expect(sessionManager.isSessionValid(expiredSession)).toBe(false);
    });

    it('should invalidate inactive session', () => {
      const inactiveSession: Session = {
        type: 'manager',
        evaluationId: 'eval-123',
        userId: 'user-456',
        token: generateToken(),
        createdAt: Date.now() - (4 * 60 * 60 * 1000), // 4 horas atrás
        lastActivity: Date.now() - (3 * 60 * 60 * 1000), // 3 horas atrás
        expiresAt: Date.now() + (60 * 60 * 1000), // Ainda não expirou
      };

      expect(sessionManager.isSessionValid(inactiveSession)).toBe(false);
    });

    it('should get time until expiration', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      const session = getSession();
      if (session) {
        const timeUntilExpiration = sessionManager.getTimeUntilExpiration();
        expect(timeUntilExpiration).toBeGreaterThan(0);
        expect(timeUntilExpiration).toBeLessThanOrEqual(
          7 * 24 * 60 * 60 * 1000 // 7 dias
        );
      }
    });

    it('should get inactivity time', () => {
      const token = generateToken();
      createManagerSession('eval-123', 'manager-456', token);

      const inactivityTime = sessionManager.getInactivityTime();
      expect(inactivityTime).not.toBeNull();
      expect(inactivityTime).toBeGreaterThanOrEqual(0);
      expect(inactivityTime).toBeLessThan(1000); // Menos de 1 segundo (recém criada)
    });
  });
});
