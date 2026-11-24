import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import type { Box, Subscription } from '../../../types/subscription';

const BOX_FIELDS = `
  id
  month
  status
  items {
    id
    tier
    sizeMl
    listing {
      id
      title
      picture
    }
  }
  subscription {
    id
    plan
    forWhom
    user {
      name
      email
    }
  }
`;

const MONTH_QUERY = gql`
  query AdminSubscriptionMonth($month: String) {
    adminSubscriptionMonth(month: $month) {
      month
      today
      invoices
      paid
      boxes {
        ${BOX_FIELDS}
      }
    }
  }
`;

const SUBSCRIBERS_QUERY = gql`
  query AdminSubscriptions {
    adminSubscriptions {
      id
      plan
      forWhom
      status
      createdAt
      user {
        name
        email
      }
      delivery {
        phone
        address
      }
      invoices {
        id
        month
        paid
      }
    }
  }
`;

export interface AdminBox extends Box {
  subscription: Pick<Subscription, 'id' | 'plan' | 'forWhom'> & {
    user: { name: string; email: string };
  };
}

export interface SubscriptionMonth {
  month: string;
  today: number | null;
  invoices: number;
  paid: number;
  boxes: AdminBox[];
}

export type AdminSubscriber = Pick<
  Subscription,
  'id' | 'plan' | 'forWhom' | 'status' | 'createdAt' | 'delivery'
> & {
  user: { name: string; email: string };
  invoices: { id: string; month: string; paid: boolean }[];
};

const errorMessage = (e: unknown) =>
  (e as { response?: { errors?: { message: string }[] } })?.response
    ?.errors?.[0]?.message ?? 'Something went wrong.';

export const useSubscriptionMonth = (month?: string) =>
  useQuery<SubscriptionMonth>({
    queryKey: ['admin', 'subscriptionMonth', month ?? 'current'],
    queryFn: async () =>
      (
        await graphQLClient.request<{
          adminSubscriptionMonth: SubscriptionMonth;
        }>(MONTH_QUERY, { month })
      ).adminSubscriptionMonth,
  });

export const useSubscribers = () =>
  useQuery<AdminSubscriber[]>({
    queryKey: ['admin', 'subscribers'],
    queryFn: async () =>
      (
        await graphQLClient.request<{ adminSubscriptions: AdminSubscriber[] }>(
          SUBSCRIBERS_QUERY
        )
      ).adminSubscriptions,
  });

// The admin's monthly actions. Errors come back as readable messages.
export const useBoxActions = () => {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    qc.invalidateQueries({ queryKey: ['listings'] });
  };
  const run =
    <V>(document: string) =>
    async (variables: V) => {
      try {
        return await graphQLClient.request(document, variables as object);
      } catch (e) {
        throw new Error(errorMessage(e));
      }
    };

  return {
    sendInvoices: useMutation({
      mutationFn: run<{ month: string }>(gql`
        mutation SendInvoices($month: String!) {
          sendSubscriptionInvoices(month: $month)
        }
      `),
      onSuccess: refresh,
    }),
    propose: useMutation({
      mutationFn: run<{ month: string }>(gql`
        mutation ProposeBoxes($month: String!) {
          proposeBoxes(month: $month)
        }
      `),
      onSuccess: refresh,
    }),
    swap: useMutation({
      mutationFn: run<{ itemId: string; listingId: string }>(gql`
        mutation SwapBoxItem($itemId: ID!, $listingId: ID!) {
          swapBoxItem(itemId: $itemId, listingId: $listingId) {
            id
          }
        }
      `),
      onSuccess: refresh,
    }),
    confirm: useMutation({
      mutationFn: run<{ boxId: string }>(gql`
        mutation ConfirmBox($boxId: ID!) {
          confirmBox(boxId: $boxId) {
            id
            status
          }
        }
      `),
      onSuccess: refresh,
    }),
  };
};
