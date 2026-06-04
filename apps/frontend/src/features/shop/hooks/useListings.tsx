import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/lib/graphql';
import type { Listing } from '../../../types/listing';

const LISTINGS_QUERY = gql`
  query {
    listings {
      data {
        id title price picture size vibe stock status
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

export const useListings = () => {
  return useQuery<Listing[]>({
    queryKey: ['listings'],
    queryFn: async () => {
      const res: any = await graphQLClient.request(LISTINGS_QUERY);
      return res.listings.data;
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
