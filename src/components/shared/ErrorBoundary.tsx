import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/services/observability/logger';

/**
 * Error Boundary Component
 * Captura erros em componentes React e exibe UI de fallback
 *
 * Características:
 * - Captura erros de renderização
 * - Loga erros com stack trace
 * - UI de fallback amigável
 * - Botão de reset/retry
 * - Previne crash total da aplicação
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Atualiza estado para exibir fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Loga erro com stack trace completo
    logger.critical('React Error Boundary caught error', error, {
      component: errorInfo.componentStack || undefined,
      errorBoundary: 'ErrorBoundary',
    });

    // Callback customizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Atualiza estado com errorInfo
    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset automático se resetKeys mudaram
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !this.areResetKeysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.handleReset();
    }
  }

  private areResetKeysEqual(
    prevKeys: Array<string | number>,
    currentKeys: Array<string | number>
  ): boolean {
    if (prevKeys.length !== currentKeys.length) return false;
    return prevKeys.every((key, index) => key === currentKeys[index]);
  }

  handleReset = (): void => {
    logger.info('Error Boundary reset triggered', {
      component: 'ErrorBoundary',
      action: 'reset',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border-2 border-red-200 p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Ops! Algo deu errado
            </h1>

            {/* Message */}
            <p className="text-center text-gray-700 mb-6">
              Encontramos um erro inesperado. Não se preocupe, seus dados estão seguros.
            </p>

            {/* Error Details (Dev mode) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <h3 className="font-bold text-red-900 mb-2">Detalhes do Erro (Dev):</h3>
                <p className="text-sm text-red-800 font-mono mb-2">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs text-red-700">
                    <summary className="cursor-pointer font-semibold mb-1">
                      Stack Trace
                    </summary>
                    <pre className="whitespace-pre-wrap bg-red-100 p-2 rounded overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Tentar Novamente
                </span>
              </button>

              <button
                onClick={() => {
                  logger.info('User navigated to home from error boundary');
                  window.location.href = '/';
                }}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Voltar ao Início
                </span>
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-900 text-center">
                💡 <strong>Dica:</strong> Se o problema persistir, tente limpar o cache do navegador
                ou entre em contato com o suporte.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper para facilitar uso com função componente
 */
interface WithErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WithErrorBoundary({ children, fallback }: WithErrorBoundaryProps): JSX.Element {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
