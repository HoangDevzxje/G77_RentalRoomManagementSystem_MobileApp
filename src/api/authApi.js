import axios from "axios";
import API_URL from "../config/api";
import { getToken } from "../utils/storage";

const api = axios.create({
  baseURL: `${API_URL}/auth`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginApi = (email, password) =>
  api.post("/login", { email, password }).then((res) => res.data);

export const changePasswordApi = (oldPassword, newPassword) =>
  api
    .post("/change-password", { oldPassword, newPassword })
    .then((res) => res.data);

export const logoutApi = async () => {
  try {
    await api.post("/logout");
  } catch {}
  return true;
};
