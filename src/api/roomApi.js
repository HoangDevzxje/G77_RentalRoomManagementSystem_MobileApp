import baseApi from "./baseApi";

export const getMyRoomDetail = async (roomId = null) => {
  try {
    const res = await baseApi.get("/rooms/my-room", {
      params: roomId ? { roomId } : {},
    });
    if (res.data?.success) {
      return {
        success: true,
        data: res.data.data,
        message: res.data.message,
      };
    }

    return {
      success: false,
      data: null,
      message: res.data?.message || "Không thể lấy thông tin chi tiết phòng",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: err.response?.data?.message || "Lỗi kết nối hệ thống",
    };
  }
};

export const getMyRoomsList = async () => {
  try {
    const res = await baseApi.get("/rooms/my-rooms");
    if (res.data?.success) {
      return {
        success: true,
        data: res.data.data,
        message: res.data.message,
      };
    }

    return {
      success: false,
      data: null,
      message: res.data?.message || "Không thể lấy danh sách phòng",
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      message: err.response?.data?.message || "Lỗi kết nối hệ thống",
    };
  }
};

export default {
  getMyRoomDetail,
  getMyRoomsList,
};
