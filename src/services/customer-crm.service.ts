import { supabase } from '@/supabase/client';
import type {
  CustomerContact,
  CustomerContactInput,
  CustomerContactStatus,
  CustomerContactUpdateInput,
  CustomerFilters,
  CustomerInteraction,
  CustomerInteractionInput,
  CustomerInteractionType,
} from '@/types/customer-crm';

interface DbError {
  message: string;
}

interface DbResult<T> {
  data: T | null;
  error: DbError | null;
}

interface DbQuery<T> extends PromiseLike<DbResult<T>> {
  select(columns?: string): DbQuery<T>;
  insert(values: unknown): DbQuery<T>;
  update(values: unknown): DbQuery<T>;
  delete(): DbQuery<T>;
  eq(column: string, value: unknown): DbQuery<T>;
  or(filter: string): DbQuery<T>;
  order(column: string, options?: { ascending?: boolean }): DbQuery<T>;
  single(): Promise<DbResult<T>>;
  maybeSingle(): Promise<DbResult<T>>;
}

interface CustomerContactRow {
  id: string;
  owner_id: string;
  event_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: CustomerContactStatus;
  source: string | null;
  tags: string[];
  notes: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerInteractionRow {
  id: string;
  customer_id: string;
  owner_id: string;
  type: CustomerInteractionType;
  title: string;
  body: string | null;
  occurred_at: string;
  created_at: string;
}

function fromTable<T>(tableName: string): DbQuery<T> {
  return supabase.from(tableName as never) as unknown as DbQuery<T>;
}

function throwDbError(error: DbError): never {
  throw new Error(error.message);
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeTags(tags: string[] | undefined) {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

function mapContact(row: CustomerContactRow): CustomerContact {
  return {
    id: row.id,
    ownerId: row.owner_id,
    eventId: row.event_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    status: row.status,
    source: row.source,
    tags: row.tags,
    notes: row.notes,
    lastContactAt: row.last_contact_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInteraction(row: CustomerInteractionRow): CustomerInteraction {
  return {
    id: row.id,
    customerId: row.customer_id,
    ownerId: row.owner_id,
    type: row.type,
    title: row.title,
    body: row.body,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

function assertContactInput(input: CustomerContactInput) {
  if (input.fullName.trim().length < 2) {
    throw new Error('Le nom du client est requis.');
  }
  if (!normalizeText(input.email) && !normalizeText(input.phone)) {
    throw new Error('Ajoutez au moins un email ou un téléphone.');
  }
}

function buildContactPayload(input: CustomerContactInput) {
  assertContactInput(input);

  return {
    owner_id: input.ownerId,
    event_id: input.eventId ?? null,
    full_name: input.fullName.trim(),
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    company: normalizeText(input.company),
    status: input.status ?? 'lead',
    source: normalizeText(input.source),
    tags: normalizeTags(input.tags),
    notes: normalizeText(input.notes),
    last_contact_at: input.lastContactAt ?? null,
  };
}

function buildContactUpdatePayload(input: CustomerContactUpdateInput) {
  const payload: Record<string, unknown> = {};

  if (input.fullName !== undefined) {
    if (input.fullName.trim().length < 2) throw new Error('Le nom du client est requis.');
    payload.full_name = input.fullName.trim();
  }
  if (input.eventId !== undefined) payload.event_id = input.eventId;
  if (input.email !== undefined) payload.email = normalizeText(input.email);
  if (input.phone !== undefined) payload.phone = normalizeText(input.phone);
  if (input.company !== undefined) payload.company = normalizeText(input.company);
  if (input.status !== undefined) payload.status = input.status;
  if (input.source !== undefined) payload.source = normalizeText(input.source);
  if (input.tags !== undefined) payload.tags = normalizeTags(input.tags);
  if (input.notes !== undefined) payload.notes = normalizeText(input.notes);
  if (input.lastContactAt !== undefined) payload.last_contact_at = input.lastContactAt;
  payload.updated_at = new Date().toISOString();

  return payload;
}

export async function listCustomers(filters: CustomerFilters): Promise<CustomerContact[]> {
  let query = fromTable<CustomerContactRow[]>('customer_contacts')
    .select('*')
    .eq('owner_id', filters.ownerId)
    .order('updated_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.eventId) {
    query = query.eq('event_id', filters.eventId);
  }
  if (filters.query?.trim()) {
    const escaped = filters.query.trim().replaceAll(',', ' ');
    query = query.or(
      `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%,company.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) throwDbError(error);
  return (data ?? []).map(mapContact);
}

export async function getCustomer(customerId: string): Promise<CustomerContact | null> {
  const { data, error } = await fromTable<CustomerContactRow>('customer_contacts')
    .select('*')
    .eq('id', customerId)
    .maybeSingle();

  if (error) throwDbError(error);
  return data ? mapContact(data) : null;
}

export async function createCustomer(input: CustomerContactInput): Promise<CustomerContact> {
  const { data, error } = await fromTable<CustomerContactRow>('customer_contacts')
    .insert(buildContactPayload(input))
    .select('*')
    .single();

  if (error) throwDbError(error);
  if (!data) throw new Error('customer_create_failed');
  return mapContact(data);
}

export async function updateCustomer(input: CustomerContactUpdateInput): Promise<CustomerContact> {
  const { data, error } = await fromTable<CustomerContactRow>('customer_contacts')
    .update(buildContactUpdatePayload(input))
    .eq('id', input.customerId)
    .select('*')
    .single();

  if (error) throwDbError(error);
  if (!data) throw new Error('customer_update_failed');
  return mapContact(data);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const { error } = await fromTable<null>('customer_contacts').delete().eq('id', customerId);
  if (error) throwDbError(error);
}

export async function listCustomerInteractions(customerId: string): Promise<CustomerInteraction[]> {
  const { data, error } = await fromTable<CustomerInteractionRow[]>('customer_interactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('occurred_at', { ascending: false });

  if (error) throwDbError(error);
  return (data ?? []).map(mapInteraction);
}

export async function createCustomerInteraction(
  input: CustomerInteractionInput,
): Promise<CustomerInteraction> {
  if (input.title.trim().length < 2) {
    throw new Error('Le titre de l’interaction est requis.');
  }

  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const { data, error } = await fromTable<CustomerInteractionRow>('customer_interactions')
    .insert({
      customer_id: input.customerId,
      owner_id: input.ownerId,
      type: input.type,
      title: input.title.trim(),
      body: normalizeText(input.body),
      occurred_at: occurredAt,
    })
    .select('*')
    .single();

  if (error) throwDbError(error);
  if (!data) throw new Error('customer_interaction_create_failed');

  await updateCustomer({ customerId: input.customerId, lastContactAt: occurredAt });
  return mapInteraction(data);
}

export async function deleteCustomerInteraction(interactionId: string): Promise<void> {
  const { error } = await fromTable<null>('customer_interactions')
    .delete()
    .eq('id', interactionId);
  if (error) throwDbError(error);
}

export const customerCrmService = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomerInteractions,
  createCustomerInteraction,
  deleteCustomerInteraction,
};
