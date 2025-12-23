import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAvailableSlots, createBooking } from "../../api/bookingApi";
import { getPostById } from "../../api/postApi";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

export default function BookingFormScreen({ route, navigation }) {
  const { postId, postData: initialPostData } = route.params;
  const [post, setPost] = useState(initialPostData || null);
  const [loading, setLoading] = useState(!initialPostData);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [tenantNote, setTenantNote] = useState("");

  const [isFormReady, setIsFormReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const ready =
      selectedDate &&
      selectedTimeSlot &&
      contactName.trim() &&
      contactPhone.trim() &&
      tenantNote.trim();
    setIsFormReady(!!ready);
  }, [selectedDate, selectedTimeSlot, contactName, contactPhone, tenantNote]);

  const getDateRange = () => {
    const today = new Date();
    const next = new Date();
    next.setDate(today.getDate() + 30);
    return {
      startDate: today.toISOString().split("T")[0],
      endDate: next.toISOString().split("T")[0],
    };
  };

  const fetchSlots = async (buildingId) => {
    if (!buildingId) return;
    setLoadingSlots(true);
    try {
      const { startDate, endDate } = getDateRange();
      const slots = await getAvailableSlots(buildingId, startDate, endDate);
      setAvailableSlots(slots);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không tải được lịch trống",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!initialPostData && postId) {
        const loadPost = async () => {
          try {
            setLoading(true);
            const data = await getPostById(postId);
            setPost(data);
            fetchSlots(data.buildingId?._id || data.buildingId);
          } catch (e) {
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: "Không tải được bài đăng",
            });
            navigation.goBack();
          } finally {
            setLoading(false);
          }
        };
        loadPost();
      }
    }, [postId, initialPostData, navigation])
  );

  useEffect(() => {
    if (initialPostData) {
      setPost(initialPostData);
      fetchSlots(initialPostData.buildingId?._id || initialPostData.buildingId);
      setLoading(false);
    }
  }, [initialPostData]);

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      calendar.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;
  };

  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const slotsByDate = availableSlots.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});

  const isDateAvailable = (date) => {
    const dateStr = formatDateToString(date);
    return slotsByDate[dateStr] && slotsByDate[dateStr].length > 0;
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    const dateStr = formatDateToString(date);
    return dateStr === selectedDate;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const generateTimeOptions = (slots) => {
    const timeOptions = [];

    slots.forEach((slot) => {
      const [startTime, endTime] = slot.timeSlot.split("-");
      const [startHour] = startTime.split(":").map(Number);
      const [endHour] = endTime.split(":").map(Number);

      for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${String(hour).padStart(2, "0")}:00`;
        timeOptions.push(timeStr);
      }
    });

    return [...new Set(timeOptions)].sort();
  };

  const handleDateSelect = (date) => {
    const dateStr = formatDateToString(date);
    if (isDateAvailable(date)) {
      setSelectedDate(dateStr);
      setSelectedTimeSlot(null);
    }
  };

  const handleSubmit = async () => {
    if (!tenantNote.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập ghi chú",
      });
      return;
    }

    if (!isFormReady) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    const cleanedPhone = contactPhone.replace(/\D/g, "");
    if (!/^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/.test(cleanedPhone)) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          "Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại (10 số).",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        postId: post._id,
        buildingId: post.buildingId?._id || post.buildingId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        contactName: contactName.trim(),
        contactPhone: cleanedPhone,
        tenantNote: tenantNote.trim(),
      };
      const res = await createBooking(payload);
      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đặt lịch xem phòng thành công!",
        });

        setTimeout(() => {
          navigation.replace("BottomTabs");
        }, 1000);
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: e.response?.data?.message || "Không thể đặt lịch",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  const calendar = generateCalendar();
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch xem phòng</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 140,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.postTitle}>
              {post?.title || "Không có tiêu đề"}
            </Text>
            <Text style={styles.postDetail}>
              Tòa nhà: {post?.buildingId?.name || "Không rõ"}
            </Text>
            <Text style={styles.postDetail}>
              Địa chỉ:{" "}
              {post?.address || post?.buildingId?.address || "Không rõ địa chỉ"}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Chọn ngày</Text>

          {loadingSlots ? (
            <View style={styles.calendarLoading}>
              <ActivityIndicator color="#14b8a6" size="small" />
              <Text style={styles.loadingText}>Đang tải lịch...</Text>
            </View>
          ) : (
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => changeMonth(-1)}
                  style={styles.monthNavButton}
                >
                  <Ionicons name="chevron-back" size={20} color="#64748b" />
                </TouchableOpacity>

                <Text style={styles.monthYearText}>
                  {formatMonthYear(currentMonth)}
                </Text>

                <TouchableOpacity
                  onPress={() => changeMonth(1)}
                  style={styles.monthNavButton}
                >
                  <Ionicons name="chevron-forward" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.weekDaysContainer}>
                {weekDays.map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendar.map((date, index) => {
                  const available = isDateAvailable(date);
                  const selected = isDateSelected(date);
                  const today = isToday(date);
                  const currentMonthDay = isCurrentMonth(date);

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleDateSelect(date)}
                      disabled={!available}
                      style={[
                        styles.calendarDay,
                        !currentMonthDay && styles.otherMonthDay,
                        today && styles.today,
                        selected && styles.selectedDay,
                        !available && styles.unavailableDay,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !currentMonthDay && styles.otherMonthText,
                          today && styles.todayText,
                          selected && styles.selectedDayText,
                          !available && styles.unavailableText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {available && !selected && (
                        <View style={styles.availableDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {selectedDate && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Chọn giờ - {formatDisplayDate(selectedDate)}
              </Text>

              <View style={styles.availableRangeContainer}>
                <Ionicons name="time-outline" size={16} color="#64748b" />
                <Text style={styles.availableRangeText}>
                  Khung giờ rảnh:{" "}
                  {slotsByDate[selectedDate]?.map((s) => s.timeSlot).join(", ")}
                </Text>
              </View>

              <View style={styles.timeSlotContainer}>
                {generateTimeOptions(slotsByDate[selectedDate] || []).map(
                  (time) => (
                    <TouchableOpacity
                      key={time}
                      onPress={() => setSelectedTimeSlot(time)}
                      style={[
                        styles.timeSlotBtn,
                        selectedTimeSlot === time && styles.timeSlotBtnSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedTimeSlot === time && styles.timeTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            Thông tin liên hệ
          </Text>

          <TextInput
            style={[styles.input, submitting && styles.inputDisabled]}
            placeholder="Họ tên *"
            placeholderTextColor="#94a3b8"
            value={contactName}
            onChangeText={setContactName}
            editable={!submitting}
          />

          <TextInput
            style={[styles.input, submitting && styles.inputDisabled]}
            placeholder="Số điện thoại *"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
            editable={!submitting}
          />

          <TextInput
            style={[
              styles.input,
              styles.textArea,
              submitting && styles.inputDisabled,
            ]}
            placeholder="Ghi chú *"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={tenantNote}
            onChangeText={setTenantNote}
            editable={!submitting}
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!isFormReady || submitting) && styles.confirmBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormReady || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmText}>
              {isFormReady ? "Xác nhận đặt lịch" : "Vui lòng điền đủ thông tin"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  postDetail: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#0f172a",
  },

  calendarContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
    width: 32,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginVertical: 2,
    borderRadius: 8,
    position: "relative",
  },
  otherMonthDay: {
    opacity: 0.4,
  },
  today: {
    backgroundColor: "#f0f9ff",
  },
  selectedDay: {
    backgroundColor: "#14b8a6",
  },
  unavailableDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },
  otherMonthText: {
    color: "#94a3b8",
  },
  todayText: {
    color: "#0369a1",
    fontWeight: "600",
  },
  selectedDayText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  unavailableText: {
    color: "#cbd5e1",
  },
  availableDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#14b8a6",
  },
  calendarLoading: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
  },
  availableRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  availableRangeText: {
    fontSize: 13,
    color: "#0369a1",
    flex: 1,
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlotBtn: {
    width: "23%",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeSlotBtnSelected: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  timeText: {
    fontWeight: "600",
    color: "#475569",
    fontSize: 15,
  },
  timeTextSelected: {
    color: "#ffffff",
  },

  input: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  inputDisabled: {
    backgroundColor: "#f8fafc",
    color: "#64748b",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  confirmBtn: {
    backgroundColor: "#14b8a6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  confirmBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  confirmText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
