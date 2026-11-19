import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';

const UPDATE_PRICES_MUTATION = gql`
  mutation UpdatePrices($id: ID!, $sizes: [SizePriceInput!]!) {
    updateListing(id: $id, input: { sizes: $sizes }) {
      id
    }
  }
`;

export interface SizePrice {
  sizeMl: number;
  price: number;
}

// Replaces a listing's price for every decant size. Past orders keep the
// price that was paid.
export const useUpdatePrices = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sizes }: { id: string; sizes: SizePrice[] }) =>
      graphQLClient.request(UPDATE_PRICES_MUTATION, { id, sizes }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['listing', id] });
    },
  });
};
