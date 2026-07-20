// pm2 process definition for the API.
// Usage on the server: pm2 start deploy/ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: 'veritas-api',
      cwd: '/home/ubuntu/FragHub/apps/api',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
