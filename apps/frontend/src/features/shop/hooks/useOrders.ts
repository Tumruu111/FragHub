import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Order } from '../../../types/order';

const PLACE_ORDER_MUTATION = gql`
  mutation PlaceOrder($listingId: ID!) {
    placeOrder(listingId: $listingId) {
      id
      status
      listingId
      createdAt
    }
  }
`;

const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id
      status
      cancelledAt
    }
  }
`;

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation<Order, Error, string>({
    mutationFn: async (listingId: string) => {
      const res: any = await graphQLClient.request(PLACE_ORDER_MUTATION, {
        listingId,
      });
      return res.placeOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation<Order, Error, string>({
    mutationFn: async (orderId: string) => {
      const res: any = await graphQLClient.request(CANCEL_ORDER_MUTATION, {
        orderId,
      });
      return res.cancelOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
