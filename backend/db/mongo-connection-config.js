export const buildMongoUri = (uri, dbName) => {
  const [baseUri, queryString] = uri.split("?", 2);
  const normalizedBaseUri = baseUri.replace(/\/$/, "");
  const uriWithDbName = normalizedBaseUri.endsWith(`/${dbName}`)
    ? normalizedBaseUri
    : `${normalizedBaseUri}/${dbName}`;

  return queryString ? `${uriWithDbName}?${queryString}` : uriWithDbName;
};

export const getMongoConnectionOptions = (config) => {
  const { mongodbUsername, mongodbPassword, mongodbAuthSource } = config;

  if (mongodbUsername === undefined && mongodbPassword === undefined) return {};
  if (!mongodbUsername || !mongodbPassword) {
    throw new Error("Set both mongodbUsername and mongodbPassword in the active backend config");
  }
  if (/^mongodb(?:\+srv)?:\/\/[^/?#]*@/.test(config.mongodbUri)) {
    throw new Error("Remove credentials from mongodbUri when using separate MongoDB credentials");
  }

  return {
    user: mongodbUsername,
    pass: mongodbPassword,
    authSource: mongodbAuthSource || "admin",
  };
};
