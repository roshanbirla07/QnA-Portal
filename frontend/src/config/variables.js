const defaults = {
  // Same-origin deployment works without any frontend config file.
  apiBaseUrl: "",
};

// Runtime config can be injected on the instance before the app bundle loads.
// Priority: prod > stage > dev > local
const runtimeConfigs = window.__APP_CONFIG__ || {};

const config = {
  ...defaults,
  ...(runtimeConfigs.local || {}),
  ...(runtimeConfigs.dev || {}),
  ...(runtimeConfigs.stage || {}),
  ...(runtimeConfigs.prod || {}),
};

export default config;
