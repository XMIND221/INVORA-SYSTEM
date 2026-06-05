export const CUSTOMER_CONTACT_STATUSES = ['lead', 'prospect', 'customer', 'vip', 'archived'] as const;
export type CustomerContactStatus = (typeof CUSTOMER_CONTACT_STATUSES)[number];

export const CUSTOMER_INTERACTION_TYPES = ['note', 'call', 'email', 'meeting', 'whatsapp'] as const;
export type CustomerInteractionType = (typeof CUSTOMER_INTERACTION_TYPES)[number];

export interface CustomerContact {
  id: string;
  ownerId: string;
  eventId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: CustomerContactStatus;
  source: string | null;
  tags: string[];
  notes: string | null;
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  ownerId: string;
  type: CustomerInteractionType;
  title: string;
  body: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface CustomerContactInput {
  fullName: string;
  ownerId: string;
  eventId?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status?: CustomerContactStatus;
  source?: string | null;
  tags?: string[];
  notes?: string | null;
  lastContactAt?: string | null;
}

export interface CustomerContactUpdateInput {
  customerId: string;
  fullName?: string;
  eventId?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status?: CustomerContactStatus;
  source?: string | null;
  tags?: string[];
  notes?: string | null;
  lastContactAt?: string | null;
}

export interface CustomerInteractionInput {
  customerId: string;
  ownerId: string;
  type: CustomerInteractionType;
  title: string;
  body?: string | null;
  occurredAt?: string;
}

export interface CustomerFilters {
  ownerId: string;
  query?: string;
  status?: CustomerContactStatus | 'all';
  eventId?: string | null;
}
