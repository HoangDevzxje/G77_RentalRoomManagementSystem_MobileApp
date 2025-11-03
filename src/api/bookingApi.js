import baseApi from "./baseApi";

export const getAvailableSlots = async (buildingId, startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await baseApi.get(`/bookings/available-slots/${buildingId}`, {
    params,
  });

  const days = res.data.availableDays || [];

  const slots = days.flatMap((day) =>
    (day.slots || []).map((slot) => ({
      date: day.date,
      timeSlot: `${slot.startTime}-${slot.endTime}`,
      availableSlots: 1,
      note: day.note || "",
    }))
  );

  return slots;
};

export const createBooking = async (bookingData) => {
  const {
    postId,
    buildingId,
    date,
    timeSlot,
    tenantNote = "",
    contactName,
    contactPhone,
  } = bookingData;

  const finalBuildingId =
    typeof buildingId === "object" ? buildingId._id : buildingId;

  const payload = {
    postId,
    buildingId: finalBuildingId,
    date,
    timeSlot: timeSlot?.trim(),
    tenantNote,
    contactName,
    contactPhone,
  };

  const res = await baseApi.post("/bookings", payload);
  return res.data;
};

export const getMyBookings = async () => {
  const res = await baseApi.get("/bookings/my");
  return res.data;
};

export const cancelBooking = async (bookingId) => {
  const res = await baseApi.patch(`/bookings/cancel/${bookingId}`);
  return res.data;
};
