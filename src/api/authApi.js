import baseApi from "./baseApi";
import { setTokens, removeTokens } from "../utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const loginApi = async (email, password) => {
  try {
    const res = await baseApi.post("/auth/login", { email, password });
    const { accessToken, access_token, role, user } = res.data;
    const finalAccessToken = accessToken || access_token;

    if (!finalAccessToken)
      throw new Error("Token không tồn tại trong phản hồi");

    const userInfo = user || {
      email,
      name: email.split("@")[0],
      role: role,
    };

    await setTokens(finalAccessToken, userInfo, role);
    return { accessToken: finalAccessToken, role, user: userInfo };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Đăng nhập thất bại";
    throw new Error(message);
  }
};

export const registerApi = async (payload) => {
  const res = await baseApi.post("/auth/register", payload);
  return res.data;
};

export const sendOtpApi = async (email, type) => {
  const res = await baseApi.post("/auth/send-otp", { email, type });
  return res.data;
};

export const verifyOtpApi = async (email, type, otp) => {
  try {
    const res = await baseApi.post("/auth/verify-otp", { email, type, otp });
    const token = res.data.token || res.data.verificationToken;

    if (token) {
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
      throw new Error("OTP chưa được xác thực.");
    }

    const payload = { email, newPassword };
    if (confirmNewPassword) payload.confirmNewPassword = confirmNewPassword;
    if (verificationToken) {
      payload.token = verificationToken;
      payload.verificationToken = verificationToken;
    }

    const res = await baseApi.post("/auth/reset-password", payload);

    await AsyncStorage.removeItem(
      `otpVerificationToken_${email}_reset-password`
    );
    await AsyncStorage.removeItem(`otpVerified_${email}_reset-password`);

    return res.data;
  } catch (error) {
    throw error;
  }
};

export const changePasswordApi = async (oldPassword, newPassword) => {
  const res = await baseApi.post("/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return res.data;
};

export const refreshTokenApi = async () => {
  const res = await baseApi.post("/auth/refresh-token");
  const { accessToken, access_token } = res.data;
  const newAccessToken = accessToken || access_token;
  await setTokens(newAccessToken);
  return newAccessToken;
};

export const logoutApi = async () => {
  try {
    await baseApi.post("/auth/logout");
  } catch (e) {}
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
