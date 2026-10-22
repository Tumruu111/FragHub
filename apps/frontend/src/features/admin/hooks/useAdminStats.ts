import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';

const STATS_QUERY = gql`
  query AdminStats {
    adminStats {
      totalListings
      inStock
      outOfStock
      totalOrders
      pending
      completed
      cancelled
      totalRevenue
      ordersByDay {
        day
        count
      }
    }
  }
`;

export interface AdminStats {
  totalListings: number;
  inStock: number;
  outOfStock: number;
  totalOrders: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  ordersByDay: { day: string; count: number }[];
}

export const useAdminStats = () => {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await graphQLClient.request<{ adminStats: AdminStats }>(STATS_QUERY);
      return res.adminStats;
    },
  });
};
