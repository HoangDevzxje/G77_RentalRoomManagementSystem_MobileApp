import baseApi from "./baseApi";

const unwrap = (res) => {
  if (res === null || res === undefined) return null;
  if (res.data !== undefined) return res.data;
  return res;
};

export const getMyRoomDetail = async () => {
  try {
    const res = await baseApi.get("/rooms/my-room");
    const payload = unwrap(res);
    const data = payload?.data ?? payload;

    if (data && (data.room !== undefined || data.furnitures !== undefined)) {
      const room = data.room ?? null;
      const furnitures = Array.isArray(data.furnitures)
        ? data.furnitures
        : data.room && Array.isArray(data.room.furnitures)
        ? data.room.furnitures
        : [];
      return { room, furnitures };
    }

    if (data && typeof data === "object") {
      const looksLikeRoom =
        data._id ||
        data.id ||
        data.roomNumber ||
        data.tenants ||
        data.currentTenantIds;
      if (looksLikeRoom) {
        return { room: data, furnitures: [] };
      }
    }
    return { room: null, furnitures: [] };
  } catch (err) {
    throw err;
  }
};

export default { getMyRoomDetail };
