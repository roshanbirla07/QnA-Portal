import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const configDir = path.dirname(new URL(import.meta.url).pathname);

const defaults = {
  nodeEnv: "development",
  port: 3001,
  corsOrigins: ["http://localhost:3000"],
  allowVercelPreviewOrigins: false,
  cookieSecure: false,
  cookieSameSite: "lax",
  jwtSecret: "",
  mongodbUri: "",
  adminEmail: "",
  adminPassword: "",
  adminResetPassword: false,
};

// Load from lowest to highest priority so later configs override earlier ones.
// Priority: prod > stage > dev > local
const configFiles = [
  "local_config.js",
  "dev_config.js",
  "stage_config.js",
  "prod_config.js",
];

let config = { ...defaults };

for (const fileName of configFiles) {
  const filePath = path.join(configDir, fileName);

  if (!fs.existsSync(filePath)) {
    continue;
  }

  const loaded = await import(pathToFileURL(filePath).href);
  config = {
    ...config,
    ...(loaded.default || loaded),
  };
}

if (!config.mongodbUri) {
  throw new Error(
    "MongoDB configuration missing. Add one of local_config.js, dev_config.js, stage_config.js, or prod_config.js under backend/config."
  );
}

if (!config.jwtSecret) {
  throw new Error(
    "JWT configuration missing. Add jwtSecret to the active backend config file."
  );
}

export default config;
