import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export const useAdminListings = () => {
  const qc = useQueryClient();

  const listsQuery = useQuery({
    queryKey: ['admin', 'lists'],
    queryFn: async () => {
      const res = await api.get('/admin/lists');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/delete/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'lists'] }),
  });

  return { ...listsQuery, deleteListing: deleteMutation.mutateAsync };
};
