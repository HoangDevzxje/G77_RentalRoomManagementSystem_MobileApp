// api/maintenanceApi.js
import baseApi from "./baseApi";

const normalizeResponse = (res) => {
  if (!res) return null;
  const maybeAxios = res?.data !== undefined ? res : { data: res };
  const d = maybeAxios.data;
  if (d && typeof d === "object") {
    const hasEnvelopeKeys =
      "data" in d || "total" in d || "pages" in d || "room" in d;
    if (hasEnvelopeKeys) {
      return d;
    }
    if (d.data !== undefined) {
      return d.data;
    }
  }
  return d ?? maybeAxios;
};

/**
 * Helper: ensure RN file uri is acceptable for upload
 * - convert ph:// -> assets-library://
 * - ensure file:// prefix for bare paths
 */
const normalizeFileUri = (uri) => {
  if (!uri || typeof uri !== "string") return uri;
  if (uri.startsWith("ph://")) {
    return uri.replace("ph://", "assets-library://");
  }
  if (uri.startsWith("/")) {
    // local path -> file://
    if (!uri.startsWith("file://")) return `file://${uri}`;
  }
  return uri;
};

/**
 * createRequest
 * - payload: plain object can include:
 *    roomId, furnitureId, title, description, priority, affectedQuantity,
 *    photos (array of {url}) and/or images (array of {uri, name?, type?})
 *
 * If images present (array with uri), we convert to FormData and upload as multipart/form-data.
 * Otherwise send JSON.
 */
export const createRequest = async (payload = {}) => {
  try {
    // defensive copy
    const p = { ...payload };

    // if images array present and non-empty -> use FormData upload
    const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

    if (images.length > 0) {
      const formData = new FormData();

      // append simple fields
      // convert photos to JSON string if provided (array of {url})
      const simpleFields = [
        "roomId",
        "furnitureId",
        "title",
        "description",
        "priority",
      ];

      simpleFields.forEach((key) => {
        if (p[key] !== undefined && p[key] !== null) {
          formData.append(key, String(p[key]));
        }
      });

      // numeric field
      if (p.affectedQuantity !== undefined && p.affectedQuantity !== null) {
        formData.append("affectedQuantity", String(p.affectedQuantity));
      }

      // photos (URLs) -> send as JSON string so backend can parse
      if (Array.isArray(p.photos) && p.photos.length > 0) {
        try {
          formData.append("photos", JSON.stringify(p.photos));
        } catch {
          // fallback: join by comma
          formData.append(
            "photos",
            JSON.stringify(p.photos.map((it) => (it.url ? it.url : it)))
          );
        }
      }

      // images: append each as file. Backend should accept field name 'images'
      images.forEach((file, idx) => {
        // expected shapes:
        //  - { uri, name?, type? }
        //  - plain uri string
        let uri = typeof file === "string" ? file : file.uri || file.path || "";
        if (!uri) return;

        uri = normalizeFileUri(uri);

        const filename =
          (typeof file === "object" && (file.name || file.filename)) ||
          uri.split("/").pop() ||
          `photo_${Date.now()}_${idx}.jpg`;

        const filetype =
          (typeof file === "object" && (file.type || file.mime)) ||
          "image/jpeg";

        // RN FormData expects an object: { uri, name, type }
        try {
          formData.append("images", {
            uri,
            name: filename,
            type: filetype,
          });
        } catch (e) {
          // fallback: try append as blob-ish (some envs)
          formData.append("images", {
            uri,
            name: filename,
            type: filetype,
          });
        }
      });

      // send multipart/form-data - do NOT set boundary, let axios handle it
      const res = await baseApi.post("/residents/maintenance", formData, {
        headers: {
          Accept: "application/json",
          // 'Content-Type' intentionally omitted so axios sets with proper boundary
        },
        timeout: 60000,
      });

      return normalizeResponse(res);
    }

    // else: no images, normal JSON post
    const res = await baseApi.post("/residents/maintenance", p);
    return normalizeResponse(res);
  } catch (err) {
    // provide better debug to console but throw original error for caller to show message
    console.error(
      "createRequest error:",
      err?.response?.data ?? err?.message ?? err
    );
    throw err;
  }
};

export const getRequest = async (id) => {
  if (!id) throw new Error("id required");
  try {
    const res = await baseApi.get(`/residents/maintenance/${id}`);
    return normalizeResponse(res);
  } catch (err) {
    console.error("getRequest error:", err?.response?.data || err?.message);
    throw err;
  }
};

export const listMyRoomRequests = async (params = {}) => {
  try {
    const res = await baseApi.get("/residents/maintenance/my-room", {
      params,
    });
    return normalizeResponse(res);
  } catch (err) {
    console.error(
      "listMyRoomRequests error:",
      err?.response?.data || err?.message
    );
    throw err;
  }
};

export const commentRequest = async (id, note) => {
  if (!id) throw new Error("id required");
  try {
    const res = await baseApi.post(`/residents/maintenance/${id}/comment`, {
      note,
    });
    return normalizeResponse(res);
  } catch (err) {
    console.error("commentRequest error:", err?.response?.data || err?.message);
    throw err;
  }
};

export default {
  createRequest,
  getRequest,
  listMyRoomRequests,
  commentRequest,
};
