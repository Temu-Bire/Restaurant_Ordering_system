export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigins:
    process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [
      'http://localhost:5173',
    ],
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-dummy-secret-key',
    publicKey: process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK_TEST-dummy-public-key',
    webhookSecret:
      process.env.CHAPA_WEBHOOK_SECRET ||
      process.env.CHAPA_SECRET_KEY ||
      'chapa-webhook-secret',
    baseUrl: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
    environment: (
      process.env.CHAPA_ENVIRONMENT ||
      (process.env.CHAPA_SECRET_KEY?.startsWith('CHASECK_TEST') ? 'TEST' : 'LIVE')
    ) as 'TEST' | 'LIVE',
  },
});
