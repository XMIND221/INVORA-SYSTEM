import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { EventUniverse } from '@/types/event';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { UNIVERSE_COPY } from '@/integration/lovable/product-copy';
import { FlowStrip } from './FlowStrip';

interface UniverseCardProps {
  universe: EventUniverse;
  currentStep?: number;
}

export function UniverseCard({ universe, currentStep = 0 }: UniverseCardProps) {
  const copy = UNIVERSE_COPY[universe];

  return (
    <Link
      to={`${LOVABLE_ROUTES.parcours}?univers=${universe}`}
      className="block p-4 mb-3 rounded-2xl bg-surface border border-border hover:border-border-strong transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-serif italic text-xl">{copy.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{copy.nature}</p>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground shrink-0 mt-1" />
      </div>
      <FlowStrip universe={universe} currentStep={currentStep} compact />
    </Link>
  );
}
