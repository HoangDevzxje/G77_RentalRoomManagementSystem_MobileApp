import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAvailableSlots, createBooking } from "../../api/bookingApi";
import { getPostById } from "../../api/postApi";
import { useFocusEffect } from "@react-navigation/native";

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

  const getDateRange = () => {
    const today = new Date();
    const next = new Date();
    next.setDate(today.getDate() + 7);
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
      Alert.alert("Lỗi", "Không tải được lịch trống");
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
            Alert.alert("Lỗi", "Không tải được bài đăng");
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

  const slotsByDate = availableSlots.reduce((acc, s) => {
    (acc[s.date] = acc[s.date] || []).push(s);
    return acc;
  }, {});
  const dates = Object.keys(slotsByDate).sort();

  const fmt = (d) =>
    new Date(d).toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTimeSlot || !contactName || !contactPhone) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (!/^\d{10,11}$/.test(contactPhone.replace(/\D/g, ""))) {
      Alert.alert("Lỗi", "Số điện thoại phải có 10-11 số");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        postId: post._id,
        buildingId: post.buildingId?._id || post.buildingId,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        contactName,
        contactPhone,
        tenantNote,
      };
      const res = await createBooking(payload);
      if (res.success) {
        navigation.replace("BottomTabs");
        setTimeout(() => {
          Alert.alert("Thành công", "Đặt lịch xem phòng thành công!");
        }, 400);
      }
    } catch (e) {
      Alert.alert("Lỗi", e.response?.data?.message || "Không thể đặt lịch");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch xem phòng</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 140,
          }}
        >
          <View style={styles.infoCard}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDetail}>
              Tòa nhà: {post.buildingId?.name || "Không rõ"}
            </Text>
            <Text style={styles.postDetail}>
              Địa chỉ: {post.address || post.buildingId?.address}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Chọn ngày</Text>
          {loadingSlots ? (
            <ActivityIndicator color="#14b8a6" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {dates.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    setSelectedDate(d);
                    setSelectedTimeSlot(null);
                  }}
                  style={[
                    styles.dateBtn,
                    selectedDate === d && styles.dateBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === d && { color: "#fff" },
                    ]}
                  >
                    {fmt(d)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedDate && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                Chọn giờ
              </Text>
              <View style={styles.timeSlotContainer}>
                {slotsByDate[selectedDate]?.map((s) => (
                  <TouchableOpacity
                    key={s.timeSlot}
                    onPress={() => setSelectedTimeSlot(s.timeSlot)}
                    style={[
                      styles.timeSlotBtn,
                      selectedTimeSlot === s.timeSlot &&
                        styles.timeSlotBtnSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        selectedTimeSlot === s.timeSlot && { color: "#fff" },
                      ]}
                    >
                      {s.timeSlot}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color:
                          selectedTimeSlot === s.timeSlot ? "#fff" : "#475569",
                      }}
                    >
                      {s.availableSlots} chỗ
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            Thông tin liên hệ
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Họ tên *"
            value={contactName}
            onChangeText={setContactName}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại *"
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={setContactPhone}
          />
          <TextInput
            style={[styles.input, { height: 90 }]}
            placeholder="Ghi chú (tùy chọn)"
            multiline
            value={tenantNote}
            onChangeText={setTenantNote}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedDate ||
              !selectedTimeSlot ||
              !contactName ||
              !contactPhone) && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={
            submitting ||
            !selectedDate ||
            !selectedTimeSlot ||
            !contactName ||
            !contactPhone
          }
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Xác nhận đặt lịch</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: "100%",
  },
  postTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  postDetail: { color: "#64748b", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  dateBtn: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  dateBtnSelected: { backgroundColor: "#14b8a6" },
  dateText: { fontWeight: "600", color: "#0f172a" },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  timeSlotBtn: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeSlotBtnSelected: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  timeText: { fontWeight: "600" },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  confirmBtn: {
    backgroundColor: "#14b8a6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
