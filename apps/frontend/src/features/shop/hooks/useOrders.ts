import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Order } from '../../../types/order';

const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id
      status
      cancelledAt
    }
  }
`;

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation<Order, Error, string>({
    mutationFn: async (orderId: string) => {
      const res = await graphQLClient.request<{ cancelOrder: Order }>(
        CANCEL_ORDER_MUTATION,
        {
          orderId,
        }
      );
      return res.cancelOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
