import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import { api } from '../../../shared/api';
import { isAuthenticated } from '../../../shared/auth/token';
import type { Delivery } from '../../../types/order';
import type {
  SubscriberFor,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanInfo,
} from '../../../types/subscription';

const PLANS_QUERY = gql`
  query SubscriptionPlans {
    subscriptionPlans {
      plan
      price
      tiers
      open
    }
  }
`;

const MY_SUBSCRIPTION_QUERY = gql`
  query MySubscription {
    mySubscription {
      id
      plan
      forWhom
      status
      createdAt
      cancelledAt
      delivery {
        phone
        address
        note
      }
      invoices {
        id
        month
        amount
        paid
        canPay
      }
      boxes {
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
      }
    }
  }
`;

const CANCEL_MUTATION = gql`
  mutation CancelSubscription {
    cancelSubscription {
      id
      status
    }
  }
`;

export const useSubscriptionPlans = () =>
  useQuery<SubscriptionPlanInfo[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () =>
      (
        await graphQLClient.request<{
          subscriptionPlans: SubscriptionPlanInfo[];
        }>(PLANS_QUERY)
      ).subscriptionPlans,
  });

export const useMySubscription = () =>
  useQuery<Subscription | null>({
    queryKey: ['subscription'],
    enabled: isAuthenticated(),
    queryFn: async () =>
      (
        await graphQLClient.request<{ mySubscription: Subscription | null }>(
          MY_SUBSCRIPTION_QUERY
        )
      ).mySubscription,
  });

export interface SubscribeInput {
  plan: SubscriptionPlan;
  forWhom: SubscriberFor;
  delivery: Delivery;
}

// Resolves to the first month's invoice to pay, or a waitlist place
export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation<
    { invoiceId?: string; month?: string; waitlist?: boolean },
    unknown,
    SubscribeInput
  >({
    mutationFn: async (input) => (await api.post('/subscriptions', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => graphQLClient.request(CANCEL_MUTATION),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
};
