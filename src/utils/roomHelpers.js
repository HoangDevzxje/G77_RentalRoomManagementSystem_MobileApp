export const normalizeUri = (uri, IMAGE_BASE_URL = "") => {
  if (!uri || typeof uri !== "string") return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (IMAGE_BASE_URL)
    return IMAGE_BASE_URL.replace(/\/$/, "") + "/" + uri.replace(/^\//, "");
  return uri;
};

export const getElectricityDisplay = (electricity) => {
  if (!electricity) return "—";
  const { indexType, price } = electricity;
  switch (indexType) {
    case "byNumber":
      return price > 0
        ? `${Number(price).toLocaleString("vi-VN")} đ/kWh`
        : "Miễn phí";
    case "included":
      return "Đã bao gồm trong giá thuê";
    default:
      return "—";
  }
};

export const getWaterDisplay = (water) => {
  if (!water) return "—";
  const { indexType, price } = water;
  switch (indexType) {
    case "byNumber":
      return price > 0
        ? `${Number(price).toLocaleString("vi-VN")} đ/m³`
        : "Miễn phí";
    case "byPerson":
      return price > 0
        ? `${Number(price).toLocaleString("vi-VN")} đ/người`
        : "Miễn phí";
    case "included":
      return "Đã bao gồm trong giá thuê";
    default:
      return "—";
  }
};

export const getElectricityDescription = (electricity) => {
  if (!electricity) return "";
  switch (electricity.indexType) {
    case "byNumber":
      return `Chỉ số đầu: ${electricity.startIndex || 0}`;
    case "included":
      return "Đã bao gồm trong tiền thuê";
    default:
      return "";
  }
};

export const getWaterDescription = (water) => {
  if (!water) return "";
  switch (water.indexType) {
    case "byNumber":
      return `Chỉ số đầu: ${water.startIndex || 0}`;
    case "byPerson":
      return "Tính theo số người";
    case "included":
      return "Đã bao gồm trong tiền thuê";
    default:
      return "";
  }
};

export const getServiceIcon = (serviceName) => {
  const icons = {
    internet: "wifi",
    parking: "car-sport",
    cleaning: "brush",
    security: "shield-checkmark",
    other: "ellipsis-horizontal",
  };
  return icons[serviceName] || "cube";
};

export const getServiceColor = (serviceName) => {
  const colors = {
    internet: "#3B82F6",
    parking: "#10B981",
    cleaning: "#8B5CF6",
    security: "#EF4444",
    other: "#6B7280",
  };
  return colors[serviceName] || "#6B7280";
};

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "—";
  }
};

export const getContractStatusText = (status) => {
  switch (status) {
    case "active":
      return "Đang ở";
    case "upcoming":
      return "Sắp đến";
    default:
      return "—";
  }
};

export const getContractStatusColor = (status) => {
  switch (status) {
    case "active":
      return "#10B981";
    case "upcoming":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};
