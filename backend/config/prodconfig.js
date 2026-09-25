const config = {
  nodeEnv: "production",
  port: 3001,
  jwtSecret: "REPLACE_WITH_PRODUCTION_JWT_SECRET",
  mongodbUri: "REPLACE_WITH_PRODUCTION_MONGODB_URI",
  corsOrigins: ["http://YOUR_PRODUCTION_ELASTIC_IP"],
  allowVercelPreviewOrigins: false,
  cookieSecure: false,
  cookieSameSite: "lax",
  adminEmail: "REPLACE_WITH_PRODUCTION_ADMIN_EMAIL",
  adminPassword: "REPLACE_WITH_PRODUCTION_ADMIN_PASSWORD",
  adminResetPassword: false,
};

export default config;
