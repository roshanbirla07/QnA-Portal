const config = {
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3001,
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim().replace(/^(["'])(.*)\1$/, "$2"))
        .filter(Boolean),
    allowVercelPreviewOrigins: process.env.ALLOW_VERCEL_PREVIEW_ORIGINS !== "false",
    mongodbUri: process.env.MONGODB_URI
};

export default config;
