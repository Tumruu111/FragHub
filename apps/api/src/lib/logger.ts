const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (msg: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date().toISOString() }));
  },
  warn: (msg: string, meta?: object) => {
    console.warn(JSON.stringify({ level: 'warn', msg, ...meta, ts: new Date().toISOString() }));
  },
  error: (msg: string, err?: unknown, meta?: object) => {
    const error = err instanceof Error
      ? { message: err.message, stack: isDev ? err.stack : undefined }
      : { raw: String(err) };
    console.error(JSON.stringify({ level: 'error', msg, error, ...meta, ts: new Date().toISOString() }));
  },
};
