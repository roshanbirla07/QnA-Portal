import localConfig from "./localconfig";
import stageConfig from "./stageconfig";
import prodConfig from "./prodconfig";

// Keep this aligned with the backend deployment environment.
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
