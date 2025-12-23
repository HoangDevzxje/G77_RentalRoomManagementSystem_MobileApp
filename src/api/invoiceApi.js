import baseApi from "./baseApi";

export const getMyInvoices = async (filters = {}) => {
  const {
    status,
    buildingId,
    roomId,
    periodMonth,
    periodYear,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const params = {
    page,
    limit,
    status,
    buildingId,
    roomId,
    periodMonth,
    periodYear,
    search,
  };
  Object.keys(params).forEach(
    (key) => params[key] === undefined && delete params[key]
  );

  const res = await baseApi.get("/invoices", { params });
  return res.data;
};

export const getMyInvoiceDetail = async (id) => {
  const res = await baseApi.get(`/invoices/${id}`);
  return res.data;
};

export const payInvoice = async (
  id,
  { method = "online_gateway", note } = {}
) => {
  const res = await baseApi.post(`/invoices/${id}/pay`, { method, note });
  return res.data;
};

export const confirmTransfer = async (id, formData) => {
  const res = await baseApi.post(
    `/invoices/${id}/request-transfer-confirmation`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data, headers) => {
        return data;
      },
    }
  );
  return res.data;
};
