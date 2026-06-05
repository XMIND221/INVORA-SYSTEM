import { useEffect, useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail } from '@/supabase/auth';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/roles';

type AuthMode = 'sign-in' | 'sign-up';

interface AuthLocationState {
  from?: {
    pathname?: string;
  };
}

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'organisateur', label: 'Organisateur' },
  { value: 'participant', label: 'Participant' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'scanner', label: 'Scanner' },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Une erreur est survenue.';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [primaryRole, setPrimaryRole] = useState<UserRole>('participant');
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as AuthLocationState | null;
  const redirectTo = state?.from?.pathname ?? LOVABLE_ROUTES.accueil;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await signInWithEmail(email, password);
        if (signInError) throw signInError;
        await navigate(redirectTo, { replace: true });
        return;
      }

      const { error: signUpError } = await signUpWithEmail(email, password, {
        full_name: fullName || undefined,
        primary_role: primaryRole,
      });
      if (signUpError) throw signUpError;
      setMessage('Compte cree. Verifiez votre email si une confirmation est requise.');
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link to={LOVABLE_ROUTES.root} className="eyebrow text-muted-foreground">
          Retour
        </Link>

        <section className="mt-12 rounded-3xl border border-border bg-surface/80 p-6 shadow-xl">
          <p className="eyebrow text-muted-foreground">Compte Invora</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight">
            {mode === 'sign-in' ? 'Se connecter' : 'Creer un compte'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Accedez a votre espace organisateur, participant, partenaire ou scanner.
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-full border border-border bg-surface-2 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('sign-in');
              }}
              className={`rounded-full px-4 py-2 transition ${
                mode === 'sign-in' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('sign-up');
              }}
              className={`rounded-full px-4 py-2 transition ${
                mode === 'sign-up' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Inscription
            </button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === 'sign-up' ? (
              <label className="block text-sm">
                <span className="text-muted-foreground">Nom complet</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                  }}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-border-strong"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label className="block text-sm">
              <span className="text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-border-strong"
                autoComplete="email"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="text-muted-foreground">Mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-border-strong"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={8}
                required
              />
            </label>

            {mode === 'sign-up' ? (
              <label className="block text-sm">
                <span className="text-muted-foreground">Role principal</span>
                <select
                  value={primaryRole}
                  onChange={(event) => {
                    setPrimaryRole(event.target.value as UserRole);
                  }}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-border-strong"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Veuillez patienter...'
                : mode === 'sign-in'
                  ? 'Se connecter'
                  : 'Creer le compte'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
