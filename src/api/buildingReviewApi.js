import baseApi from "./baseApi";

/**
 * Gửi đánh giá tòa nhà (hỗ trợ upload ảnh từ React Native)
 * images: array of { uri, name?, type? }
 */
export const submitBuildingReview = async (data) => {
  try {
    const {
      buildingId,
      rating,
      comment = "",
      isAnonymous = false,
      images = [],
    } = data;

    const finalBuildingId =
      typeof buildingId === "object"
        ? buildingId._id ?? buildingId.id ?? buildingId.buildingId
        : buildingId;

    const formData = new FormData();

    formData.append("buildingId", String(finalBuildingId));
    formData.append("rating", String(rating));
    formData.append("comment", comment?.trim?.() ?? "");
    formData.append("isAnonymous", String(Boolean(isAnonymous)));

    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((file, idx) => {
        if (!file) return;

        let uri = typeof file === "string" ? file : file.uri || file.path || "";
        if (!uri) return;

        if (uri.startsWith("ph://")) {
          uri = uri.replace("ph://", "assets-library://");
        } else if (uri.startsWith("/") && !uri.startsWith("file://")) {
          uri = `file://${uri}`;
        }

        const filename =
          (typeof file === "object" && (file.name || file.filename)) ||
          `photo_${Date.now()}_${idx}.jpg`;

        const filetype =
          (typeof file === "object" && (file.type || file.mime)) ||
          "image/jpeg";

        formData.append("images", { uri, name: filename, type: filetype });
      });
    }

    const res = await baseApi.post("/ratings", formData, {
      headers: { Accept: "application/json" },
      timeout: 30000,
    });

    return res.data;
  } catch (err) {
    const errorMsg =
      err?.response?.data?.message || err?.message || "Gửi đánh giá thất bại";
    throw new Error(errorMsg);
  }
};

export const fetchBuildingReviews = async (
  buildingId,
  { page = 1, limit = 20 } = {}
) => {
  try {
    const finalBuildingId =
      typeof buildingId === "object"
        ? buildingId._id ?? buildingId.id ?? buildingId.buildingId
        : buildingId;

    const res = await baseApi.get(`/ratings/${finalBuildingId}`, {
      params: { page, limit },
    });

    const data = res.data;

    return {
      buildingId: data?.data?.buildingId ?? finalBuildingId,
      summary: data?.data?.summary ?? null,
      ratings: data?.data?.ratings ?? [],
    };
  } catch (err) {
    throw err;
  }
};

export const removeMyReview = async (reviewId) => {
  try {
    const res = await baseApi.delete(`/ratings/${reviewId}`);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export default {
  submitBuildingReview,
  fetchBuildingReviews,
  removeMyReview,
};
