import { supabase } from '@/supabase/client';
import { identityToCssVars } from '@/features/engines/design.engine';
import { runDesignDiversityChecks } from '@/features/engines/design-diversity.verify';
import { useDesignStore } from '@/store/design.store';
import type {
  DesignDiversityReport,
  DesignEventInput,
  DesignPackage,
  DesignToneAxis,
} from '@/types/design';

export async function persistEventDesignIdentity(
  eventId: string,
  pkg: DesignPackage,
): Promise<void> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('upsert_event_design_identity', {
    p_event_id: eventId,
    p_fingerprint: pkg.identity.fingerprint,
    p_payload: pkg,
  });
  if (error) {
    /* fixture offline */
  }
}

export const designService = {
  generate: (input: DesignEventInput): DesignPackage => {
    const pkg = useDesignStore.getState().generate(input);
    void persistEventDesignIdentity(input.eventId, pkg);
    return pkg;
  },
  getPackage: (eventId: string) => useDesignStore.getState().getPackage(eventId),
  adjustTone: (eventId: string, axis: DesignToneAxis, delta: number) =>
    useDesignStore.getState().adjustTone(eventId, axis, delta),
  cssVars: (eventId: string) => {
    const pkg = useDesignStore.getState().getPackage(eventId);
    return pkg ? identityToCssVars(pkg.identity) : {};
  },
  diversityReport: (): DesignDiversityReport => runDesignDiversityChecks(),
};

export function buildDesignInputFromEvent(event: {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  location: string;
  universe: DesignEventInput['universe'];
  coverUrl?: string;
}): DesignEventInput {
  return {
    eventId: event.id,
    title: event.title,
    description: event.description,
    coverImageUrl: event.coverUrl,
    dateLabel: event.dateLabel,
    location: event.location,
    category: event.universe === 'inviter' ? 'gala' : 'festival',
    universe: event.universe,
  };
}
