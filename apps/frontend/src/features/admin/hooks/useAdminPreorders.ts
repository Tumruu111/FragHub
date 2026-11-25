import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import { PREORDER_FIELDS } from '../../shop/hooks/usePreorders';
import type { Preorder } from '../../../types/order';

export interface AdminPreorder extends Preorder {
  user: { id: string; name: string; email: string };
}

const ADMIN_PREORDERS = gql`
  query AdminPreorders {
    adminPreorders(includeUnpaid: true) {
      ...PreorderFields
      user {
        id
        name
        email
      }
    }
  }
  ${PREORDER_FIELDS}
`;

const step = (name: string) => gql`
  mutation Step($id: ID!) {
    ${name}(id: $id) {
      id
      status
    }
  }
`;

const ARRIVED = step('markPreorderArrived');
const DELIVERED = step('markPreorderDelivered');
const CANCEL = step('cancelPreorder');

export const useAdminPreorders = () =>
  useQuery<AdminPreorder[]>({
    queryKey: ['admin', 'preorders'],
    queryFn: async () =>
      (
        await graphQLClient.request<{ adminPreorders: AdminPreorder[] }>(
          ADMIN_PREORDERS
        )
      ).adminPreorders,
  });

export const usePreorderActions = () => {
  const qc = useQueryClient();
  const options = (doc: string) => ({
    mutationFn: (id: string) => graphQLClient.request(doc, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
  return {
    arrived: useMutation(options(ARRIVED)),
    delivered: useMutation(options(DELIVERED)),
    cancel: useMutation(options(CANCEL)),
  };
};
