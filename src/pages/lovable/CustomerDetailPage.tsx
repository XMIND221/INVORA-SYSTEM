import { useEffect, useState, type SyntheticEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { LoadingPage, NetworkErrorState, NotFoundState } from '@/components/lovable/ui-states';
import {
  useCreateCustomerInteraction,
  useCustomer,
  useCustomerInteractions,
  useDeleteCustomer,
  useDeleteCustomerInteraction,
  useUpdateCustomer,
} from '@/hooks/useCustomerCrm';
import { useAuth } from '@/hooks/useAuth';
import {
  CUSTOMER_CONTACT_STATUSES,
  CUSTOMER_INTERACTION_TYPES,
  type CustomerContactStatus,
  type CustomerInteractionType,
} from '@/types/customer-crm';

const statusLabels: Record<CustomerContactStatus, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  customer: 'Client',
  vip: 'VIP',
  archived: 'Archive',
};

const interactionLabels: Record<CustomerInteractionType, string> = {
  note: 'Note',
  call: 'Appel',
  email: 'Email',
  meeting: 'Rendez-vous',
  whatsapp: 'WhatsApp',
};

function splitTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerQuery = useCustomer(customerId);
  const interactionsQuery = useCustomerInteractions(customerId);
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const createInteraction = useCreateCustomerInteraction();
  const deleteInteraction = useDeleteCustomerInteraction(customerId);

  const customer = customerQuery.data;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<CustomerContactStatus>('lead');
  const [source, setSource] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [interactionType, setInteractionType] = useState<CustomerInteractionType>('note');
  const [interactionTitle, setInteractionTitle] = useState('');
  const [interactionBody, setInteractionBody] = useState('');
  const [interactionError, setInteractionError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    setFullName(customer.fullName);
    setEmail(customer.email ?? '');
    setPhone(customer.phone ?? '');
    setCompany(customer.company ?? '');
    setStatus(customer.status);
    setSource(customer.source ?? '');
    setTagsText(customer.tags.join(', '));
    setNotes(customer.notes ?? '');
  }, [customer]);

  if (!customerId) {
    return <Navigate to="/crm" replace />;
  }

  if (customerQuery.isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Customer CRM" />
        <LoadingPage />
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Customer CRM" />
        <NetworkErrorState message={customerQuery.error.message} />
      </div>
    );
  }

  if (!customer) {
    return <NotFoundState backTo="/crm" backLabel="CRM" />;
  }

  const handleSave = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await updateCustomer.mutateAsync({
        customerId: customer.id,
        fullName,
        email,
        phone,
        company,
        status,
        source,
        tags: splitTags(tagsText),
        notes,
      });
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : 'Mise a jour impossible.');
    }
  };

  const handleDelete = async () => {
    await deleteCustomer.mutateAsync(customer.id);
    await navigate('/crm', { replace: true });
  };

  const handleInteraction = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInteractionError(null);

    if (!user?.id) {
      setInteractionError('Connexion requise.');
      return;
    }

    try {
      await createInteraction.mutateAsync({
        customerId: customer.id,
        ownerId: user.id,
        type: interactionType,
        title: interactionTitle,
        body: interactionBody,
      });
      setInteractionType('note');
      setInteractionTitle('');
      setInteractionBody('');
    } catch (submitError) {
      setInteractionError(
        submitError instanceof Error ? submitError.message : 'Interaction impossible.',
      );
    }
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Customer CRM" />
      <div className="px-6">
        <Link
          to="/crm"
          className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Clients
        </Link>

        <PageHeader
          eyebrow={statusLabels[customer.status]}
          title={
            <>
              {customer.fullName.split(' ')[0]}
              <br />
              <span className="font-serif italic">
                {customer.fullName.split(' ').slice(1).join(' ') || 'client.'}
              </span>
            </>
          }
          description={customer.email ?? customer.phone ?? 'Contact client'}
        />

        <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <input
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              type="email"
              placeholder="Email"
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
          <input
            value={company}
            onChange={(event) => {
              setCompany(event.target.value);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            placeholder="Entreprise"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as CustomerContactStatus);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            >
              {CUSTOMER_CONTACT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
            <input
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              placeholder="Source"
            />
          </div>
          <input
            value={tagsText}
            onChange={(event) => {
              setTagsText(event.target.value);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            placeholder="Tags"
          />
          <textarea
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
            rows={4}
            placeholder="Notes"
          />
          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateCustomer.isPending}
              className="flex-[2] rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {updateCustomer.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              disabled={deleteCustomer.isPending}
              onClick={() => void handleDelete()}
              className="flex items-center justify-center rounded-xl border border-border px-4 text-muted-foreground disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </form>

        <section className="mt-6">
          <p className="eyebrow mb-3">Historique client</p>
          <form onSubmit={handleInteraction} className="mb-4 rounded-2xl border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={interactionType}
                onChange={(event) => {
                  setInteractionType(event.target.value as CustomerInteractionType);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              >
                {CUSTOMER_INTERACTION_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {interactionLabels[item]}
                  </option>
                ))}
              </select>
              <input
                value={interactionTitle}
                onChange={(event) => {
                  setInteractionTitle(event.target.value);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
                placeholder="Titre"
                required
              />
            </div>
            <textarea
              value={interactionBody}
              onChange={(event) => {
                setInteractionBody(event.target.value);
              }}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none"
              rows={3}
              placeholder="Compte rendu"
            />
            {interactionError ? <p className="mt-2 text-sm text-destructive">{interactionError}</p> : null}
            <button
              type="submit"
              disabled={createInteraction.isPending}
              className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createInteraction.isPending ? 'Ajout...' : 'Ajouter interaction'}
            </button>
          </form>

          {interactionsQuery.isLoading ? (
            <LoadingPage />
          ) : (
            <div className="space-y-3">
              {(interactionsQuery.data ?? []).map((interaction) => (
                <article key={interaction.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{interaction.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {interactionLabels[interaction.type]} ·{' '}
                        {new Date(interaction.occurredAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteInteraction.mutateAsync(interaction.id)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {interaction.body ? (
                    <p className="mt-3 text-sm text-muted-foreground">{interaction.body}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
