import { StrictMode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider, QueryProvider } from '@/contexts';
import { AppRouter } from '@/router';

export function AppShell() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <QueryProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </QueryProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
