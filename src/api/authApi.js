import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_URL from "../config/api";
import { getAccessToken, setTokens, removeTokens } from "../utils/storage";

const api = axios.create({
  baseURL: `${API_URL}/auth`,
  timeout: 15000,
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
  const { accessToken, access_token, role, user } = res.data;
  const finalAccessToken = accessToken || access_token;

  if (!finalAccessToken) throw new Error("Token không tồn tại trong phản hồi");

  const userInfo = user || {
    email,
    name: email.split("@")[0],
    role: role,
  };

  await setTokens(finalAccessToken, userInfo, role);
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

export const verifyOtpApi = async (email, type, otp) => {
  try {
    const res = await api.post("/verify-otp", { email, type, otp });
    if (res.data.token || res.data.verificationToken) {
      const token = res.data.token || res.data.verificationToken;
      await AsyncStorage.setItem(
        `otpVerificationToken_${email}_${type}`,
        token
      );
    }
    await AsyncStorage.setItem(`otpVerified_${email}_${type}`, "true");

    return res.data;
  } catch (error) {
    await AsyncStorage.removeItem(`otpVerificationToken_${email}_${type}`);
    await AsyncStorage.removeItem(`otpVerified_${email}_${type}`);
    throw error;
  }
};

export const resetPasswordApi = async (
  email,
  newPassword,
  confirmNewPassword = null
) => {
  try {
    const verificationToken = await AsyncStorage.getItem(
      `otpVerificationToken_${email}_reset-password`
    );
    const isVerified = await AsyncStorage.getItem(
      `otpVerified_${email}_reset-password`
    );

    if (!isVerified || isVerified !== "true") {
      throw new Error("OTP chưa được xác thực. Vui lòng xác thực OTP trước.");
    }

    const payload = {
      email,
      newPassword,
    };

    if (confirmNewPassword) {
      payload.confirmNewPassword = confirmNewPassword;
    }

    if (verificationToken) {
      payload.token = verificationToken;
      payload.verificationToken = verificationToken;
    }

    const res = await api.post("/reset-password", payload);

    await AsyncStorage.removeItem(
      `otpVerificationToken_${email}_reset-password`
    );
    await AsyncStorage.removeItem(`otpVerified_${email}_reset-password`);

    return res.data;
  } catch (error) {
    console.log("Reset password error:", error.response?.data || error.message);
    throw error;
  }
};

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

  const keys = await AsyncStorage.getAllKeys();
  const otpKeys = keys.filter(
    (key) =>
      key.startsWith("otpVerificationToken_") || key.startsWith("otpVerified_")
  );
  if (otpKeys.length > 0) {
    await AsyncStorage.multiRemove(otpKeys);
  }

  return true;
};
