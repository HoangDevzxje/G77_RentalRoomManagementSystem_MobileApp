import baseApi from "./baseApi";

export const getProfile = async () => {
  try {
    const res = await baseApi.get("/users/profile");
    return res.data;
  } catch (error) {
    console.error("Get profile error:", error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const res = await baseApi.put("/users/profile", profileData);
    return res.data;
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};
