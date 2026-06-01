import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { PageHeader } from '@/components/lovable/PageHeader';
import { PARTNER_FAQ } from '@/integration/lovable/product-copy';
import { useRole } from '@/integration/lovable/use-role';

export default function PartenairesPage() {
  const role = useRole();
  const isPartner = role === 'partenaire';

  return (
    <div className="pb-4">
      <RoleContextBar location={isPartner ? 'Promouvoir' : 'Partenaires'} />
      <div className="px-6">
        <PageHeader
          eyebrow={isPartner ? 'Partenaire' : 'Organisateur'}
          title={
            isPartner ? (
              <>
                Promouvoir,
                <br />
                <span className="font-serif italic">gagner.</span>
              </>
            ) : (
              <>
                Vos
                <br />
                <span className="font-serif italic">partenaires.</span>
              </>
            )
          }
          description={
            isPartner
              ? 'Tout ce dont vous avez besoin pour distribuer — en quatre questions.'
              : 'Invitez des partenaires à diffuser vos expériences INVITER et VENDRE.'
          }
        />

        {isPartner ? (
          <ul className="space-y-3">
            {PARTNER_FAQ.map((item) => (
              <li key={item.q} className="p-4 bg-surface border border-border rounded-xl">
                <p className="text-sm font-medium">{item.q}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.a}</p>
              </li>
            ))}
            <button
              type="button"
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium mt-4"
            >
              Retirer mes gains
            </button>
          </ul>
        ) : (
          <div className="p-5 bg-surface border border-border rounded-2xl text-sm text-muted-foreground leading-relaxed">
            <p className="mb-3">
              Les partenaires reçoivent automatiquement affiches, stories, visuels, liens et QR
              dédiés.
            </p>
            <p>Les commissions sont calculées côté serveur — jamais dans l’application.</p>
          </div>
        )}
      </div>
    </div>
  );
}
