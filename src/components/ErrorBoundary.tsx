import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Technical error boundary — no visual design.
 * Lovable UI will replace fallback when integrated.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[INVORA ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            data-invora="error-boundary"
            className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground"
          >
            <div className="max-w-md text-center">
              <p className="eyebrow mb-3">Erreur</p>
              <p className="text-sm text-muted-foreground">
                Une erreur est survenue. Rechargez l&apos;application.
              </p>
              {this.state.error?.message ? (
                <pre className="mt-4 text-left text-xs text-muted-foreground border border-border rounded-lg p-3 overflow-auto">
                  {this.state.error.message}
                </pre>
              ) : null}
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
