import express from 'express';
import * as path from 'path';
import { expressMiddleware } from '@as-integrations/express4';
import { userApolloServer } from './modules/user';
import adminRoutes from './modules/admin/routes/adminRoutes';

const app = express();
app.use(express.json());
await userApolloServer.start();

app.use('/api/graphql', express.json(), expressMiddleware(userApolloServer));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});

server.on('error', console.error);
