import axios from "axios";
import API_URL from "../config/api";
import { getAccessToken, setTokens, removeTokens } from "../utils/storage";

const api = axios.create({
  baseURL: `${API_URL}/auth`,
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await api.post("/refresh-token");
        const { accessToken, access_token } = res.data;
        const newAccessToken = accessToken || access_token;

        if (newAccessToken) {
          await setTokens(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        await removeTokens();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const loginApi = async (email, password) => {
  const res = await api.post("/login", { email, password });
  const { accessToken, access_token, role } = res.data;
  const finalAccessToken = accessToken || access_token;

  if (!finalAccessToken) {
    throw new Error("Token không tồn tại trong phản hồi");
  }

  await setTokens(finalAccessToken);

  const userInfo = {
    email: email,
    name: email.split("@")[0],
  };

  return {
    accessToken: finalAccessToken,
    role,
    user: userInfo,
  };
};

export const registerApi = (payload) =>
  api.post("/register", payload).then((res) => res.data);

export const sendOtpApi = (email, type) =>
  api.post("/send-otp", { email, type }).then((res) => res.data);

export const verifyOtpApi = (email, type, otp) =>
  api.post("/verify-otp", { email, type, otp }).then((res) => res.data);

export const resetPasswordApi = (email, newPassword) =>
  api.post("/reset-password", { email, newPassword }).then((res) => res.data);

export const changePasswordApi = (oldPassword, newPassword) =>
  api
    .post("/change-password", { oldPassword, newPassword })
    .then((res) => res.data);

export const refreshTokenApi = async () => {
  const res = await api.post("/refresh-token");
  const { accessToken, access_token } = res.data;
  const newAccessToken = accessToken || access_token;

  await setTokens(newAccessToken);
  return newAccessToken;
};

export const logoutApi = async () => {
  try {
    await api.post("/logout");
  } catch {}
  await removeTokens();
  return true;
};
