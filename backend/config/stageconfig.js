const config = {
  nodeEnv: "staging",
  port: 3001,
  jwtSecret: "REPLACE_WITH_STAGE_JWT_SECRET",
  mongodbUri: "REPLACE_WITH_STAGE_MONGODB_URI",
  corsOrigins: ["http://YOUR_STAGE_ELASTIC_IP"],
  allowVercelPreviewOrigins: false,
  cookieSecure: false,
  cookieSameSite: "lax",
  adminEmail: "REPLACE_WITH_STAGE_ADMIN_EMAIL",
  adminPassword: "REPLACE_WITH_STAGE_ADMIN_PASSWORD",
  adminResetPassword: false,
};

export default config;
