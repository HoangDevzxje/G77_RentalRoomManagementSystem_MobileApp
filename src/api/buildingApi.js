import baseApi from "./baseApi";

export const getBuildingLaundryDevices = async (buildingId, filters = {}) => {
  if (!buildingId) throw new Error("Missing building id");
  try {
    const params = new URLSearchParams();

    if (filters.floorId) params.append("floorId", filters.floorId);
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await baseApi.get(
      `/landlords/buildings/${buildingId}/laundry-devices${queryString}`
    );

    const data = res.data || {};

    return {
      buildingId: data.buildingId || buildingId,
      total: data.total || 0,
      data: data.data || [],
    };
  } catch (err) {
    console.error(
      "getBuildingLaundryDevices error:",
      err?.response?.data ?? err.message
    );
    throw err;
  }
};
