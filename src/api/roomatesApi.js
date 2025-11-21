import baseApi from "./baseApi";

const normalizeResponse = (res) => {
  if (res === null || res === undefined) return null;

  const maybeAxios = res?.data !== undefined ? res : { data: res };
  let d = maybeAxios.data;

  if (d && d.data !== undefined) d = d.data;

  if (d && d.success === true && d.data !== undefined) d = d.data;

  return d ?? maybeAxios;
};

const normalizeRoommatesPayload = (payload) => {
  if (!payload) return { roommates: [] };

  const data = payload.data ?? payload;

  const roommatesCandidates = [
    data.roommates,
    data.data?.roommates,
    data.contractRoommates,
    data.currentContract?.roommates,
    data.tenants,
  ];
  let roommates = roommatesCandidates.find((c) => Array.isArray(c)) || [];

  if (
    (!roommates || roommates.length === 0) &&
    Array.isArray(data.currentTenantIds)
  ) {
    roommates = data.currentTenantIds.map((t) => {
      if (typeof t === "string" || typeof t === "number") return { _id: t };
      return {
        _id: t._id ?? t.id ?? null,
        email: t.email ?? null,
        fullName:
          t.userInfo?.fullName ||
          `${t.first_name || ""} ${t.last_name || ""}`.trim() ||
          t.fullName ||
          null,
        phoneNumber: t.userInfo?.phoneNumber ?? t.phoneNumber ?? null,
        isMainTenant: t.isMainTenant ?? false,
        isMe: t.isMe ?? false,
      };
    });
  }

  const normalized = {
    roomNumber:
      data.roomNumber ?? data.room?.roomNumber ?? data.id ?? data._id ?? null,
    maxTenants: data.maxTenants ?? data.room?.maxTenants ?? null,
    currentCount:
      data.currentCount ??
      (Array.isArray(roommates) ? roommates.length : null) ??
      null,
    canAddMore:
      data.canAddMore ??
      (typeof data.maxTenants === "number" &&
      typeof data.currentCount === "number"
        ? data.currentCount < data.maxTenants
        : undefined),
    isMainTenant: data.isMainTenant ?? false,
    roommates: roommates || [],
    __raw: payload,
  };

  return normalized;
};

export const getMyRoomDetail = async () => {
  try {
    const res = await baseApi.get("/rooms/my-room");
    const payload = normalizeResponse(res);
    if (
      payload &&
      (payload.room !== undefined || payload.furnitures !== undefined)
    ) {
      const room = payload.room ?? null;
      const furnitures = Array.isArray(payload.furnitures)
        ? payload.furnitures
        : payload.furnitures === undefined &&
          Array.isArray(payload.room?.furnitures)
        ? payload.room.furnitures
        : [];
      return { room, furnitures };
    }

    if (payload && typeof payload === "object") {
      const maybeRoom =
        payload._id ||
        payload.id ||
        payload.roomNumber ||
        payload.tenants ||
        payload.currentTenantIds
          ? payload
          : null;
      if (maybeRoom) return { room: maybeRoom, furnitures: [] };
    }

    return { room: null, furnitures: [] };
  } catch (err) {
    console.error(
      "getMyRoomDetail error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const getMyRoommates = async (roomId) => {
  try {
    let id = roomId;
    if (!id) {
      try {
        const myRoomResp = await baseApi.get("/rooms/my-room");
        const payload = normalizeResponse(myRoomResp);
        const room = payload?.room ?? payload;
        id = room?.id ?? room?._id ?? room?.roomNumber ?? null;
      } catch (innerErr) {
        console.warn(
          "getMyRoommates: couldn't resolve roomId from /rooms/my-room:",
          innerErr?.message || innerErr
        );
      }
    }

    if (!id) {
      throw new Error(
        "roomId is required for getMyRoommates (cannot determine from /rooms/my-room)"
      );
    }

    const res = await baseApi.get(`/roommates/${id}`);
    const payload = normalizeResponse(res);
    const normalized = normalizeRoommatesPayload(payload);
    return normalized;
  } catch (err) {
    console.error(
      "getMyRoommates error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const addRoommate = async (roomId, userIds) => {
  try {
    const res = await baseApi.post("/roommates/add", { roomId, userIds });
    const payload = normalizeResponse(res);
    return payload ?? res?.data ?? res;
  } catch (err) {
    console.error(
      "addRoommate error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const removeRoommate = async (roomId, userIds) => {
  try {
    const res = await baseApi.post("/roommates/remove", { roomId, userIds });
    const payload = normalizeResponse(res);
    return payload ?? res?.data ?? res;
  } catch (err) {
    console.error(
      "removeRoommate error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const searchUser = async (q) => {
  if (!q || q.trim().length < 2) {
    throw new Error("Query must be at least 2 characters");
  }
  try {
    const res = await baseApi.get("/roommates/search", {
      params: { q: q.trim() },
    });
    const payload = normalizeResponse(res);
    if (Array.isArray(payload)) return payload;
    if (payload && payload.data && Array.isArray(payload.data))
      return payload.data;
    return payload ?? res?.data ?? res;
  } catch (err) {
    console.error(
      "searchUser error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const getRoommateDetail = async (userId) => {
  if (!userId) throw new Error("userId is required");
  try {
    const res = await baseApi.get(`/roommates/${userId}/detail`);
    const payload = normalizeResponse(res);
    if (payload && payload._id) return payload;
    if (payload && payload.data) return payload.data;
    return payload ?? res?.data ?? res;
  } catch (err) {
    console.error(
      "getRoommateDetail error:",
      err?.response?.status,
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const __testable = { normalizeResponse, normalizeRoommatesPayload };
