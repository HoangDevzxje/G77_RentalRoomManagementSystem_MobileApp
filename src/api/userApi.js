import baseApi from "./baseApi";

export const getProfile = async () => {
  const res = await baseApi.get("/profiles");
  return res.data;
};

export const updateProfile = async (profileData) => {
  const res = await baseApi.put("/profiles", profileData);
  return res.data;
};
