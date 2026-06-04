import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Order } from '../../../types/order';

const MY_ORDERS_QUERY = gql`
  query MyOrders {
    orders {
      id status listingId createdAt cancelledAt completedAt buyerConfirmed
    }
  }
`;

export const useMyOrders = () => {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res: any = await graphQLClient.request(MY_ORDERS_QUERY);
      return res.orders;
    },
  });
};
