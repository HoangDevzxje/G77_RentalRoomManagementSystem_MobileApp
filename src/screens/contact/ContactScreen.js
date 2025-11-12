import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { getMyContacts, cancelContact } from "../../api/contactApi";
import { useFocusEffect } from "@react-navigation/native";

const ContactScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchContacts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await getMyContacts();
      if (response && response.success) {
        const contactsData = response.data || [];
        setContacts(Array.isArray(contactsData) ? contactsData : []);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi tải dữ liệu",
          text2: response?.message || "Không thể tải danh sách yêu cầu",
          position: "top",
        });
      }
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        position: "top",
      });
      setContacts([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = contacts;

    if (statusFilter !== "all") {
      filtered = filtered.filter((contact) => contact.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (contact) =>
          contact.contactName?.toLowerCase().includes(query) ||
          contact.contactPhone?.includes(query) ||
          contact.tenantNote?.toLowerCase().includes(query) ||
          contact.buildingId?.name?.toLowerCase().includes(query) ||
          contact.roomId?.roomNumber
            ?.toString()
            .toLowerCase()
            .includes(query) ||
          contact.postId?.title?.toLowerCase().includes(query)
      );
    }

    setFilteredContacts(filtered);
  }, [contacts, searchQuery, statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts(false);
    }, [])
  );

  const handleCancelContact = async (contactId) => {
    try {
      const response = await cancelContact(contactId);
      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã huỷ yêu cầu thành công",
          position: "top",
        });
        fetchContacts(false);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: response.message || "Không thể huỷ yêu cầu",
          position: "top",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          error.response?.data?.message ||
          error.message ||
          "Không thể huỷ yêu cầu. Vui lòng thử lại.",
        position: "top",
      });
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === 0) return "Liên hệ";
    return `${Number(price).toLocaleString("vi-VN")}đ`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          label: "Chờ xử lý",
          color: "#f59e0b",
          bgColor: "#fef3c7",
          icon: "time-outline",
        };
      case "accepted":
        return {
          label: "Đã duyệt",
          color: "#10b981",
          bgColor: "#d1fae5",
          icon: "checkmark-circle-outline",
        };
      case "rejected":
        return {
          label: "Đã từ chối",
          color: "#ef4444",
          bgColor: "#fee2e2",
          icon: "close-circle-outline",
        };
      case "cancelled":
        return {
          label: "Đã huỷ",
          color: "#ef4444",
          bgColor: "#fee2e2",
          icon: "ban-outline",
        };
      default:
        return {
          label: "Không xác định",
          color: "#94a3b8",
          bgColor: "#f8fafc",
          icon: "help-circle-outline",
        };
    }
  };

  const statusFilters = [
    { value: "all", label: "Tất cả", icon: "list-outline" },
    { value: "pending", label: "Chờ xử lý", icon: "time-outline" },
    { value: "accepted", label: "Đã duyệt", icon: "checkmark-circle-outline" },
    { value: "rejected", label: "Đã từ chối", icon: "close-circle-outline" },
    { value: "cancelled", label: "Đã huỷ", icon: "ban-outline" },
  ];

  const renderContactCard = (contact) => {
    if (!contact || typeof contact !== "object") return null;

    const statusInfo = getStatusInfo(contact.status);
    const canCancel = contact.status === "pending";

    const room = contact.roomId || {};
    const building = contact.buildingId || {};
    const post = contact.postId || {};

    const roomNumber = room.roomNumber || "";
    const roomName = roomNumber ? `P.${roomNumber}` : "Không xác định";
    const roomPrice = room.price;
    const roomArea = room.area;

    const buildingName = building.name || "";
    const buildingAddress = building.address || "";

    let locationText = "Không xác định";
    if (buildingName && buildingAddress) {
      locationText = `${buildingName} - ${buildingAddress}`;
    } else if (buildingName) {
      locationText = buildingName;
    } else if (buildingAddress) {
      locationText = buildingAddress;
    }

    let roomDisplayText = roomName;
    if (roomArea) {
      roomDisplayText = `${roomName} - ${roomArea}m²`;
    }

    return (
      <View key={contact._id} style={styles.contactCard}>
        <View style={styles.headerSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.bgColor },
            ]}
          >
            <Ionicons
              name={statusInfo.icon}
              size={16}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(contact.createdAt)}</Text>
        </View>

        <View style={styles.propertySection}>
          {post && post.title ? (
            <Text style={styles.postTitle} numberOfLines={2}>
              {post.title}
            </Text>
          ) : null}

          <View style={styles.locationRow}>
            <Ionicons name="business-outline" size={14} color="#64748b" />
            <Text style={styles.buildingText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>

          <View style={styles.roomInfoRow}>
            <View style={styles.roomMainInfo}>
              <Ionicons name="bed-outline" size={18} color="#0d9488" />
              <Text style={styles.roomName}>{roomDisplayText}</Text>
            </View>
            <View style={styles.roomDetails}>
              <Text style={styles.roomPrice}>{formatPrice(roomPrice)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.contactInfoSection}>
          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="person-outline" size={16} color="#64748b" />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactLabel}>Họ tên</Text>
              <Text style={styles.contactValue}>
                {contact.contactName || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={16} color="#64748b" />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactLabel}>Số điện thoại</Text>
              <Text style={styles.contactValue}>
                {contact.contactPhone || "N/A"}
              </Text>
            </View>
          </View>

          {contact.tenantNote ? (
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#64748b"
                />
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactLabel}>Ghi chú</Text>
                <Text style={styles.noteValue}>{contact.tenantNote}</Text>
              </View>
            </View>
          ) : null}

          {contact.landlordNote ? (
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <Ionicons name="chatbubble-outline" size={16} color="#0d9488" />
              </View>
              <View style={styles.contactDetails}>
                <Text style={[styles.contactLabel, { color: "#0d9488" }]}>
                  Phản hồi từ chủ trọ
                </Text>
                <Text style={[styles.noteValue, { color: "#0d9488" }]}>
                  {contact.landlordNote}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {canCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancelContact(contact._id)}
          >
            <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.cancelBtnText}>Huỷ yêu cầu</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
      <Text style={styles.emptyText}>
        {searchQuery || statusFilter !== "all"
          ? "Không tìm thấy yêu cầu phù hợp với bộ lọc"
          : "Bạn chưa gửi yêu cầu tạo hợp đồng nào.\nHãy tìm phòng phù hợp và gửi yêu cầu!"}
      </Text>
      {searchQuery || statusFilter !== "all" ? (
        <TouchableOpacity
          style={styles.clearFilterBtn}
          onPress={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}
        >
          <Ionicons name="close-circle-outline" size={18} color="#0d9488" />
          <Text style={styles.clearFilterBtnText}>Xoá bộ lọc</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate("BottomTabs", { screen: "Home" })}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.exploreBtnText}>Tìm phòng</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, số điện thoại, địa chỉ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            placeholderTextColor="#94a3b8"
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listContainer}>
            {filteredContacts.map(renderContactCard)}
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  headerSpacer: { width: 24 },
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
    marginHorizontal: 8,
    fontSize: 14,
    color: "#1e293b",
  },
  statusFilterContainer: {
    marginBottom: 4,
  },
  statusFilterContent: {
    gap: 8,
  },
  statusFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
    marginRight: 6,
  },
  statusFilterBtnActive: {
    backgroundColor: "#f0fdfa",
    borderColor: "#0d9488",
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  statusFilterTextActive: {
    color: "#0d9488",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContainer: { gap: 16 },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
  },
  propertySection: {
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 14,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  buildingText: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
  },
  roomInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  roomDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roomPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  contactInfoSection: {
    gap: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  contactIcon: {
    width: 20,
    alignItems: "center",
    marginTop: 1,
  },
  contactDetails: {
    flex: 1,
    marginLeft: 8,
  },
  contactLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  noteValue: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    gap: 6,
  },
  exploreBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0d9488",
    gap: 6,
  },
  clearFilterBtnText: {
    color: "#0d9488",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacer: { height: 20 },
});

export default ContactScreen;
