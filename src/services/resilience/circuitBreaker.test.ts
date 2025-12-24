import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState, CircuitBreakerError } from './circuitBreaker';

describe('Circuit Breaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-circuit', {
      failureThreshold: 3,
      openTimeoutMs: 1000,
      successThreshold: 2,
      requestTimeoutMs: 500,
    });
  });

  describe('State Transitions', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after threshold failures', async () => {
      const failingFn = () => Promise.reject(new Error('Service failed'));

      // 3 falhas (threshold)
      await expect(breaker.execute(failingFn)).rejects.toThrow('Service failed');
      await expect(breaker.execute(failingFn)).rejects.toThrow('Service failed');
      await expect(breaker.execute(failingFn)).rejects.toThrow('Service failed');

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should fail fast when OPEN', async () => {
      const failingFn = () => Promise.reject(new Error('Service failed'));

      // Abrir circuito
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Deve falhar imediatamente sem chamar a função
      const spy = vi.fn(failingFn);
      await expect(breaker.execute(spy)).rejects.toThrow(CircuitBreakerError);
      expect(spy).not.toHaveBeenCalled(); // Não executou a função
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const failingFn = () => Promise.reject(new Error('Service failed'));

      // Abrir circuito
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Aguardar timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Próxima chamada deve tentar (HALF_OPEN)
      const successFn = () => Promise.resolve('ok');
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should transition to CLOSED after success threshold in HALF_OPEN', async () => {
      const failingFn = () => Promise.reject(new Error('Service failed'));
      const successFn = () => Promise.resolve('ok');

      // Abrir circuito
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Aguardar e tentar recuperação
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 2 sucessos (threshold)
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should go back to OPEN on failure in HALF_OPEN', async () => {
      const failingFn = () => Promise.reject(new Error('Service failed'));
      const successFn = () => Promise.resolve('ok');

      // Abrir circuito
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      // Aguardar e tentar recuperação
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 1 sucesso
      await breaker.execute(successFn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Falha - volta para OPEN
      await expect(breaker.execute(failingFn)).rejects.toThrow();
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Request Timeout', () => {
    it('should timeout slow requests', async () => {
      const slowFn = () =>
        new Promise((resolve) => setTimeout(() => resolve('ok'), 1000));

      await expect(breaker.execute(slowFn)).rejects.toThrow('Request timeout');
    });

    it('should count timeout as failure', async () => {
      const slowFn = () =>
        new Promise((resolve) => setTimeout(() => resolve('ok'), 1000));

      // 3 timeouts
      await expect(breaker.execute(slowFn)).rejects.toThrow();
      await expect(breaker.execute(slowFn)).rejects.toThrow();
      await expect(breaker.execute(slowFn)).rejects.toThrow();

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Callbacks', () => {
    it('should call onOpen callback', async () => {
      const onOpen = vi.fn();
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 2,
        onOpen,
      });

      const failingFn = () => Promise.reject(new Error('fail'));

      await expect(breaker.execute(failingFn)).rejects.toThrow();
      await expect(breaker.execute(failingFn)).rejects.toThrow();

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('should call onClose callback', async () => {
      const onClose = vi.fn();
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 2,
        openTimeoutMs: 100,
        successThreshold: 1,
        onClose,
      });

      const failingFn = () => Promise.reject(new Error('fail'));
      const successFn = () => Promise.resolve('ok');

      // Abrir
      await expect(breaker.execute(failingFn)).rejects.toThrow();
      await expect(breaker.execute(failingFn)).rejects.toThrow();

      // Aguardar e fechar
      await new Promise((resolve) => setTimeout(resolve, 150));
      await breaker.execute(successFn);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stats and Reset', () => {
    it('should return correct stats', () => {
      const stats = breaker.getStats();

      expect(stats.name).toBe('test-circuit');
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
    });

    it('should reset circuit to CLOSED', async () => {
      const failingFn = () => Promise.reject(new Error('fail'));

      // Abrir circuito
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(breaker.getStats().failureCount).toBe(0);
    });
  });
});
