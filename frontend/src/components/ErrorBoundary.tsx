import React from 'react';
import { clearStaleClientState } from '../core/clearStaleState';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

// Si el mismo error vuelve a aparecer tras este número de "Reintentar",
// asumimos que es un problema persistente de estado local (cache/cookies
// viejas) y no algo que un simple re-render vaya a resolver.
const RETRIES_BEFORE_SUGGESTING_RESET = 1;

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error);
    console.error('Error Info:', errorInfo);

    this.setState(prevState => ({
      ...prevState,
      errorInfo,
    }));
  }

  handleReset = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleClearAndReload = () => {
    clearStaleClientState();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const showClearOption = this.state.retryCount >= RETRIES_BEFORE_SUGGESTING_RESET;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Algo salió mal
              </h2>

              <p className="text-slate-600 mb-4">
                Lo sentimos, ocurrió un error inesperado en la aplicación.
              </p>

              {showClearOption && (
                <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4 text-left">
                  <p className="text-sm text-amber-800">
                    El error sigue apareciendo. Esto suele deberse a datos antiguos
                    guardados en este navegador. Usa <strong>“Limpiar datos y recargar”</strong>{' '}
                    para solucionarlo.
                  </p>
                </div>
              )}

              {import.meta.env.MODE === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 mb-4 text-left">
                  <p className="text-sm font-mono text-red-800 break-words">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2 text-xs text-red-700">
                      <summary className="cursor-pointer font-semibold mb-2">
                        Detalles del componente
                      </summary>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium py-2 px-4 rounded transition"
                >
                  Ir al inicio
                </button>
              </div>

              <button
                onClick={this.handleClearAndReload}
                className={
                  showClearOption
                    ? 'mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition'
                    : 'mt-3 w-full text-sm text-slate-500 hover:text-slate-700 underline'
                }
              >
                Limpiar datos y recargar
              </button>

              <p className="text-xs text-slate-500 mt-4">
                Si el problema persiste, contacta con soporte técnico.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
