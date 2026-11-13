import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Listing } from '../../../types/listing';

const UPDATE_STOCK_MUTATION = gql`
  mutation UpdateStock($id: ID!, $stock: Int!) {
    updateListing(id: $id, input: { stock: $stock }) {
      id
      stock
      status
    }
  }
`;

type StockUpdate = Pick<Listing, 'id' | 'stock' | 'status'>;

export const useUpdateStock = () => {
  const qc = useQueryClient();
  return useMutation<StockUpdate, Error, { id: string; stock: number }>({
    mutationFn: async ({ id, stock }) => {
      const res = await graphQLClient.request<{ updateListing: StockUpdate }>(
        UPDATE_STOCK_MUTATION,
        { id, stock }
      );
      return res.updateListing;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['listing', updated.id] });
    },
  });
};
