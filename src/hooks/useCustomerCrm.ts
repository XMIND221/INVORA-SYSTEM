import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCustomer,
  createCustomerInteraction,
  deleteCustomer,
  deleteCustomerInteraction,
  getCustomer,
  listCustomerInteractions,
  listCustomers,
  updateCustomer,
} from '@/services/customer-crm.service';
import { useAuth } from '@/hooks/useAuth';
import type {
  CustomerContactInput,
  CustomerContactStatus,
  CustomerContactUpdateInput,
  CustomerInteractionInput,
} from '@/types/customer-crm';

interface UseCustomersOptions {
  query?: string;
  status?: CustomerContactStatus | 'all';
  eventId?: string | null;
}

const customerKeys = {
  all: ['customer-crm'] as const,
  list: (ownerId: string | undefined, options: UseCustomersOptions) =>
    [...customerKeys.all, 'list', ownerId, options] as const,
  detail: (customerId: string | undefined) => [...customerKeys.all, 'detail', customerId] as const,
  interactions: (customerId: string | undefined) =>
    [...customerKeys.all, 'interactions', customerId] as const,
};

export function useCustomers(options: UseCustomersOptions = {}) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const query = useQuery({
    queryKey: customerKeys.list(user?.id, options),
    queryFn: () => {
      if (!user?.id) throw new Error('auth_required');
      return listCustomers({
        ownerId: user.id,
        query: options.query,
        status: options.status,
        eventId: options.eventId,
      });
    },
    enabled: isAuthenticated && !!user?.id,
  });

  return {
    customers: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isAuthenticated,
    user,
  };
}

export function useCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => {
      if (!customerId) throw new Error('customer_id_required');
      return getCustomer(customerId);
    },
    enabled: !!customerId,
  });
}

export function useCustomerInteractions(customerId: string | undefined) {
  return useQuery({
    queryKey: customerKeys.interactions(customerId),
    queryFn: () => {
      if (!customerId) throw new Error('customer_id_required');
      return listCustomerInteractions(customerId);
    },
    enabled: !!customerId,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CustomerContactInput) => createCustomer(input),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CustomerContactUpdateInput) => updateCustomer(input),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useCreateCustomerInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CustomerInteractionInput) => createCustomerInteraction(input),
    onSuccess: (interaction) => {
      void queryClient.invalidateQueries({
        queryKey: customerKeys.interactions(interaction.customerId),
      });
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(interaction.customerId) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useDeleteCustomerInteraction(customerId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (interactionId: string) => deleteCustomerInteraction(interactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.interactions(customerId) });
    },
  });
}
