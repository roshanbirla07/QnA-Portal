const config = {
  nodeEnv: "development",
  port: 3001,
  jwtSecret: "local-dev-secret",
  mongodbUri: "mongodb://127.0.0.1:27017",
  corsOrigins: ["http://localhost:3000"],
  allowVercelPreviewOrigins: false,
  cookieSecure: false,
  cookieSameSite: "lax",
  adminEmail: "admin@example.com",
  adminPassword: "change-local-admin-password",
  adminResetPassword: false,
};

export default config;
