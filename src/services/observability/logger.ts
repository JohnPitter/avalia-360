/**
 * Structured Logger Service
 * Logging estruturado com níveis, contexto e persistência no Firestore
 *
 * Níveis de log:
 * - DEBUG: Informações detalhadas de debug
 * - INFO: Eventos informativos
 * - WARN: Avisos e alertas
 * - ERROR: Erros recuperáveis
 * - CRITICAL: Erros críticos que impedem operação
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Conditional Firebase import para evitar erros em testes
function getFirestoreDb() {
  try {
    // Dynamic import inline (só carrega quando chamado)
    return require('@/lib/firebase').db;
  } catch {
    return null;
  }
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  evaluationId?: string;
  component?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userAgent?: string;
  url?: string;
}

class Logger {
  private minLevel: LogLevel;
  private persistToFirestore: boolean;
  private consoleEnabled: boolean;

  constructor() {
    // Configuração baseada no ambiente
    const isDev = import.meta.env.DEV;
    this.minLevel = isDev ? LogLevel.DEBUG : LogLevel.INFO;
    this.persistToFirestore = !isDev; // Só persiste em produção
    this.consoleEnabled = true;
  }

  /**
   * Configura o nível mínimo de log
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Habilita/desabilita persistência no Firestore
   */
  setPersistence(enabled: boolean): void {
    this.persistToFirestore = enabled;
  }

  /**
   * Habilita/desabilita logs no console
   */
  setConsole(enabled: boolean): void {
    this.consoleEnabled = enabled;
  }

  /**
   * Verifica se deve logar baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.CRITICAL,
    ];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Cria entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Formata log para console com cores
   */
  private formatConsoleLog(entry: LogEntry): void {
    if (!this.consoleEnabled) return;

    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: gray',
      [LogLevel.INFO]: 'color: blue',
      [LogLevel.WARN]: 'color: orange',
      [LogLevel.ERROR]: 'color: red',
      [LogLevel.CRITICAL]: 'color: red; font-weight: bold',
    };

    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    console.log(
      `%c${prefix}%c ${entry.message}`,
      colors[entry.level],
      'color: inherit'
    );

    if (entry.context) {
      console.log('Context:', entry.context);
    }

    if (entry.error) {
      console.error('Error:', entry.error);
      if (entry.error.stack) {
        console.error('Stack:', entry.error.stack);
      }
    }
  }

  /**
   * Persiste log no Firestore
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    if (!this.persistToFirestore) return;

    try {
      const db = getFirestoreDb();
      if (!db) return; // Firebase não disponível

      const logsRef = collection(db, 'logs');
      await addDoc(logsRef, {
        ...entry,
        timestamp: Timestamp.fromDate(entry.timestamp),
      });
    } catch (error) {
      // Falha silenciosa - não queremos crash por erro de logging
      console.error('Falha ao persistir log no Firestore:', error);
    }
  }

  /**
   * Método genérico de log
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);

    this.formatConsoleLog(entry);

    // Persistir de forma assíncrona (não bloqueia execução)
    if (this.persistToFirestore) {
      this.persistLog(entry).catch(() => {
        // Silencioso
      });
    }
  }

  /**
   * Log de debug (desenvolvimento)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log crítico (falhas graves)
   */
  critical(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * Log de métrica de negócio
   */
  metric(metricName: string, value: number, context?: LogContext): void {
    this.info(`Metric: ${metricName} = ${value}`, {
      ...context,
      metric: metricName,
      metricValue: value,
    });
  }

  /**
   * Log de duração de operação
   */
  duration(operation: string, durationMs: number, context?: LogContext): void {
    this.info(`Duration: ${operation} = ${durationMs}ms`, {
      ...context,
      operation,
      duration: durationMs,
    });
  }

  /**
   * Wrapper para medir duração de função
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.duration(operation, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(
        `${operation} failed after ${duration}ms`,
        error as Error,
        context
      );
      throw error;
    }
  }

  /**
   * Wrapper síncrono para medir duração
   */
  measure<T>(operation: string, fn: () => T, context?: LogContext): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.duration(operation, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(
        `${operation} failed after ${duration}ms`,
        error as Error,
        context
      );
      throw error;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Export conveniente para uso direto
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    logger.error(message, error, context),
  critical: (message: string, error?: Error, context?: LogContext) =>
    logger.critical(message, error, context),
  metric: (metricName: string, value: number, context?: LogContext) =>
    logger.metric(metricName, value, context),
  duration: (operation: string, durationMs: number, context?: LogContext) =>
    logger.duration(operation, durationMs, context),
};
