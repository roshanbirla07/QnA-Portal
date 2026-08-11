const requiredInProduction = (name, fallback) => {
    const value = process.env[name] || fallback;

    if (process.env.NODE_ENV === "production" && !process.env[name]) {
        throw new Error(`${name} is required in production`);
    }

    return value;
};

const nodeEnv = process.env.NODE_ENV || "development";

const config = {
    jwtSecret: requiredInProduction("JWT_SECRET", "dev-only-secret"),
    nodeEnv,
    port: process.env.PORT || 3001,
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim().replace(/^(["'])(.*)\1$/, "$2"))
        .filter(Boolean),
    allowVercelPreviewOrigins: process.env.ALLOW_VERCEL_PREVIEW_ORIGINS === "true",
    mongodbUri: requiredInProduction("MONGODB_URI", "mongodb://127.0.0.1:27017"),
    cookieSecure: process.env.COOKIE_SECURE
        ? process.env.COOKIE_SECURE === "true"
        : nodeEnv === "production",
    cookieSameSite: process.env.COOKIE_SAME_SITE || (nodeEnv === "production" ? "none" : "lax")
};

export default config;
