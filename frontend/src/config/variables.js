const configs = require.context(".", false, /_config\.js$/);

const priority = [
  "./prod_config.js",
  "./stage_config.js",
  "./dev_config.js",
  "./local_config.js",
];

let config = {};

for (const file of priority) {
  if (configs.keys().includes(file)) {
    config = configs(file);
    break;
  }
}

export default config;
