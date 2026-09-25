import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const configDir = path.dirname(new URL(import.meta.url).pathname);

// Load lowest -> highest priority.
// Effective priority: prod > stage > dev > local
const configFiles = [
  "local_config.js",
  "dev_config.js",
  "stage_config.js",
  "prod_config.js",
];

let config = {};

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

const requiredKeys = [
  "port",
  "mongodbUri",
  "jwtSecret",
  "corsOrigins",
  "cookieSecure",
  "cookieSameSite",
];

const missingKeys = requiredKeys.filter(
  (key) => config[key] === undefined || config[key] === null || config[key] === ""
);

if (missingKeys.length) {
  throw new Error(
    `Missing config values: ${missingKeys.join(", ")}. Add the required instance config file under backend/config.`
  );
}

export default config;
