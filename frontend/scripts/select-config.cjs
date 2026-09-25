const fs = require("fs");
const path = require("path");

const configDir = path.join(__dirname, "..", "src", "config");
const priorities = [
  "prod_config.js",
  "stage_config.js",
  "dev_config.js",
  "local_config.js",
];

const selected = priorities.find((file) => fs.existsSync(path.join(configDir, file)));

if (!selected) {
  console.error("No frontend config found in frontend/src/config");
  process.exit(1);
}

const target = path.join(configDir, "active_config.js");
fs.writeFileSync(
  target,
  `export * from "./${selected}";\n`,
  "utf8"
);

console.log(`Using frontend config: ${selected}`);
