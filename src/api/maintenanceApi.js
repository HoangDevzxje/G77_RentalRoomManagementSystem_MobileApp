import baseApi from "./baseApi";
import { getAccessToken } from "../utils/storage";

const normalizeResponse = (res) => {
  if (!res) return null;
  if (res?.data !== undefined) return res.data;
  return res;
};

const normalizeFileUri = (uri) => {
  if (!uri || typeof uri !== "string") return uri;
  if (uri.startsWith("ph://")) return uri.replace("ph://", "assets-library://");
  if (uri.startsWith("/")) {
    if (!uri.startsWith("file://")) return `file://${uri}`;
  }
  return uri;
};

export const createRequest = async (payload = {}, tokenOverride = null) => {
  const p = { ...payload };
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

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

  if (images.length > 0) {
    const formData = new FormData();

    ["roomId", "furnitureId", "title", "description", "priority"].forEach(
      (k) => {
        if (p[k] !== undefined && p[k] !== null)
          formData.append(k, String(p[k]));
      }
    );

    if (p.affectedQuantity !== undefined && p.affectedQuantity !== null) {
      formData.append("affectedQuantity", String(p.affectedQuantity));
    }

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

      formData.append("images", {
        uri,
        name,
        type,
      });
    });

    const token = await resolveToken();
    const headers = {
      Accept: "application/json",
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
  }

  try {
    const res = await baseApi.post("/maintenance", p);
    return normalizeResponse(res);
  } catch (err) {
    throw err;
  }
};

export const getRequest = async (id) => {
  if (!id) throw new Error("id required");
  const res = await baseApi.get(`/maintenance/${id}`);
  return normalizeResponse(res);
};

export const listMyRoomRequests = async (params = {}) => {
  const res = await baseApi.get("/maintenance/my-room", { params });
  return normalizeResponse(res);
};

export const commentRequest = async (id, note) => {
  const res = await baseApi.post(`/maintenance/${id}/comment`, { note });
  return normalizeResponse(res);
};

export default {
  createRequest,
  getRequest,
  listMyRoomRequests,
  commentRequest,
};
