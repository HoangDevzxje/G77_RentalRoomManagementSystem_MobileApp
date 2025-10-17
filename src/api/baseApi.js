import axios from "axios";
import API_URL from "../config/api";
import { getAccessToken, removeTokens, setTokens } from "../utils/storage";

const baseApi = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

baseApi.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("No access token found");
  }
  return config;
});

baseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh-token`
        );
        const { accessToken, access_token } = refreshResponse.data;
        const newAccessToken = accessToken || access_token;

        if (newAccessToken) {
          await setTokens(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return baseApi(originalRequest);
        }
      } catch (refreshError) {
        console.log("Token refresh failed:", refreshError);
        await removeTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default baseApi;
