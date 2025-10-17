import baseApi from "./baseApi";

export const getBuildings = async () => {
  const res = await baseApi.get("/buildings");
  return res.data.data;
};

export const getBuildingById = async (id) => {
  const res = await baseApi.get(`/buildings/${id}`);
  return res.data;
};
