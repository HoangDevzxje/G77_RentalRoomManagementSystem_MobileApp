import baseApi from "./baseApi";

export const getBuildingById = async (id) => {
  if (!id) throw new Error("Missing building id");
  try {
    const res = await baseApi.get(`/buildings/${id}`);
    const payload = res?.data ?? res;
    if (payload.data && payload.data.building) return payload.data.building;
    if (payload.building) return payload.building;
    return payload;
  } catch (err) {
    console.error("getBuildingById error:", err?.response?.data ?? err.message);
    throw err;
  }
};

export default { getBuildingById };
