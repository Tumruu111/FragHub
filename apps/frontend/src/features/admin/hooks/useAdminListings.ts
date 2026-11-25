import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Listing, ListingTier, ScentFor } from '../../../types/listing';

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
      bottlePrice
      tier
      scentFor
      createdAt
      updatedAt
    }
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
  bottlePrice: number | null;
  tier: ListingTier;
  scentFor: ScentFor;
}

const UPDATE_BOX_FIELDS_MUTATION = gql`
  mutation UpdateBoxFields($id: ID!, $input: UpdateListingInput!) {
    updateListing(id: $id, input: $input) {
      id
      tier
      scentFor
    }
  }
`;

// Sets which box slot a listing fills and who it suits
export const useUpdateBoxFields = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      input: { tier?: ListingTier; scentFor?: ScentFor };
    }) => graphQLClient.request(UPDATE_BOX_FIELDS_MUTATION, v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  });
};

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
