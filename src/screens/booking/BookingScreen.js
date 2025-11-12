import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cancelBooking, getMyBookings } from "../../api/bookingApi";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

export default function BookingScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const res = await getMyBookings();
      if (res.success) {
        setBookings(res.data || []);
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

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  // Lọc danh sách theo trạng thái và từ khóa
  useEffect(() => {
    let filtered = bookings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.contactName?.toLowerCase().includes(query) ||
          item.contactPhone?.includes(query) ||
          item.postId?.title?.toLowerCase().includes(query) ||
          item.buildingId?.name?.toLowerCase().includes(query) ||
          item.postId?.address?.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  }, [bookings, searchQuery, statusFilter]);

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

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return { color: "#f59e0b", bg: "#fef3c7", text: "Chờ xác nhận" };
      case "accepted":
        return { color: "#10b981", bg: "#d1fae5", text: "Đã chấp nhận" };
      case "rejected":
        return { color: "#ef4444", bg: "#fee2e2", text: "Bị từ chối" };
      case "cancelled":
        return { color: "#ef4444", bg: "#fee2e2", text: "Đã hủy" };
      default:
        return { color: "#64748b", bg: "#f1f5f9", text: "Không rõ" };
    }
  };

  const statusFilters = [
    { value: "all", label: "Tất cả", icon: "list-outline" },
    { value: "pending", label: "Chờ xác nhận", icon: "time-outline" },
    {
      value: "accepted",
      label: "Đã chấp nhận",
      icon: "checkmark-circle-outline",
    },
    { value: "rejected", label: "Bị từ chối", icon: "close-circle-outline" },
    { value: "cancelled", label: "Đã hủy", icon: "ban-outline" },
  ];

  const renderItem = ({ item }) => {
    const s = getStatusStyle(item.status);

    return (
      <View style={styles.card}>
        <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.text}</Text>
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
            {item.postId?.address || item.buildingId?.address || "Không rõ"}
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
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.cancelTxt}>Hủy lịch</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch đặt xem phòng</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search + Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, số điện thoại, địa chỉ..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#14b8a6"
            color="#1e293b"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilterContainer}
          contentContainerStyle={styles.statusFilterContent}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.statusFilterBtn,
                statusFilter === filter.value && styles.statusFilterBtnActive,
              ]}
              onPress={() => setStatusFilter(filter.value)}
            >
              <Ionicons
                name={filter.icon}
                size={14}
                color={statusFilter === filter.value ? "#0d9488" : "#64748b"}
              />
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === filter.value &&
                    styles.statusFilterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Danh sách */}
      {filteredBookings.length === 0 ? (
        <View style={styles.centerScreen}>
          <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>Không có lịch phù hợp</Text>
          <TouchableOpacity
            style={styles.goHomeButton}
            onPress={() =>
              navigation.navigate("BottomTabs", { screen: "Trang chủ" })
            }
          >
            <Text style={styles.goHomeButtonText}>Tìm phòng ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          refreshing={refreshing}
          onRefresh={() => fetchBookings(true)}
          contentContainerStyle={styles.listContainer}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  headerRight: { width: 32 },
  filterSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: "#1e293b",
    paddingVertical: 0,
  },
  statusFilterContainer: { marginBottom: 4 },
  statusFilterContent: { gap: 8 },
  statusFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 6,
    gap: 4,
  },
  statusFilterBtnActive: {
    backgroundColor: "#f0fdfa",
    borderColor: "#0d9488",
  },
  statusFilterText: {
    fontSize: 12,
    color: "#64748b",
  },
  statusFilterTextActive: {
    color: "#0d9488",
    fontWeight: "600",
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
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: { fontSize: 13, fontWeight: "600" },
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
  infoText: { fontSize: 14, color: "#334155", flex: 1 },
  noteBox: {
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#14b8a6",
  },
  noteLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  noteText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
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
