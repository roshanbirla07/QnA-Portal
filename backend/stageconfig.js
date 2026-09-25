const config = {
    nodeEnv: "production",
    port: 3001,

    // Replace these placeholders with actual production values before deployment.
    jwtSecret: "REPLACE_WITH_PRODUCTION_JWT_SECRET",
    mongodbUri: "REPLACE_WITH_PRODUCTION_MONGODB_URI",

    // Frontend and backend are served from the same EC2 host.
    // Replace YOUR_ELASTIC_IP after associating the Elastic IP.
    corsOrigins: [
        "http://YOUR_ELASTIC_IP"
    ],

    allowVercelPreviewOrigins: false,

    // Plain HTTP while accessing the app by Elastic IP.
    cookieSecure: false,
    cookieSameSite: "lax",

    // Used by npm run seed:admin
    adminEmail: "REPLACE_WITH_ADMIN_EMAIL",
    adminPassword: "REPLACE_WITH_ADMIN_PASSWORD",
    adminResetPassword: false
};

export default config;
