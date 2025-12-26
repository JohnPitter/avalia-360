/**
 * Sistema de Debug Logger
 * Logs condicionais baseados em configuração do Firestore
 */

import { getDebugConfig } from './debugConfig';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  data?: unknown;
  timestamp?: number;
}

class DebugLogger {
  private enabled = false;
  private level: LogLevel = 'info';
  private initialized = false;

  /**
   * Inicializa o logger (busca config do Firestore)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const config = await getDebugConfig();
      this.enabled = config.enabled;
      this.level = config.level;
      this.initialized = true;

      if (this.enabled) {
        console.log(
          '%c🐛 Debug Logger Habilitado',
          'color: #10b981; font-weight: bold; font-size: 14px;',
          `Level: ${this.level}`
        );
      }
    } catch (error) {
      // Silenciosamente falha se não conseguir carregar config
      this.enabled = import.meta.env.DEV;
      this.initialized = true;
    }
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const logData = this.formatLog('INFO', message, context);
    console.log(
      `%c${logData.prefix}`,
      'color: #3b82f6; font-weight: bold;',
      logData.message,
      logData.context
    );
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const logData = this.formatLog('WARN', message, context);
    console.warn(
      `%c${logData.prefix}`,
      'color: #f59e0b; font-weight: bold;',
      logData.message,
      logData.context
    );
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const logData = this.formatLog('ERROR', message, context);
    console.error(
      `%c${logData.prefix}`,
      'color: #ef4444; font-weight: bold;',
      logData.message,
      error || '',
      logData.context
    );
  }

  /**
   * Log de debug (detalhado)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const logData = this.formatLog('DEBUG', message, context);
    console.debug(
      `%c${logData.prefix}`,
      'color: #8b5cf6; font-weight: bold;',
      logData.message,
      logData.context
    );
  }

  /**
   * Log de sucesso
   */
  success(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    const logData = this.formatLog('SUCCESS', message, context);
    console.log(
      `%c${logData.prefix}`,
      'color: #10b981; font-weight: bold;',
      logData.message,
      logData.context
    );
  }

  /**
   * Log de início de operação
   */
  start(operation: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const logData = this.formatLog('START', operation, context);
    console.log(
      `%c${logData.prefix}`,
      'color: #06b6d4; font-weight: bold;',
      logData.message,
      logData.context
    );
  }

  /**
   * Log de fim de operação
   */
  end(operation: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    const logData = this.formatLog('END', operation, context);
    console.log(
      `%c${logData.prefix}`,
      'color: #06b6d4; font-weight: bold;',
      logData.message,
      logData.context
    );
  }

  /**
   * Verifica se deve logar baseado no nível
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.level];
  }

  /**
   * Formata log para exibição
   */
  private formatLog(
    level: string,
    message: string,
    context?: LogContext
  ): { prefix: string; message: string; context: unknown } {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `${context.action}:` : '';

    return {
      prefix: `🐛 ${timestamp} ${level} ${component}`,
      message: `${action} ${message}`,
      context: context?.data || {},
    };
  }

  /**
   * Atualiza configuração em runtime
   */
  async reload(): Promise<void> {
    this.initialized = false;
    await this.init();
  }
}

// Singleton
export const debugLog = new DebugLogger();

// Auto-inicializa
debugLog.init();
