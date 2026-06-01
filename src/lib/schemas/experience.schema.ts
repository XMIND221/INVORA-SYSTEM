import { z } from 'zod';
import { EVENT_UNIVERSES, EVENT_VISIBILITY } from '@/lib/constants';

export const experienceDraftSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  universe: z.enum(EVENT_UNIVERSES),
  visibility: z.enum(EVENT_VISIBILITY),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: z.string().max(500).optional(),
});

export type ExperienceDraftInput = z.infer<typeof experienceDraftSchema>;
