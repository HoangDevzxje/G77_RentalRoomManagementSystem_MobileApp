import baseApi from "./baseApi";

const normalizeFileUri = (uri) => {
  if (!uri || typeof uri !== "string") return uri;
  if (uri.startsWith("ph://")) return uri.replace("ph://", "assets-library://");
  if (uri.startsWith("/") && !uri.startsWith("file://")) return `file://${uri}`;
  return uri;
};

export const createRequest = async (payload = {}) => {
  const p = { ...payload };
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

  const formData = new FormData();
  if (p.roomId) formData.append("roomId", String(p.roomId));
  if (p.category) formData.append("category", String(p.category));
  if (p.title) formData.append("title", String(p.title));
  if (p.description) formData.append("description", String(p.description));
  if (p.category === "furniture" && p.furnitureId)
    formData.append("furnitureId", String(p.furnitureId));
  if (p.affectedQuantity)
    formData.append("affectedQuantity", String(p.affectedQuantity));

  if (images.length > 0) {
    images.forEach((f, idx) => {
      let uri = typeof f === "string" ? f : f.uri || f.path || "";
      if (!uri) return;
      uri = normalizeFileUri(uri);
      const name =
        f.name ||
        f.filename ||
        uri.split("/").pop() ||
        `photo_${Date.now()}_${idx}.jpg`;
      const type = f.type || f.mime || "image/jpeg";
      formData.append("images", { uri, name, type });
    });
  }

  const res = await baseApi.post("/maintenance", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getRequest = async (id) => {
  const res = await baseApi.get(`/maintenance/${id}`);
  return res.data;
};

export const listMyRoomRequests = async (params = {}) => {
  const res = await baseApi.get("/maintenance/my-room", { params });
  return res.data;
};

export const addComment = async (id, note) => {
  const res = await baseApi.post(`/maintenance/${id}/comment`, { note });
  return res.data;
};

export const updateComment = async (id, commentId, note) => {
  const res = await baseApi.put(`/maintenance/${id}/comment/${commentId}`, {
    note,
  });
  return res.data;
};

export const deleteComment = async (id, commentId) => {
  const res = await baseApi.delete(`/maintenance/${id}/comment/${commentId}`);
  return res.data;
};

export default {
  createRequest,
  getRequest,
  listMyRoomRequests,
  addComment,
  updateComment,
  deleteComment,
};
