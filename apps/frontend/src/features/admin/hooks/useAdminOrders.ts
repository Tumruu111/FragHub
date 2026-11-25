import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Order } from '../../../types/order';

const ADMIN_ORDERS_QUERY = gql`
  query AdminOrders {
    orders {
      id
      status
      sizeMl
      price
      createdAt
      completedAt
      cancelledAt
      boxMonth
      delivery {
        phone
        address
        note
      }
      listing {
        id
        title
        picture
      }
      user {
        id
        name
        email
      }
    }
  }
`;

const COMPLETE_ORDER_MUTATION = gql`
  mutation CompleteOrder($orderId: ID!) {
    completeOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($orderId: ID!) {
    cancelOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

export interface AdminOrder extends Order {
  user: { id: string; name: string; email: string };
}

export const useAdminOrders = () => {
  const qc = useQueryClient();
  // Settling an order changes stats, and cancelling puts ml back in a bottle
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['listings'] });
  };

  const ordersQuery = useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await graphQLClient.request<{ orders: AdminOrder[] }>(
        ADMIN_ORDERS_QUERY
      );
      return res.orders;
    },
  });

  const complete = useMutation({
    mutationFn: (orderId: string) =>
      graphQLClient.request(COMPLETE_ORDER_MUTATION, { orderId }),
    onSuccess: refresh,
  });

  const cancel = useMutation({
    mutationFn: (orderId: string) =>
      graphQLClient.request(CANCEL_ORDER_MUTATION, { orderId }),
    onSuccess: refresh,
  });

  return { ...ordersQuery, complete, cancel };
};
