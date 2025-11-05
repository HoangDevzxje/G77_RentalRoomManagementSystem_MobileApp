import baseApi from "./baseApi";

export const createContact = async (contactData) => {
  const {
    buildingId,
    postId = null,
    roomId,
    contactName,
    contactPhone,
    tenantNote = "",
  } = contactData;

  const finalBuildingId =
    typeof buildingId === "object" ? buildingId._id : buildingId;

  const payload = {
    buildingId: finalBuildingId,
    postId,
    roomId,
    contactName: contactName?.trim(),
    contactPhone: contactPhone?.trim(),
    tenantNote: tenantNote?.trim(),
  };

  const res = await baseApi.post("/contacts", payload);
  return res.data;
};

export const getMyContacts = async ({ status, page = 1, limit = 10 } = {}) => {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await baseApi.get("/contacts", { params });
  return res.data;
};

export const cancelBooking = async (bookingId) => {
  try {
    const res = await baseApi.patch(`/bookings/cancel/${bookingId}`);
    return res.data;
  } catch (error) {
    if (error.response) throw error;
    else throw new Error("Lỗi kết nối mạng");
  }
};
