import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  lovableEventHub,
  lovableEventInviter,
  lovableInvitePublic,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { InviterStatusBadge } from '@/components/lovable/InviterStatusBadge';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { inviterService } from '@/services/inviter.service';

export default function InviterGuestsPage() {
  const { eventId, event } = useOrganizerEventParam();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [accessTypeCode, setAccessTypeCode] = useState('standard');
  const [, tick] = useState(0);

  useEffect(() => {
    if (eventId) inviterService.initEvent(eventId);
  }, [eventId]);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'inviter') {
    return <Navigate to={lovableEventHub(eventId)} replace />;
  }

  const guests = inviterService.listGuests(eventId);
  const accessTypes = inviterService.listAccessTypes(eventId);

  const handleAdd = () => {
    const result = inviterService.addGuest(eventId, {
      firstName,
      lastName,
      phone,
      email: email || undefined,
      accessTypeCode,
    });
    if (!result.errors) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      tick((n) => n + 1);
    }
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Invités" />
      <div className="px-6">
        <Link
          to={lovableEventInviter(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          INVITER
        </Link>

        <PageHeader
          eyebrow="Gestion des invités"
          title={
            <>
              Vos
              <br />
              <span className="font-serif italic">invités.</span>
            </>
          }
          description="Nom, prénom, téléphone, email optionnel, type d’accès, statut."
        />

        <div className="p-4 mb-6 rounded-xl bg-surface border border-border space-y-2">
          <p className="eyebrow mb-2">Ajouter un invité</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="p-3 bg-background border border-border rounded-lg text-sm outline-none"
            />
            <input
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="p-3 bg-background border border-border rounded-lg text-sm outline-none"
            />
          </div>
          <input
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-sm outline-none"
          />
          <input
            placeholder="Email (optionnel)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-sm outline-none"
          />
          <select
            value={accessTypeCode}
            onChange={(e) => setAccessTypeCode(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-sm outline-none"
          >
            {accessTypes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus className="size-4" />
            Créer l’accès
          </button>
        </div>

        <ul className="space-y-3">
          {guests.map((g) => {
            const typeLabel = accessTypes.find((t) => t.code === g.accessTypeCode)?.label ?? g.accessTypeCode;
            return (
              <li key={g.id} className="p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {g.firstName} {g.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">{g.phone}</p>
                    {g.email && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{g.email}</p>
                    )}
                  </div>
                  <InviterStatusBadge status={g.status} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-border rounded-full">
                    {typeLabel}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">{g.uniqueCode}</span>
                </div>
                <Link
                  to={lovableInvitePublic(g.token)}
                  className="inline-block mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                >
                  Voir le lien invité →
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
