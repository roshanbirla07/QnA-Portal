const formatMeta = (meta) => {
  if (!meta) return "";
  if (typeof meta === "string") return ` | ${meta}`;

  try {
    return ` | ${JSON.stringify(meta)}`;
  } catch {
    return " | [unserializable metadata]";
  }
};

const createLog = (level) => (message, meta) => {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`);
};

const logger = {
  info: createLog("info"),
  warn: createLog("warn"),
  error: createLog("error"),
};

export default logger;
