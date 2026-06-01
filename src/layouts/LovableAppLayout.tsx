import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/lovable/BottomNav';
import { RoleRouteGuard } from '@/components/lovable/RoleRouteGuard';

export function LovableAppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md min-h-screen pb-32">
        <RoleRouteGuard>
          <Outlet />
        </RoleRouteGuard>
      </div>
      <BottomNav />
    </div>
  );
}
