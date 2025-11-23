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

export const downloadInvoicePdf = async (id) => {
  try {
    const res = await baseApi.get(`/invoices/${id}/download`, {
      responseType: "blob",
    });

    // Tạo URL tạm và trigger download
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;

    // Tên file đẹp (có thể lấy từ header hoặc để mặc định)
    const contentDisposition = res.headers["content-disposition"];
    let fileName = `Hoa_don_${id}.pdf`;
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
      "Không thể tải file hóa đơn";
    throw new Error(msg);
  }
};

export const getInvoiceStats = async () => {
  try {
    const res = await baseApi.get("/invoices/stats/summary");
    return res.data;
  } catch (err) {
    throw err;
  }
};
