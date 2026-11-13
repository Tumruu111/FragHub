import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Listing } from '../../../types/listing';

const LISTING_FIELDS = gql`
  fragment ListingFields on Listing {
    id
    title
    picture
    vibe
    status
    bottleMl
    volumeMl
    sizes {
      sizeMl
      price
      available
    }
  }
`;

const LISTINGS_QUERY = gql`
  query GetListings($page: Int, $limit: Int) {
    listings(page: $page, limit: $limit) {
      data {
        ...ListingFields
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
  ${LISTING_FIELDS}
`;

const LISTING_QUERY = gql`
  query GetListing($id: ID!) {
    listing(id: $id) {
      ...ListingFields
    }
  }
  ${LISTING_FIELDS}
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
      const res = await graphQLClient.request<{
        listings: { data: Listing[]; pageInfo: PageInfo };
      }>(LISTINGS_QUERY, { page, limit });
      return res.listings;
    },
  });
};

export const useListing = (id: string) => {
  return useQuery<Listing>({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await graphQLClient.request<{ listing: Listing }>(
        LISTING_QUERY,
        { id }
      );
      return res.listing;
    },
    enabled: !!id,
  });
};
