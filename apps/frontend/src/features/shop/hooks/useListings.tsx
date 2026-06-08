import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Listing } from '../../../types/listing';

const LISTINGS_QUERY = gql`
  query GetListings($page: Int, $limit: Int) {
    listings(page: $page, limit: $limit) {
      data {
        id title price picture size vibe stock status
      }
      pageInfo {
        total
        page
        limit
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const LISTING_QUERY = gql`
  query GetListing($id: ID!) {
    listing(id: $id) {
      id title price picture size vibe stock status
    }
  }
`;

export interface PageInfo {
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const useListings = (page = 1, limit = 12) => {
  return useQuery<{ data: Listing[]; pageInfo: PageInfo }>({
    queryKey: ['listings', page, limit],
    queryFn: async () => {
      const res: any = await graphQLClient.request(LISTINGS_QUERY, { page, limit });
      return res.listings;
    },
  });
};

export const useListing = (id: string) => {
  return useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res: any = await graphQLClient.request(LISTING_QUERY, { id });
      return res.listing;
    },
    enabled: !!id,
  });
};
