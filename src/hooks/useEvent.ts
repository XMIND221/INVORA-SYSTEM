import { useQuery } from '@tanstack/react-query';
import { eventsService } from '@/services';
import { useEventStore } from '@/store/event.store';

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => (eventId ? eventsService.getEventById(eventId) : null),
    enabled: !!eventId,
  });
}

export function useEventDraft() {
  const draft = useEventStore((s) => s.draft);
  const patchDraft = useEventStore((s) => s.patchDraft);
  const clearDraft = useEventStore((s) => s.clearDraft);
  const activeEvent = useEventStore((s) => s.activeEvent);
  const setActiveEvent = useEventStore((s) => s.setActiveEvent);

  return { draft, patchDraft, clearDraft, activeEvent, setActiveEvent };
}
