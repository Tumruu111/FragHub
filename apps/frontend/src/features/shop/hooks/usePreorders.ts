import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Preorder } from '../../../types/order';

// Shared with the admin pre-orders page
export const PREORDER_FIELDS = gql`
  fragment PreorderFields on Preorder {
    id
    status
    total
    deposit
    balance
    items {
      id
      listingId
      title
      bottleMl
      price
      picture
    }
    due {
      id
      kind
      amount
      paid
      paidAt
    }
    balanceDueBy
    overdue
    delivery {
      phone
      address
      note
    }
    createdAt
    depositPaidAt
    arrivedAt
    paidAt
    deliveredAt
    cancelledAt
  }
`;

const MY_PREORDERS = gql`
  query MyPreorders {
    myPreorders {
      ...PreorderFields
    }
  }
  ${PREORDER_FIELDS}
`;

const CANCEL_MY_PREORDER = gql`
  mutation CancelMyPreorder($id: ID!) {
    cancelMyPreorder(id: $id) {
      id
    }
  }
`;

export const useMyPreorders = () =>
  useQuery<Preorder[]>({
    queryKey: ['preorders'],
    queryFn: async () =>
      (await graphQLClient.request<{ myPreorders: Preorder[] }>(MY_PREORDERS))
        .myPreorders,
  });

// Only while the deposit is unpaid
export const useCancelMyPreorder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      graphQLClient.request(CANCEL_MY_PREORDER, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['preorders'] }),
  });
};
