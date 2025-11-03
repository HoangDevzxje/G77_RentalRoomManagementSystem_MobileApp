import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cancelBooking, getMyBookings } from "../../api/bookingApi";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const res = await getMyBookings();
      if (res.success) {
        setBookings(res.data);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: res.message || "Không thể lấy danh sách đặt lịch",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err.response?.data?.message || "Lỗi hệ thống",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  const handleCancel = (bookingId) => {
    Alert.alert("Xác nhận hủy", "Bạn có chắc muốn hủy lịch này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Có",
        onPress: async () => {
          try {
            const res = await cancelBooking(bookingId);
            if (res.success) {
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: res.message || "Đã hủy lịch",
              });
              fetchBookings();
            } else {
              Toast.show({
                type: "error",
                text1: "Lỗi",
                text2: res.message || "Không thể hủy lịch",
              });
            }
          } catch (err) {
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: err.response?.data?.message || "Không thể hủy lịch",
            });
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { color: "#f59e0b", bg: "#fef3c7" };
      case "accepted":
        return { color: "#10b981", bg: "#d1fae5" };
      case "rejected":
        return { color: "#ef4444", bg: "#fee2e2" };
      case "cancelled":
        return { color: "#6b7280", bg: "#f3f4f6" };
      default:
        return { color: "#64748b", bg: "#f1f5f9" };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "accepted":
        return "Đã chấp nhận";
      case "rejected":
        return "Bị từ chối";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>Chưa có lịch đặt nào</Text>
        <TouchableOpacity
          style={styles.goHomeButton}
          onPress={() =>
            navigation.navigate("BottomTabs", { screen: "Trang chủ" })
          }
        >
          <Text style={styles.goHomeButtonText}>Tìm phòng ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<View style={{ height: 100 }} />}
        renderItem={({ item }) => {
          const s = getStatusStyle(item.status);
          return (
            <View style={styles.card}>
              <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                <Text style={[styles.statusText, { color: s.color }]}>
                  {getStatusText(item.status)}
                </Text>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.postId?.title || "Không có tiêu đề"}
              </Text>

              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={18} color="#64748b" />
                <Text style={styles.infoText} numberOfLines={2}>
                  {item.buildingId?.name || "Không rõ"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#64748b" />
                <Text style={styles.infoText} numberOfLines={3}>
                  {item.postId?.address ||
                    item.buildingId?.address ||
                    "Không rõ"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>
                  {new Date(item.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  • {item.timeSlot}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>
                  {item.contactName} • {item.contactPhone}
                </Text>
              </View>

              {item.tenantNote ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Ghi chú:</Text>
                  <Text style={styles.noteText}>{item.tenantNote}</Text>
                </View>
              ) : null}

              {item.status === "pending" && (
                <TouchableOpacity
                  onPress={() => handleCancel(item._id)}
                  style={styles.cancelBtn}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.cancelTxt}>Hủy lịch</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
    flexWrap: "wrap",
  },
  noteBox: {
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#14b8a6",
  },
  noteLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  noteText: {
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 20,
  },
  cancelBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 6,
  },
  cancelTxt: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
    marginBottom: 16,
  },
  goHomeButton: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goHomeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
