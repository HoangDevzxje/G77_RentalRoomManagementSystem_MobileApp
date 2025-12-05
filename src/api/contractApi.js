import baseApi from "./baseApi";

export const getMyContracts = async ({ status, page = 1, limit = 20 } = {}) => {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await baseApi.get("/contracts", { params });
  return res.data;
};

export const getMyContract = async (id) => {
  const res = await baseApi.get(`/contracts/${id}`);
  return res.data;
};

export const updateMyData = async (id, payload) => {
  const res = await baseApi.patch(`/contracts/${id}`, payload);
  return res.data;
};

export const signByTenant = async (id, signatureUrl) => {
  const res = await baseApi.post(`/contracts/${id}/sign`, { signatureUrl });
  return res.data;
};

export const requestExtend = async (id, months, note = "") => {
  const res = await baseApi.post(`/contracts/${id}/request-extend`, {
    months,
    note,
  });
  return res.data;
};

export const listUpcomingExpire = async ({
  days = 30,
  page = 1,
  limit = 20,
} = {}) => {
  const params = { days, page, limit };
  const res = await baseApi.get("/contracts/upcoming-expire", { params });
  return res.data;
};

export const searchAccountByEmail = async (email) => {
  const res = await baseApi.get("/contracts/accounts/search-by-email", {
    params: { email },
  });
  return res.data;
};

export const requestTerminate = async (id, reason, note = "") => {
  const res = await baseApi.patch(`/contracts/${id}/request-terminate`, {
    reason,
    note,
  });
  return res.data;
};

export const downloadContractPdf = async (id) => {
  // Logic download này đặc thù nên giữ nguyên xử lý Blob
  try {
    const res = await baseApi.get(`/contracts/${id}/download`, {
      responseType: "blob",
    });

    // Xử lý tạo link download trên web (hoặc react native web)
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;

    const contentDisposition = res.headers["content-disposition"];
    let fileName = `Hop_dong_${id}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/i);
      if (match?.[1]) fileName = match[1];
    }

    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (err) {
    let msg = "Không thể tải file hợp đồng";
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        msg = JSON.parse(text).message || msg;
      } catch {}
    }
    throw new Error(msg);
  }
};
