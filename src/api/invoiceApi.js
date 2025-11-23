import baseApi from "./baseApi";

export const getMyInvoices = async ({
  status,
  buildingId,
  roomId,
  periodMonth,
  periodYear,
  search,
  page = 1,
  limit = 20,
} = {}) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    if (buildingId) params.buildingId = buildingId;
    if (roomId) params.roomId = roomId;
    if (periodMonth) params.periodMonth = periodMonth;
    if (periodYear) params.periodYear = periodYear;
    if (search) params.search = search;

    const res = await baseApi.get("/invoices", { params });
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getMyInvoiceDetail = async (id) => {
  try {
    const res = await baseApi.get(`/invoices/${id}`);
    return res.data;
  } catch (err) {
    console.error(
      "getMyInvoiceDetail error response:",
      err.response?.status,
      err.response?.data
    );
    throw err;
  }
};

export const payInvoice = async (id, { method, note } = {}) => {
  try {
    const res = await baseApi.post(`/invoices/${id}/pay`, {
      method,
      note,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};
