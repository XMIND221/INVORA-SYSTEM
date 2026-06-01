import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { lovableEventInviter, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { inviterService } from '@/services/inviter.service';
import type { DistributionChannel } from '@/types/inviter';

export default function InviterDistributePage() {
  const { eventId, event } = useOrganizerEventParam();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [whatsapp, setWhatsapp] = useState(true);
  const [email, setEmail] = useState(true);
  const [sent, setSent] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    if (eventId) inviterService.initEvent(eventId);
  }, [eventId]);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'inviter') return <Navigate to={lovableEventInviter(eventId)} replace />;

  const guests = inviterService.listGuests(eventId).filter((g) => g.status === 'created' || g.status === 'distributed');

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(guests.map((g) => g.id)));
  };

  const channels: DistributionChannel[] = [
    ...(whatsapp ? (['whatsapp'] as const) : []),
    ...(email ? (['email'] as const) : []),
  ];

  const handleDistribute = () => {
    if (selected.size === 0 || channels.length === 0) return;
    inviterService.distribute(eventId, [...selected], channels);
    setSent(true);
    tick((n) => n + 1);
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Distribution" />
      <div className="px-6">
        <Link
          to={lovableEventInviter(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          INVITER
        </Link>

        <PageHeader
          eyebrow="Distribuer"
          title={
            <>
              Envoyer
              <br />
              <span className="font-serif italic">les accès.</span>
            </>
          }
          description="Individuel ou multiple · WhatsApp, Email, ou les deux."
        />

        <div className="grid grid-cols-2 gap-2 mb-4">
          <ChannelToggle
            active={whatsapp}
            onClick={() => setWhatsapp((v) => !v)}
            icon={<MessageCircle className="size-4" />}
            label="WhatsApp"
          />
          <ChannelToggle
            active={email}
            onClick={() => setEmail((v) => !v)}
            icon={<Mail className="size-4" />}
            label="Email"
          />
        </div>

        <button
          type="button"
          onClick={selectAll}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3"
        >
          Tout sélectionner ({guests.length})
        </button>

        <ul className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {guests.map((g) => (
            <li key={g.id}>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(g.id)}
                  onChange={() => toggle(g.id)}
                  className="rounded border-border"
                />
                <span className="text-sm flex-1">
                  {g.firstName} {g.lastName}
                </span>
                <span className="font-mono text-[9px] text-muted-foreground">{g.uniqueCode}</span>
              </label>
            </li>
          ))}
        </ul>

        {sent && (
          <p className="text-xs text-[color:var(--color-success)] mb-4 p-3 border border-border rounded-lg">
            Distribution enregistrée — liens sécurisés et QR uniques générés pour chaque invité.
          </p>
        )}

        {selected.size > 0 && channels.length > 0 && (
          <div className="p-4 mb-4 rounded-xl bg-surface-2 border border-border text-xs text-muted-foreground">
            <p className="eyebrow mb-2">Aperçu message</p>
            {(() => {
              const g = guests.find((x) => selected.has(x.id));
              if (!g) return null;
              const share = inviterService.buildSharePayload(g, event.title);
              return <p className="whitespace-pre-wrap font-mono text-[10px]">{share.whatsapp}</p>;
            })()}
          </div>
        )}

        <button
          type="button"
          disabled={selected.size === 0 || channels.length === 0}
          onClick={handleDistribute}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium disabled:opacity-40"
        >
          Distribuer {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </div>
  );
}

function ChannelToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-muted-foreground'
      }`}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}
