import '@/styles/lovable.css';
import { createRoot } from 'react-dom/client';

function renderBootstrapError(message: string, detail?: string) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0a0a0a;color:#fafafa;font-family:Inter,system-ui,sans-serif;">
      <div style="max-width:420px;text-align:center;">
        <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;opacity:0.5;margin:0 0 12px;">INVORA</p>
        <h1 style="font-size:1.25rem;font-weight:500;margin:0 0 8px;">Impossible de démarrer l'application</h1>
        <p style="font-size:0.875rem;opacity:0.7;margin:0 0 16px;">${message}</p>
        ${detail ? `<pre style="text-align:left;font-size:11px;opacity:0.6;overflow:auto;padding:12px;border:1px solid #333;border-radius:8px;white-space:pre-wrap;">${detail}</pre>` : ''}
        <p style="font-size:0.75rem;opacity:0.5;margin-top:16px;">Vérifiez le fichier <code>.env</code> puis relancez <code>npm run dev</code>.</p>
      </div>
    </div>
  `;
}

async function bootstrap() {
  const root = document.getElementById('root');
  if (!root) {
    throw new Error('Root element #root not found');
  }

  try {
    const { AppShell } = await import('./app-shell');
    createRoot(root).render(<AppShell />);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[INVORA bootstrap]', err);
    renderBootstrapError(
      'Erreur au chargement (souvent variables VITE_* manquantes ou invalides).',
      err.message,
    );
  }
}

void bootstrap();
