import express from 'express';
import * as path from 'path';
import { expressMiddleware } from '@as-integrations/express4';
import { userApolloServer } from './modules/user';
import userRoutes from './modules/user/routes/userRoutes';
import adminRoutes from './modules/admin/routes/adminRoutes';

const app = express();

await userApolloServer.start();

app.use(express.json());

app.use('/api/graphql', express.json(), expressMiddleware(userApolloServer));

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/users', userRoutes);

app.use('/api/admin', adminRoutes);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
