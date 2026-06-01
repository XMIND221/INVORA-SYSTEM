import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

/**
 * Application shell — no design, no marketing UI.
 * Lovable ZIP provides all visual experience.
 */
export default function App() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  );
}
