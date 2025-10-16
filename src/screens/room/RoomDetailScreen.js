import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { getRoomById } from "../../api/roomApi";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function RoomDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const data = await getRoomById(id);
        setRoom(data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetail();
  }, [id]);

  const handleImageError = () => {
    setImageError(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return { color: "#059669", bg: "#d1fae5", text: "🟢 Còn trống" };
      case "rented":
        return { color: "#dc2626", bg: "#fee2e2", text: "🔴 Đã thuê" };
      case "maintenance":
        return { color: "#d97706", bg: "#fef3c7", text: "🟡 Bảo trì" };
      default:
        return { color: "#6b7280", bg: "#f3f4f6", text: "⚪ Không xác định" };
    }
  };

  const getUtilityTypeText = (type) => {
    switch (type) {
      case "byNumber":
        return "theo chỉ số";
      case "byPerson":
        return "theo đầu người";
      case "included":
        return "đã bao gồm";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Đang tải thông tin phòng...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin phòng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusColor(room.status);

  return (
    <View style={styles.container}>
      {/* Header với nút back */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết phòng</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Room Images */}
        <View style={styles.imageSection}>
          <Image
            source={{
              uri: imageError
                ? "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg"
                : room.imageUrl ||
                  "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg",
            }}
            style={styles.roomImage}
            resizeMode="cover"
            onError={handleImageError}
          />
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Room Basic Info */}
        <View style={styles.section}>
          <View style={styles.roomHeader}>
            <View>
              <Text style={styles.roomNumber}>Phòng {room.roomNumber}</Text>
              {room.buildingId && (
                <Text style={styles.buildingName}>{room.buildingId.name}</Text>
              )}
            </View>
            <Text style={styles.price}>
              {(room.price / 1000000).toFixed(1)} tr
            </Text>
          </View>

          {/* Room Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={18} color="#64748b" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Diện tích</Text>
                <Text style={styles.detailValue}>
                  {room.area ? `${room.area}m²` : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={18} color="#64748b" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Số người</Text>
                <Text style={styles.detailValue}>
                  {room.maxTenants || 1} người
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Building Address & Description Combined */}
        {(room.buildingId?.address || room.buildingId?.description) && (
          <View style={styles.section}>
            {room.buildingId?.address && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={18} color="#1e293b" />
                  <Text style={styles.sectionTitle}>Địa chỉ</Text>
                </View>
                <Text style={styles.address}>{room.buildingId.address}</Text>
              </>
            )}

            {room.buildingId?.description && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <Ionicons name="business-outline" size={18} color="#1e293b" />
                  <Text style={styles.sectionTitle}>Thông tin tòa nhà</Text>
                </View>
                <Text style={styles.description}>
                  {room.buildingId.description}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Room Description */}
        {room.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#1e293b"
              />
              <Text style={styles.sectionTitle}>Mô tả phòng</Text>
            </View>
            <Text style={styles.description}>{room.description}</Text>
          </View>
        )}

        {/* Utilities */}
        {room.buildingId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={18} color="#1e293b" />
              <Text style={styles.sectionTitle}>Tiện ích & Chi phí</Text>
            </View>

            <View style={styles.utilitiesGrid}>
              {/* Điện */}
              <View style={styles.utilityCard}>
                <View style={styles.utilityHeader}>
                  <Ionicons name="flash" size={14} color="#f59e0b" />
                  <Text style={styles.utilityTitle}>Điện</Text>
                </View>
                {room.buildingId.eIndexType === "included" ? (
                  <Text style={styles.utilityIncluded}>Đã bao gồm</Text>
                ) : (
                  <Text style={styles.utilityPrice}>
                    {room.buildingId.ePrice?.toLocaleString()} đ/{" "}
                    {getUtilityTypeText(room.buildingId.eIndexType)}
                  </Text>
                )}
              </View>

              {/* Nước */}
              <View style={styles.utilityCard}>
                <View style={styles.utilityHeader}>
                  <Ionicons name="water" size={14} color="#3b82f6" />
                  <Text style={styles.utilityTitle}>Nước</Text>
                </View>
                {room.buildingId.wIndexType === "included" ? (
                  <Text style={styles.utilityIncluded}>Đã bao gồm</Text>
                ) : (
                  <Text style={styles.utilityPrice}>
                    {room.buildingId.wPrice?.toLocaleString()} đ/{" "}
                    {getUtilityTypeText(room.buildingId.wIndexType)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {room.status === "available" ? (
            <TouchableOpacity style={styles.bookButton}>
              <Ionicons name="calendar-outline" size={18} color="white" />
              <Text style={styles.bookButtonText}>Đặt lịch xem phòng</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.disabledButton} disabled>
              <Text style={styles.disabledButtonText}>
                {room.status === "rented"
                  ? "Phòng đã được thuê"
                  : "Phòng đang bảo trì"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="chatbubble-outline" size={18} color="#14b8a6" />
            <Text style={styles.contactButtonText}>Nhắn tin cho chủ trọ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  backButton: {
    padding: 4,
  },
  headerPlaceholder: {
    width: 32,
  },
  imageSection: {
    position: "relative",
  },
  roomImage: {
    width: width,
    height: 180,
    backgroundColor: "#e5e7eb",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "white",
    marginTop: 8,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 6,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  buildingName: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc2626",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  address: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  utilitiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  utilityCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
    flex: 0.48,
  },
  utilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  utilityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 6,
  },
  utilityPrice: {
    fontSize: 12,
    color: "#374151",
  },
  utilityIncluded: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  actionSection: {
    padding: 12,
    backgroundColor: "white",
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: "#14b8a6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  bookButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 6,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  contactButtonText: {
    color: "#14b8a6",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  disabledButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  spacer: {
    height: 16,
  },
});
