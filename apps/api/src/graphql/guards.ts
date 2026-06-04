import { GraphQLError } from 'graphql';
import type { GraphQLContext } from './context';
import { Role } from '../../generated/prisma/enums';

export const requireAuth = (ctx: GraphQLContext) => {
  if (!ctx.user) throw new GraphQLError('Unauthorized', { extensions: { code: 'UNAUTHENTICATED' } });
  return ctx.user;
};

export const requireAdmin = (ctx: GraphQLContext) => {
  const user = requireAuth(ctx);
  if (user.role !== Role.Admin) throw new GraphQLError('Forbidden: Admins only', { extensions: { code: 'FORBIDDEN' } });
  return user;
};
