import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/lib/graphql';

const STATS_QUERY = gql`
  query AdminStats {
    listings {
      data {
        id status stock price createdAt
      }
    }
    orders {
      id status createdAt listingId
    }
  }
`;

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res: any = await graphQLClient.request(STATS_QUERY);
      const listings = res.listings.data;
      const orders = res.orders;

      const inStock = listings.filter((l: any) => l.status === 'in_stock').length;
      const outOfStock = listings.filter((l: any) => l.status === 'out_of_order').length;
      const totalRevenue = orders
        .filter((o: any) => o.status === 'completed')
        .reduce((acc: number, o: any) => {
          const listing = listings.find((l: any) => l.id === o.listingId);
          return acc + (listing?.price ?? 0);
        }, 0);

      // Orders by status
      const pending = orders.filter((o: any) => o.status === 'pending').length;
      const completed = orders.filter((o: any) => o.status === 'completed').length;
      const cancelled = orders.filter((o: any) => o.status === 'cancelled').length;

      // Orders over last 7 days
      const now = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      });

      const ordersByDay = days.map((day, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const count = orders.filter((o: any) => {
          const od = new Date(o.createdAt);
          return od.toDateString() === d.toDateString();
        }).length;
        return { day, count };
      });

      return {
        totalListings: listings.length,
        inStock,
        outOfStock,
        totalOrders: orders.length,
        pending,
        completed,
        cancelled,
        totalRevenue,
        ordersByDay,
        listings,
        orders,
      };
    },
  });
};
