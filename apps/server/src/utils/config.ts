import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(8080),
  databaseUrl: z.string().min(1),
  sessionSecret: z.string().min(32),
  jwtSecret: z.string().min(32),
  allowedOrigins: z.string().transform(str => str.split(',')),
  snapshotInterval: z.coerce.number().default(500),
  snapshotPeriodSec: z.coerce.number().default(300),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  smtpHost: z.string().default('localhost'),
  smtpPort: z.coerce.number().default(1025),
  smtpUser: z.string().default(''),
  smtpPass: z.string().default(''),
  smtpFrom: z.string().email().default('noreply@gathercomb.local'),
});

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  allowedOrigins: process.env.ALLOWED_ORIGINS,
  snapshotInterval: process.env.SNAPSHOT_INTERVAL,
  snapshotPeriodSec: process.env.SNAPSHOT_PERIOD_SEC,
  logLevel: process.env.LOG_LEVEL,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
};

export const config = ConfigSchema.parse(rawConfig);
