import baseApi from "./baseApi";

export const getMyContracts = async ({ status, page = 1, limit = 20 } = {}) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await baseApi.get("/contracts", { params });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getMyContract = async (id) => {
  try {
    const res = await baseApi.get(`/contracts/${id}`);
    return res.data;
  } catch (err) {
    console.error(
      "getMyContract error response:",
      err.response?.status,
      err.response?.data
    );
    throw err;
  }
};

export const updateMyData = async (id, payload) => {
  try {
    const res = await baseApi.patch(`/contracts/${id}`, payload);
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const signByTenant = async (id, signatureUrl) => {
  try {
    const res = await baseApi.post(`/contracts/${id}/sign`, { signatureUrl });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const requestExtend = async (id, months, note = "") => {
  try {
    const res = await baseApi.post(`/contracts/${id}/request-extend`, {
      months,
      note,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const listUpcomingExpire = async ({
  days = 30,
  page = 1,
  limit = 20,
} = {}) => {
  try {
    const params = { days, page, limit };
    const res = await baseApi.get("/contracts/upcoming-expire", { params });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const searchAccountByEmail = async (email) => {
  try {
    const res = await baseApi.get("/contracts/accounts/search-by-email", {
      params: { email },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};
