const config = {
    jwtSecret: "BIRLA",
    nodeEnv: "development",
    port: 3001,
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim().replace(/^(["'])(.*)\1$/, "$2"))
        .filter(Boolean),
    allowVercelPreviewOrigins: process.env.ALLOW_VERCEL_PREVIEW_ORIGINS !== "false",
    mongodbUri: "mongodb+srv://roshanbirla2104:gMcMUbyALLPOhH1B@cluster0.fm1vr1u.mongodb.net/HexaWealth"
};

export default config;
