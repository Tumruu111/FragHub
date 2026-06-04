import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { expressMiddleware } from '@as-integrations/express4';
import { apolloServer } from './graphql';
import { buildContext } from './graphql/context';
import { config } from './config';
import adminRoutes from './modules/admin/routes/adminRoutes';

const app = express();

app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

await apolloServer.start();

app.use('/api/graphql', express.json(), expressMiddleware(apolloServer, { context: buildContext }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/api/admin', adminRoutes);

const server = app.listen(config.port, () => {
  console.log(`Listening at http://localhost:${config.port}/api`);
});

server.on('error', console.error);
