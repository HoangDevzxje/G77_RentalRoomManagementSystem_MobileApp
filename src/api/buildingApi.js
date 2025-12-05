import baseApi from "./baseApi";

export const getBuildingLaundryDevices = async (buildingId, filters = {}) => {
  if (!buildingId) throw new Error("Missing building id");

  const params = { ...filters };
  const res = await baseApi.get(
    `/landlords/buildings/${buildingId}/laundry-devices`,
    { params }
  );
  const data = res.data || {};

  return {
    buildingId: data.buildingId || buildingId,
    total: data.total || 0,
    data: data.data || [],
  };
};
