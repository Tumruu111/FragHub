import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import { expressMiddleware } from '@as-integrations/express4';
import { apolloServer } from './graphql';
import { buildContext } from './graphql/context';
import { config } from './config';
import { apiLimiter, graphqlLimiter } from './lib/rateLimits';
import { purgeExpiredTokens } from './lib/tokenBlacklist';
import { logger } from './lib/logger';
import adminRoutes from './modules/admin/routes/adminRoutes';
import authRoutes from './modules/auth/routes';
import paymentRoutes from './modules/payments/routes';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use(apiLimiter);

await apolloServer.start();

app.use(
  '/api/graphql',
  graphqlLimiter,
  express.json(),
  expressMiddleware(apolloServer, { context: buildContext })
);
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

purgeExpiredTokens().catch(console.error);

setInterval(
  () => purgeExpiredTokens().catch(console.error),
  6 * 60 * 60 * 1000
);

const server = app.listen(config.port, () => {
  logger.info(`Server running at http://localhost:${config.port}/api`);
});

server.on('error', console.error);
