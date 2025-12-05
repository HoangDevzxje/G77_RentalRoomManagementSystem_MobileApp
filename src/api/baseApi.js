import axios from "axios";
import API_URL from "../config/api";
import { getAccessToken, removeTokens, setTokens } from "../utils/storage";

const baseApi = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Tự động gắn Token
baseApi.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Xử lý lỗi và Refresh Token
baseApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và chưa thử lại lần nào
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Gọi API refresh token (dùng axios thường để tránh loop vô hạn)
        const res = await axios.post(`${API_URL}/auth/refresh-token`);
        const { accessToken, access_token } = res.data;
        const newAccessToken = accessToken || access_token;

        if (newAccessToken) {
          await setTokens(newAccessToken);
          // Gắn token mới vào header và gọi lại request cũ
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return baseApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh thất bại => Logout
        await removeTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default baseApi;
