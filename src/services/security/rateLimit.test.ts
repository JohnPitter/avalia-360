import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  clearAllRateLimits,
  formatRetryAfter,
  RateLimitPresets,
} from './rateLimit';

describe('Rate Limiting Service', () => {
  beforeEach(() => {
    // Limpar todos os rate limits antes de cada teste
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow request for new identifier', () => {
      const result = checkRateLimit('user1');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
      expect(result.retryAfterMs).toBeUndefined();
      expect(result.lockedUntil).toBeUndefined();
    });

    it('should block after max attempts', () => {
      const identifier = 'user2';

      // 5 tentativas
      for (let i = 0; i < 5; i++) {
        recordAttempt(identifier);
      }

      const result = checkRateLimit(identifier);

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.lockedUntil).toBeInstanceOf(Date);
    });

    it('should respect custom config', () => {
      const config = {
        maxAttempts: 3,
        windowMs: 60000,
        lockoutDurationMs: 120000,
      };

      const identifier = 'user3';

      // 3 tentativas (custom max)
      for (let i = 0; i < 3; i++) {
        recordAttempt(identifier, config);
      }

      const result = checkRateLimit(identifier, config);

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });
  });

  describe('recordAttempt', () => {
    it('should record first attempt correctly', () => {
      const result = recordAttempt('user4');

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should decrement remaining attempts', () => {
      const identifier = 'user5';

      const first = recordAttempt(identifier);
      expect(first.remainingAttempts).toBe(4);

      const second = recordAttempt(identifier);
      expect(second.remainingAttempts).toBe(3);

      const third = recordAttempt(identifier);
      expect(third.remainingAttempts).toBe(2);
    });

    it('should lock after exceeding max attempts', () => {
      const identifier = 'user6';

      // 5 tentativas (máximo padrão)
      for (let i = 0; i < 5; i++) {
        recordAttempt(identifier);
      }

      const result = checkRateLimit(identifier);

      expect(result.allowed).toBe(false);
      expect(result.lockedUntil).toBeInstanceOf(Date);
    });

    it('should reset after window expires', () => {
      const config = {
        maxAttempts: 3,
        windowMs: 100, // 100ms
        lockoutDurationMs: 1000,
      };

      const identifier = 'user7';

      // 2 tentativas
      recordAttempt(identifier, config);
      recordAttempt(identifier, config);

      // Aguardar janela expirar
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result = recordAttempt(identifier, config);
          expect(result.remainingAttempts).toBe(2); // Resetado
          resolve();
        }, 150);
      });
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', () => {
      const identifier = 'user8';

      // 3 tentativas
      recordAttempt(identifier);
      recordAttempt(identifier);
      recordAttempt(identifier);

      // Verificar que há histórico
      let result = checkRateLimit(identifier);
      expect(result.remainingAttempts).toBe(2);

      // Resetar
      resetRateLimit(identifier);

      // Verificar que resetou
      result = checkRateLimit(identifier);
      expect(result.remainingAttempts).toBe(5);
    });
  });

  describe('formatRetryAfter', () => {
    it('should format seconds correctly', () => {
      expect(formatRetryAfter(1000)).toBe('1 segundo');
      expect(formatRetryAfter(5000)).toBe('5 segundos');
      expect(formatRetryAfter(30000)).toBe('30 segundos');
    });

    it('should format minutes correctly', () => {
      expect(formatRetryAfter(60000)).toBe('1 minuto');
      expect(formatRetryAfter(120000)).toBe('2 minutos');
      expect(formatRetryAfter(300000)).toBe('5 minutos');
    });

    it('should round up partial seconds/minutes', () => {
      expect(formatRetryAfter(1500)).toBe('2 segundos');
      expect(formatRetryAfter(90000)).toBe('2 minutos');
    });
  });

  describe('RateLimitPresets', () => {
    it('should have MANAGER_LOGIN preset', () => {
      expect(RateLimitPresets.MANAGER_LOGIN.maxAttempts).toBe(3);
      expect(RateLimitPresets.MANAGER_LOGIN.windowMs).toBe(15 * 60 * 1000);
      expect(RateLimitPresets.MANAGER_LOGIN.lockoutDurationMs).toBe(60 * 60 * 1000);
    });

    it('should have MEMBER_LOGIN preset', () => {
      expect(RateLimitPresets.MEMBER_LOGIN.maxAttempts).toBe(5);
      expect(RateLimitPresets.MEMBER_LOGIN.windowMs).toBe(15 * 60 * 1000);
      expect(RateLimitPresets.MEMBER_LOGIN.lockoutDurationMs).toBe(30 * 60 * 1000);
    });

    it('should have FORM_SUBMISSION preset', () => {
      expect(RateLimitPresets.FORM_SUBMISSION.maxAttempts).toBe(10);
      expect(RateLimitPresets.FORM_SUBMISSION.windowMs).toBe(5 * 60 * 1000);
      expect(RateLimitPresets.FORM_SUBMISSION.lockoutDurationMs).toBe(10 * 60 * 1000);
    });

    it('should work with MANAGER_LOGIN preset', () => {
      const identifier = 'manager1';

      // 3 tentativas (máximo do preset)
      for (let i = 0; i < 3; i++) {
        recordAttempt(identifier, RateLimitPresets.MANAGER_LOGIN);
      }

      const result = checkRateLimit(identifier, RateLimitPresets.MANAGER_LOGIN);

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple users independently', () => {
      const user1 = 'user_a';
      const user2 = 'user_b';

      // User 1: 4 tentativas
      for (let i = 0; i < 4; i++) {
        recordAttempt(user1);
      }

      // User 2: 2 tentativas
      for (let i = 0; i < 2; i++) {
        recordAttempt(user2);
      }

      const result1 = checkRateLimit(user1);
      const result2 = checkRateLimit(user2);

      expect(result1.remainingAttempts).toBe(1);
      expect(result2.remainingAttempts).toBe(3);
    });

    it('should handle successful login flow', () => {
      const identifier = 'successful_user';

      // Tentativas falhadas
      recordAttempt(identifier);
      recordAttempt(identifier);

      let result = checkRateLimit(identifier);
      expect(result.remainingAttempts).toBe(3);

      // Login bem-sucedido - reset
      resetRateLimit(identifier);

      // Verificar reset
      result = checkRateLimit(identifier);
      expect(result.remainingAttempts).toBe(5);
    });

    it('should prevent brute force attack', () => {
      const identifier = 'attacker';

      // Simular ataque brute force (10 tentativas)
      for (let i = 0; i < 10; i++) {
        recordAttempt(identifier);
      }

      const result = checkRateLimit(identifier);

      // Deve estar bloqueado
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.lockedUntil).toBeInstanceOf(Date);
    });
  });
});
