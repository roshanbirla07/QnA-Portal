import { apiConnector } from "./apiConnector";

export const loginUser = async (method, url, body, navigate, setToken) => {
  const response = await apiConnector(method, url, body);

  if (!response.data.success) {
    throw new Error(response.data.message);
  }

  setToken(response.data.data.token);
  navigate("/");
  return response.data;
};

export const signupUser = async (method, url, body, navigate, setToken) => {
  const response = await apiConnector(method, url, body);

  if (!response.data.success) {
    throw new Error(response.data.message);
  }

  setToken(response.data.data.token);
  navigate("/");
  return response.data;
};
