import baseApi from "./baseApi";

export const getRoomById = async (id) => {
  const res = await baseApi.get(`/posts/rooms/${id}`);
  return res.data.data;
};

export const getRooms = async (params = {}) => {
  const res = await baseApi.get("/rooms", { params });
  return res.data;
};
