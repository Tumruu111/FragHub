import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Order } from '../../../types/order';

const MY_ORDERS_QUERY = gql`
  query MyOrders {
    myOrders {
      id status listingId createdAt cancelledAt completedAt buyerConfirmed
      listing { id title size picture price }
    }
  }
`;

export const useMyOrders = () => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await graphQLClient.request<{ myOrders: Order[] }>(MY_ORDERS_QUERY);
      return res.myOrders;
    },
  });
};
