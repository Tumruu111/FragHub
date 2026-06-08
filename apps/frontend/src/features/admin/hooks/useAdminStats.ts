import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/lib/graphql';

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
    }
  }
`;

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res: any = await graphQLClient.request(STATS_QUERY);
      return res.adminStats;
    },
  });
};
