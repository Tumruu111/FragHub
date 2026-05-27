import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/lib/graphql';

const LISTINGS_QUERY = gql`
  query {
    listings {
      id
      title
      price
      picture
      size
      vibe
      stock
    }
  }
`;

export const useListings = () => {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const res = await graphQLClient.request(LISTINGS_QUERY);
      return res.listings;
    },
  });
};
