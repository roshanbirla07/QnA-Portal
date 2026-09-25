let config = {};

try {
  config = { ...(await import("./prod_config.js")) };
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;

  try {
    config = { ...(await import("./stage_config.js")) };
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;

    try {
      config = { ...(await import("./dev_config.js")) };
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;

      try {
        config = { ...(await import("./local_config.js")) };
      } catch (error) {
        if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
      }
    }
  }
}

export default config;
