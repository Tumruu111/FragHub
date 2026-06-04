import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/api';
import type { Listing } from '../../../types/listing';

export const useAdminListings = () => {
  const qc = useQueryClient();

  const listsQuery = useQuery<Listing[]>({
    queryKey: ['admin', 'lists'],
    queryFn: async () => {
      const res = await api.get('/admin/lists');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Listing>) => {
      const res = await api.post('/admin/create', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'lists'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/delete/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'lists'] }),
  });

  return {
    ...listsQuery,
    createListing: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteListing: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
