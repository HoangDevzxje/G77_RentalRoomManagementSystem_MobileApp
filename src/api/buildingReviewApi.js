import baseApi from "./baseApi";

export const submitBuildingReview = async (data) => {
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

  if (images?.length > 0) {
    images.forEach((file, idx) => {
      if (!file) return;
      let uri = typeof file === "string" ? file : file.uri || file.path || "";
      if (!uri) return;

      if (uri.startsWith("ph://"))
        uri = uri.replace("ph://", "assets-library://");
      else if (uri.startsWith("/") && !uri.startsWith("file://"))
        uri = `file://${uri}`;

      const name =
        file.name || file.filename || `photo_${Date.now()}_${idx}.jpg`;
      const type = file.type || file.mime || "image/jpeg";

      formData.append("images", { uri, name, type });
    });
  }

  const res = await baseApi.post("/ratings", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const fetchBuildingReviews = async (
  buildingId,
  { page = 1, limit = 20 } = {}
) => {
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
};

export const removeMyReview = async (reviewId) => {
  const res = await baseApi.delete(`/ratings/${reviewId}`);
  return res.data;
};

export default { submitBuildingReview, fetchBuildingReviews, removeMyReview };
