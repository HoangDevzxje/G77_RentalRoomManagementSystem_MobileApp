import baseApi from "./baseApi";

export const getRooms = async (params = {}) => {
  const res = await baseApi.get("/rooms", { params });
  return res.data.data;
};

export const getRoomById = async (id) => {
  const res = await baseApi.get(`/rooms/${id}`);
  return res.data;
};
