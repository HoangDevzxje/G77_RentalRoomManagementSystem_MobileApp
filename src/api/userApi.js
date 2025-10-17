import baseApi from "./baseApi";

export const getProfile = async () => {
  const res = await baseApi.get("/users/profile");
  return res.data;
};

export const updateProfile = async (profileData) => {
  const res = await baseApi.put("/users/profile", profileData);
  return res.data;
};
