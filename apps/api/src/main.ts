import express from 'express';
import * as path from 'path';
import { prisma } from './lib/prisma';
import userRoutes from './modules/user/routes/userRoutes';
import listingRoutes from './modules/admin/routes/adminListingRoutes';

const app = express();

app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/api/users', userRoutes);
app.use('/api/admin/listings', listingRoutes);

app.get('/api', async (req, res) => {
  const users = await prisma.user.findMany();
  res.send({ message: 'Welcome to api!' });
  console.log('Users:', users);
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
