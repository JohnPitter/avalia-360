/**
 * Circuit Breaker Pattern
 * Previne cascata de falhas ao "abrir o circuito" após múltiplas falhas
 *
 * Estados do Circuit Breaker:
 * - CLOSED: Circuito normal, todas as requisições passam
 * - OPEN: Circuito aberto, requisições falham imediatamente
 * - HALF_OPEN: Teste se o serviço se recuperou
 *
 * Fluxo:
 * CLOSED → (falhas > threshold) → OPEN → (timeout) → HALF_OPEN → (sucesso) → CLOSED
 *                                                    ↓ (falha)
 *                                                   OPEN
 */

import { logger } from '@/services/observability/logger';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing fast
  HALF_OPEN = 'half_open', // Testing recovery
}

export interface CircuitBreakerOptions {
  /**
   * Número de falhas consecutivas para abrir o circuito
   * @default 5
   */
  failureThreshold?: number;

  /**
   * Tempo em ms que o circuito fica aberto antes de tentar HALF_OPEN
   * @default 60000 (1 minuto)
   */
  openTimeoutMs?: number;

  /**
   * Número de requisições de sucesso em HALF_OPEN para fechar
   * @default 2
   */
  successThreshold?: number;

  /**
   * Timeout em ms para considerar requisição como falha
   * @default 30000 (30 segundos)
   */
  requestTimeoutMs?: number;

  /**
   * Callback quando o circuito abre
   */
  onOpen?: () => void;

  /**
   * Callback quando o circuito fecha
   */
  onClose?: () => void;

  /**
   * Callback quando entra em half-open
   */
  onHalfOpen?: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>> = {
  failureThreshold: 5,
  openTimeoutMs: 60000,
  successThreshold: 2,
  requestTimeoutMs: 30000,
};

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private openTimeout?: NodeJS.Timeout;
  private readonly options: Required<Omit<CircuitBreakerOptions, 'onOpen' | 'onClose' | 'onHalfOpen'>>;
  private readonly name: string;
  private readonly callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onHalfOpen?: () => void;
  };

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.callbacks = {
      onOpen: options.onOpen,
      onClose: options.onClose,
      onHalfOpen: options.onHalfOpen,
    };

    logger.info(`Circuit breaker initialized: ${name}`, {
      component: 'CircuitBreaker',
      circuitName: name,
      options: this.options,
    });
  }

  /**
   * Executa função com proteção do circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Se circuito está aberto, fail fast
    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - (this.lastFailureTime || 0);

      // Se passou o timeout, tentar half-open
      if (timeSinceFailure >= this.options.openTimeoutMs) {
        this.transitionToHalfOpen();
      } else {
        const error = new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.name}. Try again in ${Math.ceil((this.options.openTimeoutMs - timeSinceFailure) / 1000)}s`
        );

        logger.warn(`Circuit breaker blocked request: ${this.name}`, {
          component: 'CircuitBreaker',
          circuitName: this.name,
          state: this.state,
          failureCount: this.failureCount,
        });

        throw error;
      }
    }

    try {
      // Executar com timeout
      const result = await this.executeWithTimeout(fn);

      // Sucesso!
      this.onSuccess();

      return result;
    } catch (error) {
      // Falha
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Executa função com timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${this.options.requestTimeoutMs}ms`));
        }, this.options.requestTimeoutMs);
      }),
    ]);
  }

  /**
   * Handler de sucesso
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      logger.info(`Circuit breaker success in HALF_OPEN: ${this.name}`, {
        component: 'CircuitBreaker',
        circuitName: this.name,
        successCount: this.successCount,
        successThreshold: this.options.successThreshold,
      });

      // Se atingiu threshold de sucesso, fechar circuito
      if (this.successCount >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count em sucesso
      this.failureCount = 0;
    }
  }

  /**
   * Handler de falha
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.error(`Circuit breaker failure: ${this.name}`, error, {
      component: 'CircuitBreaker',
      circuitName: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.options.failureThreshold,
    });

    // Se em HALF_OPEN, volta para OPEN
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen();
      return;
    }

    // Se em CLOSED e atingiu threshold, abre circuito
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Transição para OPEN
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.successCount = 0;

    logger.warn(`Circuit breaker OPENED: ${this.name}`, {
      component: 'CircuitBreaker',
      circuitName: this.name,
      failureCount: this.failureCount,
      openTimeoutMs: this.options.openTimeoutMs,
    });

    if (this.callbacks.onOpen) {
      this.callbacks.onOpen();
    }

    // Agendar tentativa de half-open
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
    }

    this.openTimeout = setTimeout(() => {
      this.transitionToHalfOpen();
    }, this.options.openTimeoutMs);
  }

  /**
   * Transição para HALF_OPEN
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;

    logger.info(`Circuit breaker HALF_OPEN: ${this.name}`, {
      component: 'CircuitBreaker',
      circuitName: this.name,
    });

    if (this.callbacks.onHalfOpen) {
      this.callbacks.onHalfOpen();
    }
  }

  /**
   * Transição para CLOSED
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;

    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = undefined;
    }

    logger.info(`Circuit breaker CLOSED: ${this.name}`, {
      component: 'CircuitBreaker',
      circuitName: this.name,
    });

    if (this.callbacks.onClose) {
      this.callbacks.onClose();
    }
  }

  /**
   * Retorna estado atual do circuito
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Retorna estatísticas do circuit breaker
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      options: this.options,
    };
  }

  /**
   * Reset manual do circuit breaker
   */
  reset(): void {
    logger.info(`Circuit breaker manually reset: ${this.name}`, {
      component: 'CircuitBreaker',
      circuitName: this.name,
    });

    this.transitionToClosed();
  }
}

/**
 * Circuit Breaker presets para casos comuns
 */
export const CircuitBreakerPresets = {
  /**
   * API externa (menos tolerante)
   */
  EXTERNAL_API: {
    failureThreshold: 3,
    openTimeoutMs: 30000, // 30s
    successThreshold: 2,
    requestTimeoutMs: 10000, // 10s
  } as CircuitBreakerOptions,

  /**
   * Database (mais tolerante)
   */
  DATABASE: {
    failureThreshold: 5,
    openTimeoutMs: 60000, // 1min
    successThreshold: 3,
    requestTimeoutMs: 30000, // 30s
  } as CircuitBreakerOptions,

  /**
   * Microservice interno (balanceado)
   */
  MICROSERVICE: {
    failureThreshold: 5,
    openTimeoutMs: 45000, // 45s
    successThreshold: 2,
    requestTimeoutMs: 20000, // 20s
  } as CircuitBreakerOptions,

  /**
   * Third-party API (muito tolerante)
   */
  THIRD_PARTY: {
    failureThreshold: 10,
    openTimeoutMs: 120000, // 2min
    successThreshold: 3,
    requestTimeoutMs: 15000, // 15s
  } as CircuitBreakerOptions,
};
