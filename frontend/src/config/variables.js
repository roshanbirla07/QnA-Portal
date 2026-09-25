const runtimeConfigs = window.__APP_CONFIG__ || {};

const config = {
  ...(runtimeConfigs.local || {}),
  ...(runtimeConfigs.dev || {}),
  ...(runtimeConfigs.stage || {}),
  ...(runtimeConfigs.prod || {}),
};

if (config.apiBaseUrl === undefined || config.apiBaseUrl === null) {
  throw new Error(
    "Missing frontend apiBaseUrl. Add the appropriate instance config file."
  );
}

export default config;
