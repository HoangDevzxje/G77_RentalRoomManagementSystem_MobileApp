export const computeDaysLeft = (endDate) => {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

export const getContractStatus = (contractData) => {
  if (!contractData) return { type: "unknown", text: "Không xác định" };
  const status = contractData.status;
  const startDate = contractData.contract?.startDate;
  const endDate = contractData.contract?.endDate;
  const now = new Date();

  switch (status) {
    case "draft":
      return { type: "draft", text: "Bản nháp" };
    case "sent_to_tenant":
      return { type: "pending", text: "Chờ ký" };
    case "signed_by_tenant":
      return { type: "pending", text: "Đã ký - Chờ chủ" };
    case "signed_by_landlord":
      return { type: "pending", text: "Đã ký - Chờ người thuê" };
    case "completed":
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (now < start) {
          return { type: "pending", text: "Sắp bắt đầu" };
        } else if (now > end) {
          return { type: "expired", text: "Đã hết hạn" };
        } else {
          return { type: "active", text: "Hoàn thành" };
        }
      }
      return { type: "active", text: "Hoàn thành" };
    case "voided":
      return { type: "voided", text: "Đã huỷ" };
    case "terminated":
      return { type: "terminated", text: "Đã chấm dứt" };
    default:
      return { type: "unknown", text: "Không xác định" };
  }
};

export const getStatusInfo = (status) => {
  switch (status.type) {
    case "draft":
      return { color: "#6b7280", text: status.text, bgColor: "#f3f4f6" };
    case "pending":
      return { color: "#f59e0b", text: status.text, bgColor: "#fef3c7" };
    case "active":
      return { color: "#10b981", text: status.text, bgColor: "#d1fae5" };
    case "expired":
      return { color: "#6b7280", text: status.text, bgColor: "#f3f4f6" };
    case "voided":
      return { color: "#ef4444", text: status.text, bgColor: "#fee2e2" };
    case "terminated":
      return { color: "#dc2626", text: status.text, bgColor: "#fef2f2" };
    default:
      return { color: "#6b7280", text: status.text, bgColor: "#f3f4f6" };
  }
};

export const computeStatusFromDates = (contractData) => {
  if (!contractData) return { type: "unknown", text: "Không xác định" };
  const startDate = contractData.contract?.startDate;
  const endDate = contractData.contract?.endDate;
  const now = new Date();
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) {
      return { type: "pending", text: "Hợp đồng sắp bắt đầu" };
    } else if (now > end) {
      return { type: "expired", text: "Hợp đồng đã hết hạn" };
    } else {
      return { type: "active", text: "Hợp đồng đang có hiệu lực" };
    }
  }
  return { type: "unknown", text: "Không xác định" };
};

export const getUrgencyLevel = (daysLeft) => {
  if (daysLeft === null)
    return { color: "#6b7280", label: "Không có ngày", bgColor: "#f3f4f6" };
  if (daysLeft <= 7)
    return { color: "#ef4444", label: "Sắp hết hạn", bgColor: "#fef2f2" };
  if (daysLeft <= 30)
    return { color: "#f59e0b", label: "Sắp đến hạn", bgColor: "#fffbeb" };
  if (daysLeft <= 60)
    return { color: "#10b981", label: "Còn thời gian", bgColor: "#f0fdf4" };
  return { color: "#6b7280", label: "Còn lâu", bgColor: "#f3f4f6" };
};
