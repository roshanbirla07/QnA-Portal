import localConfig from "./localconfig.js";
import stageConfig from "./stageconfig.js";
import prodConfig from "./prodconfig.js";

// Change only this value when switching deployment environments.
const ACTIVE_ENV = "stage";

const configs = {
  local: localConfig,
  stage: stageConfig,
  prod: prodConfig,
};

const config = configs[ACTIVE_ENV];

if (!config) {
  throw new Error(`Unsupported ACTIVE_ENV: ${ACTIVE_ENV}`);
}

export { ACTIVE_ENV };
export default config;
