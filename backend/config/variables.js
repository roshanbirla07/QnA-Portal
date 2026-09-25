let config = {};

try {
  const localConfig = await import("./local_config.js");
  config = { ...config, ...(localConfig.default || localConfig) };
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

try {
  const devConfig = await import("./dev_config.js");
  config = { ...config, ...(devConfig.default || devConfig) };
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

try {
  const stageConfig = await import("./stage_config.js");
  config = { ...config, ...(stageConfig.default || stageConfig) };
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

try {
  const prodConfig = await import("./prod_config.js");
  config = { ...config, ...(prodConfig.default || prodConfig) };
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

export default config;
