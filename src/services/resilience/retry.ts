/**
 * Retry Logic with Exponential Backoff
 * Implementa retry automático para falhas transitórias
 *
 * Características:
 * - Exponential backoff (tempo de espera cresce exponencialmente)
 * - Jitter (aleatoriedade para evitar thundering herd)
 * - Max attempts configurável
 * - Predicado para decidir se deve retry
 * - Callbacks para hooks (onRetry, onFailure)
 */

import { logger } from '@/services/observability/logger';

export interface RetryOptions {
  /**
   * Número máximo de tentativas (incluindo a primeira)
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Delay inicial em ms antes do primeiro retry
   * @default 1000
   */
  initialDelayMs?: number;

  /**
   * Fator de multiplicação para cada retry
   * @default 2
   */
  backoffMultiplier?: number;

  /**
   * Delay máximo em ms (cap)
   * @default 30000 (30 segundos)
   */
  maxDelayMs?: number;

  /**
   * Adicionar jitter (aleatoriedade) ao delay
   * @default true
   */
  jitter?: boolean;

  /**
   * Predicado para decidir se deve fazer retry
   * Se não fornecido, sempre faz retry em caso de erro
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /**
   * Callback chamado antes de cada retry
   */
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;

  /**
   * Callback chamado quando todas as tentativas falharam
   */
  onFailure?: (error: Error, attempts: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'onFailure'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  jitter: true,
};

/**
 * Calcula delay do próximo retry com exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  backoffMultiplier: number,
  maxDelayMs: number,
  jitter: boolean
): number {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
  let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);

  // Cap no máximo
  delay = Math.min(delay, maxDelayMs);

  // Adicionar jitter (±25% aleatoriedade)
  if (jitter) {
    const jitterFactor = 0.25;
    const jitterRange = delay * jitterFactor;
    const jitterOffset = (Math.random() * 2 - 1) * jitterRange;
    delay = Math.max(0, delay + jitterOffset);
  }

  return Math.floor(delay);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executa função com retry automático
 *
 * @param fn - Função assíncrona a ser executada
 * @param options - Opções de retry
 * @returns Promise com resultado da função
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('API failed');
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 5,
 *     initialDelayMs: 500,
 *     shouldRetry: (error) => error.message.includes('timeout'),
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let attempt = 0;

  while (attempt < opts.maxAttempts) {
    try {
      // Tentar executar a função
      const result = await fn();

      // Sucesso! Log se foi retry
      if (attempt > 0) {
        logger.info(`Retry succeeded after ${attempt} attempts`, {
          operation: 'retry',
          attempts: attempt + 1,
        });
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      attempt++;

      // Verificar se deve fazer retry
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(lastError, attempt)
        : true;

      // Se não deve retry ou atingiu max attempts, lançar erro
      if (!shouldRetry || attempt >= opts.maxAttempts) {
        logger.error(
          `All ${attempt} retry attempts failed`,
          lastError,
          {
            operation: 'retry',
            attempts: attempt,
          }
        );

        if (options.onFailure) {
          options.onFailure(lastError, attempt);
        }

        throw lastError;
      }

      // Calcular delay e aguardar
      const delayMs = calculateDelay(
        attempt - 1,
        opts.initialDelayMs,
        opts.backoffMultiplier,
        opts.maxDelayMs,
        opts.jitter
      );

      logger.warn(
        `Retry attempt ${attempt}/${opts.maxAttempts} after ${delayMs}ms`,
        {
          operation: 'retry',
          attempt,
          maxAttempts: opts.maxAttempts,
          delayMs,
          error: lastError.message,
        }
      );

      if (options.onRetry) {
        options.onRetry(lastError, attempt, delayMs);
      }

      await sleep(delayMs);
    }
  }

  // TypeScript precisa disso (nunca deve chegar aqui)
  throw lastError!;
}

/**
 * Retry presets para casos comuns
 */
export const RetryPresets = {
  /**
   * Network requests (API calls, fetch)
   * 5 tentativas, 500ms inicial, até 10s max
   */
  NETWORK: {
    maxAttempts: 5,
    initialDelayMs: 500,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
    jitter: true,
    shouldRetry: (error: Error) => {
      // Retry em erros de rede
      const networkErrors = ['timeout', 'network', 'ECONNREFUSED', 'fetch failed'];
      return networkErrors.some((msg) =>
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    },
  } as RetryOptions,

  /**
   * Database operations (Firestore, etc)
   * 3 tentativas, 1s inicial, até 30s max
   */
  DATABASE: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 3,
    maxDelayMs: 30000,
    jitter: true,
    shouldRetry: (error: Error) => {
      // Retry em erros transitórios de DB
      const dbErrors = ['unavailable', 'deadline-exceeded', 'aborted'];
      return dbErrors.some((msg) =>
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    },
  } as RetryOptions,

  /**
   * File operations (upload, download)
   * 4 tentativas, 2s inicial, até 60s max
   */
  FILE: {
    maxAttempts: 4,
    initialDelayMs: 2000,
    backoffMultiplier: 2,
    maxDelayMs: 60000,
    jitter: true,
  } as RetryOptions,

  /**
   * Quick operations (não críticas)
   * 2 tentativas rápidas
   */
  QUICK: {
    maxAttempts: 2,
    initialDelayMs: 100,
    backoffMultiplier: 2,
    maxDelayMs: 500,
    jitter: false,
  } as RetryOptions,
};
