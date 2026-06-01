import { Link } from 'react-router-dom';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { PageHeader } from '@/components/lovable/PageHeader';
import { ROLE_INTENT } from '@/integration/lovable/product-copy';
import { useRole } from '@/integration/lovable/use-role';

export default function ParametresPage() {
  const role = useRole();
  const intent = ROLE_INTENT[role];

  return (
    <div className="pb-4">
      <RoleContextBar location="Paramètres" />
      <div className="px-6">
        <PageHeader
          eyebrow="Profil"
          title={
            <>
              Votre
              <br />
              <span className="font-serif italic">espace.</span>
            </>
          }
        />

        <section className="p-4 mb-4 bg-surface border border-border rounded-2xl">
          <p className="eyebrow mb-2">Rôle actif</p>
          <p className="text-lg font-medium">{intent.label}</p>
          <p className="text-xs text-muted-foreground mt-2">{intent.youAre}</p>
          <p className="text-xs text-muted-foreground mt-1">{intent.youGet}</p>
        </section>

        <section className="p-4 mb-4 bg-surface border border-border rounded-2xl space-y-2">
          <p className="eyebrow">Compte</p>
          <p className="text-sm text-muted-foreground">Connexion Supabase — phase métier à venir</p>
        </section>

        <Link
          to={LOVABLE_ROUTES.root}
          className="block w-full py-3 text-center border border-border rounded-xl text-sm hover:bg-surface transition"
        >
          Changer d’espace (rôle)
        </Link>

        <p className="text-[10px] text-muted-foreground text-center mt-6 uppercase tracking-[0.2em]">
          INVORA · Phase 1 UX
        </p>
      </div>
    </div>
  );
}
