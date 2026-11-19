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
});
