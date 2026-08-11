export const decodeToken = (token) => {
  if (!token) return {};

  try {
    return JSON.parse(atob(token.split(".")[1])) || {};
  } catch (error) {
    return {};
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeToken(token);
  return Boolean(payload.exp && payload.exp * 1000 <= Date.now());
};
