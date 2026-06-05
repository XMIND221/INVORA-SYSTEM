import { useMemo, useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { EmptyState, LoadingPage, NetworkErrorState, PermissionDeniedState } from '@/components/lovable/ui-states';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomerCrm';
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';
import {
  CUSTOMER_CONTACT_STATUSES,
  type CustomerContact,
  type CustomerContactStatus,
} from '@/types/customer-crm';

const statusLabels: Record<CustomerContactStatus, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  customer: 'Client',
  vip: 'VIP',
  archived: 'Archive',
};

function splitTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function CustomerCard({ customer }: { customer: CustomerContact }) {
  return (
    <Link
      to={`/crm/${customer.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium truncate">{customer.fullName}</p>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {customer.email ?? customer.phone ?? 'Contact incomplet'}
          </p>
          {customer.company ? (
            <p className="mt-1 text-xs text-muted-foreground truncate">{customer.company}</p>
          ) : null}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {statusLabels[customer.status]}
        </span>
        {customer.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-surface-2 px-2 py-1 text-[10px] text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function CustomerCrmPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CustomerContactStatus | 'all'>('all');
  const [eventId, setEventId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const customerOptions = useMemo(
    () => ({
      query,
      status,
      eventId: eventId || null,
    }),
    [eventId, query, status],
  );
  const { customers, isLoading, isError, error, refetch, isAuthenticated, user } =
    useCustomers(customerOptions);
  const { events } = useOrganizerEvents();
  const createCustomer = useCreateCustomer();

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setSource('');
    setTagsText('');
    setNotes('');
    setFormError(null);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!user?.id) {
      setFormError('Connexion requise.');
      return;
    }

    try {
      await createCustomer.mutateAsync({
        ownerId: user.id,
        eventId: eventId || null,
        fullName,
        email,
        phone,
        company,
        source,
        tags: splitTags(tagsText),
        notes,
        status: 'lead',
      });
      resetForm();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Creation impossible.');
    }
  };

  if (isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Customer CRM" />
        <LoadingPage />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Customer CRM" />
        <PermissionDeniedState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Customer CRM" />
        <NetworkErrorState message={error?.message ?? 'Erreur CRM'} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Customer CRM" />
      <div className="px-6">
        <PageHeader
          eyebrow="CRM"
          title={
            <>
              Clients
              <br />
              <span className="font-serif italic">et prospects.</span>
            </>
          }
          description="Base client connectee a Supabase: contacts, statut, source, tags et historique."
        />

        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-border bg-surface p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Plus className="size-4" />
            Nouveau client
          </div>
          <div className="space-y-3">
            <input
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              placeholder="Nom complet"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                placeholder="Email"
                type="email"
              />
              <input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                placeholder="Telephone"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={company}
                onChange={(event) => {
                  setCompany(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                placeholder="Entreprise"
              />
              <input
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                placeholder="Source"
              />
            </div>
            <select
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            >
              <option value="">Aucune experience liee</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <input
              value={tagsText}
              onChange={(event) => {
                setTagsText(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              placeholder="Tags separes par virgule"
            />
            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              placeholder="Notes internes"
              rows={3}
            />
          </div>
          {formError ? <p className="mt-3 text-sm text-destructive">{formError}</p> : null}
          <button
            type="submit"
            disabled={createCustomer.isPending}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {createCustomer.isPending ? 'Creation...' : 'Ajouter au CRM'}
          </button>
        </form>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
              placeholder="Rechercher nom, email, telephone, entreprise"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as CustomerContactStatus | 'all');
            }}
            className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none"
          >
            <option value="all">Tous les statuts</option>
            {CUSTOMER_CONTACT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            title="Aucun client"
            description="Ajoutez votre premier contact pour commencer le suivi commercial."
          />
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
