export const config = {
  port: process.env.PORT || 3333,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  db: {
    url: process.env.DATABASE_URL!,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: '7d',
    adminSecretKey: process.env.ADMIN_SECRET_KEY!,
    bcryptRounds: 10,
  },

  cors: {
    origin: process.env.ALLOWED_ORIGIN || '*',
  },

  s3: {
    region: process.env.AWS_REGION!,
    endpoint: process.env.AWS_ENDPOINT,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    bucket: process.env.AWS_BUCKET!,
    publicUpload: process.env.AWS_FILE_UPLOAD_TYPE === 'public',
  },
} as const;
