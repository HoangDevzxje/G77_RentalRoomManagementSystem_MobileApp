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

export const downloadContractPdf = async (id) => {
  try {
    const res = await baseApi.get(`/contracts/${id}/download`, {
      responseType: "blob",
    });

    // Tạo URL tạm và trigger download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;

    // Tên file đẹp (có thể lấy từ header hoặc để mặc định)
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
    if (err.response?.data instanceof Blob) {
      const text = await err.response.data.text();
      let errorMessage = "Đã có lỗi xảy ra khi tải PDF";
      try {
        const json = JSON.parse(text);
        errorMessage = json.message || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const msg =
      err.response?.data?.message ||
      err.message ||
      "Không thể tải file hợp đồng";
    throw new Error(msg);
  }
};
export const requestTerminate = async (id, reason, note = "") => {
  try {
    const res = await baseApi.patch(`/contracts/${id}/request-terminate`, {
      reason,
      note,
    });
    return res.data;
  } catch (err) {
    throw err;
  }
};
