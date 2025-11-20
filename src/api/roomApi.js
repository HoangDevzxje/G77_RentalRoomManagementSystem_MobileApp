import baseApi from "./baseApi";

const normalizeResponse = (res) => {
  if (!res) return null;
  const maybeAxios = res?.data !== undefined ? res : { data: res };
  const d = maybeAxios.data;
  const inner = d?.data ?? d;
  const payload = inner?.room ?? inner;

  return payload;
};

const normalizeRoommatesPayload = (payload) => {
  if (!payload) return { roommates: [] };

  // tìm nơi chứa danh sách roommates ở nhiều kiểu trả về khác nhau
  const roommatesCandidates = [
    payload.roommates,
    payload.data?.roommates,
    payload.contractRoommates,
    payload.currentContract?.roommates,
  ];

  let roommates = roommatesCandidates.find((c) => Array.isArray(c)) || [];

  if (
    (!roommates || roommates.length === 0) &&
    Array.isArray(payload.currentTenantIds)
  ) {
    roommates = payload.currentTenantIds.map((t) => ({
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
    }));
  }

  const normalized = {
    roomNumber:
      payload.roomNumber ??
      payload.room?.roomNumber ??
      payload.id ??
      payload._id ??
      null,
    maxTenants: payload.maxTenants ?? payload.room?.maxTenants ?? null,
    currentCount:
      payload.currentCount ??
      (Array.isArray(roommates) ? roommates.length : null) ??
      null,
    canAddMore:
      payload.canAddMore ??
      (payload.maxTenants && payload.currentCount
        ? payload.currentCount < payload.maxTenants
        : undefined),
    isMainTenant: payload.isMainTenant ?? payload.isMainTenant ?? false,
    roommates: roommates || [],
    __raw: payload,
  };

  return normalized;
};

export const getMyRoomDetail = async () => {
  try {
    const res = await baseApi.get("/rooms/my-room");
    const payload = normalizeResponse(res);
    return payload ?? {};
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
        id = payload?.id ?? payload?._id ?? payload?.roomNumber ?? null;
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
