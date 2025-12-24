/**
 * Global Error Handlers
 * Captura erros não tratados em todo o aplicativo
 *
 * Tipos de erros capturados:
 * - Erros JavaScript não capturados (window.onerror)
 * - Promise rejections não tratadas (unhandledrejection)
 * - Erros de recursos (images, scripts) que falharam ao carregar
 */

import { logger } from './logger';

/**
 * Handler para erros JavaScript não capturados
 */
function handleUncaughtError(
  event: ErrorEvent | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): void {
  // Se recebeu ErrorEvent
  if (typeof event === 'object' && 'error' in event) {
    logger.critical('Uncaught JavaScript error', event.error, {
      component: 'ErrorHandler',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    return;
  }

  // Se recebeu parâmetros separados
  logger.critical('Uncaught JavaScript error', error, {
    component: 'ErrorHandler',
    message: typeof event === 'string' ? event : 'Unknown error',
    filename: source,
    lineno,
    colno,
  });
}

/**
 * Handler para Promise rejections não tratadas
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;

  // Se reason é um Error
  if (reason instanceof Error) {
    logger.critical('Unhandled Promise rejection', reason, {
      component: 'ErrorHandler',
      type: 'unhandledRejection',
    });
  } else {
    // Se reason é outro tipo
    logger.critical('Unhandled Promise rejection', undefined, {
      component: 'ErrorHandler',
      type: 'unhandledRejection',
      reason: String(reason),
    });
  }

  // Prevenir mensagem de erro padrão do browser (opcional)
  // event.preventDefault();
}

/**
 * Handler para erros de recursos (images, scripts, etc)
 */
function handleResourceError(event: Event): void {
  const target = event.target as HTMLElement;

  if (!target) return;

  // Determinar tipo de recurso
  const resourceType = target.tagName?.toLowerCase() || 'unknown';

  let resourceUrl = 'unknown';
  if ('src' in target && typeof target.src === 'string') {
    resourceUrl = target.src;
  } else if ('href' in target && typeof target.href === 'string') {
    resourceUrl = target.href;
  }

  logger.error('Resource failed to load', undefined, {
    component: 'ErrorHandler',
    type: 'resourceError',
    resourceType,
    resourceUrl,
  });
}

/**
 * Inicializa todos os global error handlers
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') {
    logger.warn('Global error handlers not initialized (not in browser)', {
      component: 'ErrorHandler',
    });
    return;
  }

  // JavaScript errors
  window.addEventListener('error', (event) => {
    // Distinguir entre erro de JS e erro de recurso
    if (event.target !== window) {
      handleResourceError(event);
    } else {
      handleUncaughtError(event);
    }
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Console errors (capturar console.error)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Log estruturado
    logger.error('Console error', undefined, {
      component: 'Console',
      args: args.map((arg) => String(arg)),
    });

    // Chamar console.error original
    originalConsoleError.apply(console, args);
  };

  logger.info('Global error handlers initialized', {
    component: 'ErrorHandler',
    handlers: ['error', 'unhandledrejection', 'console.error'],
  });
}

/**
 * Remove global error handlers (útil para testes)
 */
export function removeGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.removeEventListener('error', handleUncaughtError as any);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  logger.info('Global error handlers removed', {
    component: 'ErrorHandler',
  });
}

/**
 * Report manual de erro (para uso em catch blocks)
 */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  logger.error('Manual error report', error, {
    component: 'ErrorReporter',
    ...context,
  });
}

/**
 * Report de erro com severidade customizada
 */
export function reportCriticalError(error: Error, context?: Record<string, unknown>): void {
  logger.critical('Critical error reported', error, {
    component: 'ErrorReporter',
    ...context,
  });
}
