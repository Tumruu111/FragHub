import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Listing } from '../../../types/listing';

const ADMIN_LISTINGS_QUERY = gql`
  query AdminListings {
    adminListings {
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
      createdAt
      updatedAt
    }
  }
`;

const DECANT_SIZES_QUERY = gql`
  query DecantSizes {
    decantSizes
  }
`;

const CREATE_LISTING_MUTATION = gql`
  mutation CreateListing($input: CreateListingInput!) {
    createListing(input: $input) {
      id
    }
  }
`;

const DELETE_LISTING_MUTATION = gql`
  mutation DeleteListing($id: ID!) {
    deleteListing(id: $id)
  }
`;

export interface NewListing {
  title: string;
  picture: string;
  vibe: string[];
  bottleMl: number;
  volumeMl?: number;
  sizes: { sizeMl: number; price: number }[];
}

export const useAdminListings = () => {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['listings'] });
  };

  const listsQuery = useQuery<Listing[]>({
    queryKey: ['admin', 'lists'],
    queryFn: async () => {
      const res = await graphQLClient.request<{ adminListings: Listing[] }>(
        ADMIN_LISTINGS_QUERY
      );
      return res.adminListings;
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: NewListing) =>
      graphQLClient.request(CREATE_LISTING_MUTATION, { input }),
    onSuccess: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      graphQLClient.request(DELETE_LISTING_MUTATION, { id }),
    onSuccess: refresh,
  });

  return {
    ...listsQuery,
    createListing: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteListing: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

// The fixed decant sizes every listing is priced in, e.g. [2, 5, 10]
export const useDecantSizes = () =>
  useQuery<number[]>({
    queryKey: ['decantSizes'],
    queryFn: async () => {
      const res = await graphQLClient.request<{ decantSizes: number[] }>(
        DECANT_SIZES_QUERY
      );
      return res.decantSizes;
    },
    staleTime: Infinity,
  });
