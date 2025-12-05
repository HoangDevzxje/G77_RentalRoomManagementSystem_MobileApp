import baseApi from "./baseApi";
import { getAccessToken } from "../utils/storage";

// Helper để lấy data từ response axios hoặc fetch
const normalizeResponse = (res) => {
  if (!res) return null;
  // Trường hợp Axios (dữ liệu nằm trong res.data)
  if (res.data !== undefined) return res.data;
  // Trường hợp fetch hoặc object data thuần
  return res;
};

// Helper xử lý URI ảnh trên iOS/Android
const normalizeFileUri = (uri) => {
  if (!uri || typeof uri !== "string") return uri;
  if (uri.startsWith("ph://")) return uri.replace("ph://", "assets-library://");
  if (uri.startsWith("/")) {
    if (!uri.startsWith("file://")) return `file://${uri}`;
  }
  return uri;
};

// 1. Tạo yêu cầu bảo trì (Multipart)
export const createRequest = async (payload = {}, tokenOverride = null) => {
  const p = { ...payload };
  // Lọc bỏ các ảnh null/undefined
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

  // Lấy Base URL từ cấu hình axios (baseApi) để đồng bộ
  const baseUrl =
    (baseApi && baseApi.defaults && baseApi.defaults.baseURL) || "";
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/maintenance`
    : "/maintenance";

  const resolveToken = async () => {
    if (tokenOverride) return tokenOverride;
    try {
      const t = await getAccessToken();
      return t || null;
    } catch (e) {
      return null;
    }
  };

  // Sử dụng FormData
  const formData = new FormData();

  // --- Mapping dữ liệu theo Controller BE ---
  if (p.roomId) formData.append("roomId", String(p.roomId));
  if (p.category) formData.append("category", String(p.category));
  if (p.title) formData.append("title", String(p.title));

  // Description là tùy chọn
  if (p.description) formData.append("description", String(p.description));

  // FurnitureId: Chỉ gửi khi category = "furniture" (như BE check)
  if (p.category === "furniture" && p.furnitureId) {
    formData.append("furnitureId", String(p.furnitureId));
  }

  // Affected Quantity: Default là 1
  if (p.affectedQuantity) {
    formData.append("affectedQuantity", String(p.affectedQuantity));
  }

  // Xử lý ảnh (Upload Multiple)
  if (images.length > 0) {
    images.forEach((f, idx) => {
      let uri = typeof f === "string" ? f : f.uri || f.path || "";
      if (!uri) return;

      uri = normalizeFileUri(uri);

      const name =
        (typeof f === "object" && (f.name || f.filename)) ||
        uri.split("/").pop() ||
        `photo_${Date.now()}_${idx}.jpg`;

      const type =
        (typeof f === "object" && (f.type || f.mime)) || "image/jpeg";

      // Key là "images" khớp với BE (uploadMultiple middleware thường dùng array('images'))
      formData.append("images", {
        uri,
        name,
        type,
      });
    });
  }

  const token = await resolveToken();

  const headers = {
    Accept: "application/json",
    // LƯU Ý QUAN TRỌNG: Không set 'Content-Type': 'multipart/form-data' thủ công ở đây.
    // Fetch sẽ tự động set kèm boundary chính xác. Nếu set thủ công sẽ lỗi BE không đọc được file.
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    const err = new Error(body?.message || `Upload failed: ${res.status}`);
    err.response = { data: body, status: res.status };
    throw err;
  }

  const json = await res.json().catch(() => null);
  return normalizeResponse({ data: json });
};

// 2. Lấy chi tiết yêu cầu
export const getRequest = async (id) => {
  if (!id) throw new Error("id required");
  const res = await baseApi.get(`/maintenance/${id}`);
  return normalizeResponse(res);
};

// 3. Lấy danh sách yêu cầu của phòng (Có filter status, category...)
export const listMyRoomRequests = async (params = {}) => {
  // Params: status, category, page, limit, sort
  const res = await baseApi.get("/maintenance/my-room", { params });
  return normalizeResponse(res);
};

// 4. Thêm bình luận (POST)
export const addComment = async (id, note) => {
  const res = await baseApi.post(`/maintenance/${id}/comment`, { note });
  return normalizeResponse(res);
};

// 5. Cập nhật bình luận (PUT) - Mới thêm cho khớp BE
export const updateComment = async (id, commentId, note) => {
  const res = await baseApi.put(`/maintenance/${id}/comment/${commentId}`, {
    note,
  });
  return normalizeResponse(res);
};

// 6. Xóa bình luận (DELETE) - Mới thêm cho khớp BE
export const deleteComment = async (id, commentId) => {
  const res = await baseApi.delete(`/maintenance/${id}/comment/${commentId}`);
  return normalizeResponse(res);
};

// Export mặc định
export default {
  createRequest,
  getRequest,
  listMyRoomRequests,
  addComment,
  commentRequest: addComment,
  updateComment,
  deleteComment,
};
