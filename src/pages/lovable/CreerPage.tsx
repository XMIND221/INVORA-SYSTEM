import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Calendar, MapPin, Tag, ArrowRight } from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { EventCard } from '@/components/lovable/EventCard';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { FlowStrip } from '@/components/lovable/FlowStrip';
import { UNIVERSE_COPY } from '@/integration/lovable/product-copy';
import type { EventUniverse } from '@/types/event';

export default function CreerPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('Obsidian Gala');
  const [date, setDate] = useState('24 DÉC');
  const [location, setLocation] = useState('Paris, FR');
  const [universe, setUniverse] = useState<EventUniverse>('inviter');

  const copy = UNIVERSE_COPY[universe];

  return (
    <div className="pb-4">
      <RoleContextBar location="Créer une expérience" />
      <div className="px-6">
        <PageHeader
          eyebrow="Étape 1 · L’essentiel"
          title={
            <>
              Donnez vie à
              <br />
              <span className="font-serif italic">votre expérience.</span>
            </>
          }
          description="INVORA génère accès, billets, QR et visuels ensuite."
        />

        <button
          type="button"
          className="w-full aspect-[16/9] mb-5 rounded-2xl border border-dashed border-border-strong bg-surface flex flex-col items-center justify-center gap-2"
        >
          <Camera className="size-5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs text-muted-foreground">Photo de couverture</span>
        </button>

        <div className="space-y-2 mb-6">
          <Field icon={<Tag className="size-4" />} label="Nom de l’expérience">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent text-base font-medium outline-none"
            />
          </Field>
          <Field icon={<Calendar className="size-4" />} label="Date">
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-base font-medium outline-none"
            />
          </Field>
          <Field icon={<MapPin className="size-4" />} label="Lieu">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent text-base font-medium outline-none"
            />
          </Field>
        </div>

        <div className="mb-4">
          <p className="eyebrow mb-2">Quel type d’expérience ?</p>
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface border border-border rounded-xl">
            {(['inviter', 'vendre'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUniverse(u)}
                className={`py-3 px-2 rounded-lg transition text-left ${
                  universe === u ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="text-xs uppercase tracking-[0.15em] block">{UNIVERSE_COPY[u].title}</span>
                <span className={`text-[10px] mt-1 block ${universe === u ? 'opacity-80' : 'opacity-70'}`}>
                  {UNIVERSE_COPY[u].badge}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{copy.subtitle}</p>
        </div>

        <FlowStrip universe={universe} currentStep={0} />

        <p className="eyebrow mt-6 mb-3">Aperçu</p>
        <EventCard title={name} date={date} location={location} tag={copy.badge} />

        <button
          type="button"
          onClick={() => navigate(`${LOVABLE_ROUTES.parcours}?univers=${universe}`)}
          className="mt-6 w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
        >
          Continuer le parcours {copy.title}
          <ArrowRight className="size-4" />
        </button>

        <Link
          to={LOVABLE_ROUTES.accueil}
          className="block text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-4"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
        {children}
      </div>
    </label>
  );
}
