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

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: process.env.SMTP_FROM || 'Veritas Parfums <parfumsveritas@gmail.com>',
    adminAlert: process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER!,
  },

  qpay: {
    username: process.env.QPAY_USERNAME!,
    password: process.env.QPAY_PASSWORD!,
    invoiceCode: process.env.QPAY_INVOICE_CODE!,
    callbackUrl: process.env.QPAY_CALLBACK_URL!,
    baseUrl: 'https://merchant.qpay.mn/v2',
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
