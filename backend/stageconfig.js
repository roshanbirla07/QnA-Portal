const config = {
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGINS || "http://localhost:3000",
    mongodbUri: process.env.MONGODB_URI
};

export default config;
