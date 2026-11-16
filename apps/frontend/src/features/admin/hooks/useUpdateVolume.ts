import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Listing } from '../../../types/listing';

const UPDATE_VOLUME_MUTATION = gql`
  mutation UpdateVolume($id: ID!, $volumeMl: Int!) {
    updateListing(id: $id, input: { volumeMl: $volumeMl }) {
      id
      volumeMl
      status
    }
  }
`;

type VolumeUpdate = Pick<Listing, 'id' | 'volumeMl' | 'status'>;

// Sets how many ml are left in a listing's bottle
export const useUpdateVolume = () => {
  const qc = useQueryClient();
  return useMutation<VolumeUpdate, Error, { id: string; volumeMl: number }>({
    mutationFn: async ({ id, volumeMl }) => {
      const res = await graphQLClient.request<{
        updateListing: VolumeUpdate;
      }>(UPDATE_VOLUME_MUTATION, { id, volumeMl });
      return res.updateListing;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['listing', updated.id] });
    },
  });
};
