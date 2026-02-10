import axios from "axios";

axios.defaults.withCredentials = true;
const axiosInstance = axios.create({
  withCredentials: true,
});

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong"
  );
};

const apiConnector = async (method, url, bodyData, headerData, paramsData) => {
  try {
    return await axiosInstance({
      method,
      withCredentials: true,
      url,
      data: bodyData || null,
      headers: headerData || null,
      params: paramsData || null,
    });
  } catch (error) {
    const normalizedError = new Error(getErrorMessage(error));
    normalizedError.statusCode = error?.response?.status;
    normalizedError.response = error?.response?.data;
    throw normalizedError;
  }
};

export { apiConnector };
