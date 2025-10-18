import baseApi from "./baseApi";

export const getRoomFurnitures = async (roomId) => {
  const res = await baseApi.get("/furnitures/room", {
    params: { roomId },
  });
  return res.data.data || res.data;
};

export const getRoomFurnitureById = async (id) => {
  const res = await baseApi.get(`/furnitures/room/${id}`);
  return res.data;
};
