import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lovableRoutes } from '@/integration/lovable/routes';

const router = createBrowserRouter(lovableRoutes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
