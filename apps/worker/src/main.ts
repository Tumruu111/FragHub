import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis({ maxRetriesPerRequest: null });

const cronJobQueue = new Queue('cronJobQueue', {
  connection,
});

const orderWorker = new Worker(
  'orderQueue',
  async (job) => {
    if (job.name === 'createOrder') {
      const { listingId, email } = job.data;

      throw new Error(
        `Failed to process order for listingId: ${listingId}, email: ${email}}`
      );
    }
  },
  {
    connection,
  }
);

const cronWorker = new Worker(
  'cronJobQueue',
  async (job) => {
    if (job.name === 'checkOrder') {
      fetch('http://localhost:3333/api/orders/check')
        .then((response) => response.json())
        .then((data) => {
          console.log('Cron job response:', data);
        })
        .catch((error) => {
          console.error('Error in cron job:', error);
        });
    }
  },
  {
    connection,
  }
);

cronWorker.on('completed', (job) => {
  console.log(`Cron job with id ${job.id} has completed!`);
});

orderWorker.on('completed', (job) => {
  console.log(`Job with id ${job.id} has completed!`);
});

orderWorker.on('failed', (job, err) => {
  console.error(`Job with id ${job?.id} has failed with error: ${err.message}`);
});

cronJobQueue.add(
  'checkOrder',
  {},
  {
    repeat: { pattern: '*/10 * * * * *' },
    removeOnComplete: true,
  }
);

console.log('Worker is running and waiting for jobs...');
