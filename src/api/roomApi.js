import baseApi from "./baseApi";

export const getMyRoomDetail = async () => {
  try {
    const res = await baseApi.get("/rooms/my-room");
    return res.data;
  } catch (err) {
    console.error(
      "getMyRoomDetail error:",
      err.response?.status,
      err.response?.data
    );
    throw err;
  }
};
