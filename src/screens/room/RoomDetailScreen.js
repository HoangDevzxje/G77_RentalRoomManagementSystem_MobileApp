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
const DEFAULT_IMAGE =
  "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg";

export default function RoomDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const data = await getRoomById(id);
        setRoom(data);
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetail();
  }, [id]);

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUri = () => {
    if (imageError) return DEFAULT_IMAGE;

    if (room?.images && Array.isArray(room.images) && room.images.length > 0) {
      return room.images[currentImageIndex] || DEFAULT_IMAGE;
    }

    return DEFAULT_IMAGE;
  };

  const getImageList = () => {
    if (room?.images && Array.isArray(room.images) && room.images.length > 0) {
      return room.images;
    }
    return [DEFAULT_IMAGE];
  };

  const handleNextImage = () => {
    const images = getImageList();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    const images = getImageList();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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

  const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    return price.toLocaleString("vi-VN") + "đ";
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
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phòng {room.roomNumber}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageSection}>
          <Image
            source={{ uri: getImageUri() }}
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

          {getImageList().length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.imageNavButton, styles.imageNavLeft]}
                onPress={handlePrevImage}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imageNavButton, styles.imageNavRight]}
                onPress={handleNextImage}
              >
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1} / {getImageList().length}
                </Text>
              </View>

              <View style={styles.dotsContainer}>
                {getImageList().map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCurrentImageIndex(index)}
                  >
                    <View
                      style={[
                        styles.dot,
                        index === currentImageIndex && styles.activeDot,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.roomHeader}>
            <Text style={styles.price}>Giá: {formatPrice(room.price)}</Text>
            {room.buildingId && (
              <Text style={styles.buildingName}>
                {typeof room.buildingId === "object"
                  ? room.buildingId.name
                  : room.buildingId}
              </Text>
            )}
          </View>
        </View>

        {(room.buildingId?.address || room.buildingId?.description) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="#14b8a6" />
              <Text style={styles.sectionTitle}>Địa chỉ & Thông tin</Text>
            </View>
            {room.buildingId?.address && (
              <Text style={styles.address}>{room.buildingId.address}</Text>
            )}
            {room.buildingId?.description && (
              <Text style={styles.description}>
                {room.buildingId.description}
              </Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={20} color="#14b8a6" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Diện tích</Text>
                <Text style={styles.detailValue}>
                  {room.area ? `${room.area}m²` : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={20} color="#14b8a6" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Số người</Text>
                <Text style={styles.detailValue}>
                  {room.maxTenants || 1} người
                </Text>
              </View>
            </View>
          </View>
        </View>

        {room.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#14b8a6"
              />
              <Text style={styles.sectionTitle}>Mô tả phòng</Text>
            </View>
            <Text style={styles.description}>{room.description}</Text>
          </View>
        )}

        {room.buildingId && typeof room.buildingId === "object" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={20} color="#14b8a6" />
              <Text style={styles.sectionTitle}>Tiện ích & Chi phí</Text>
            </View>

            <View style={styles.utilitiesGrid}>
              <View style={styles.utilityCard}>
                <View style={styles.utilityHeader}>
                  <Ionicons name="flash" size={16} color="#f59e0b" />
                  <Text style={styles.utilityTitle}>Điện</Text>
                </View>
                {room.buildingId.eIndexType === "included" ? (
                  <Text style={styles.utilityIncluded}>Đã bao gồm</Text>
                ) : (
                  <Text style={styles.utilityPrice}>
                    {room.buildingId.ePrice?.toLocaleString() || "0"} đ/{" "}
                    {getUtilityTypeText(
                      room.buildingId.eIndexType || "byNumber"
                    )}
                  </Text>
                )}
              </View>

              <View style={styles.utilityCard}>
                <View style={styles.utilityHeader}>
                  <Ionicons name="water" size={16} color="#0891b2" />
                  <Text style={styles.utilityTitle}>Nước</Text>
                </View>
                {room.buildingId.wIndexType === "included" ? (
                  <Text style={styles.utilityIncluded}>Đã bao gồm</Text>
                ) : (
                  <Text style={styles.utilityPrice}>
                    {room.buildingId.wPrice?.toLocaleString() || "0"} đ/{" "}
                    {getUtilityTypeText(
                      room.buildingId.wIndexType || "byNumber"
                    )}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.actionSection}>
        {room.status === "available" ? (
          <TouchableOpacity style={styles.bookButton}>
            <Ionicons name="calendar-outline" size={20} color="white" />
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
          <Ionicons name="chatbubble-outline" size={20} color="#14b8a6" />
          <Text style={styles.contactButtonText}>Nhắn tin cho chủ trọ</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 16,
    color: "#64748b",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  backIconButton: {
    padding: 4,
  },
  backButton: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  imageSection: {
    position: "relative",
  },
  roomImage: {
    width: width,
    height: 210,
    backgroundColor: "#e5e7eb",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  imageNavButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  imageNavLeft: {
    left: 12,
  },
  imageNavRight: {
    right: 12,
  },
  imageCounter: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  imageCounterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  section: {
    backgroundColor: "white",
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 6,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#dc2626",
  },
  buildingName: {
    fontSize: 15,
    color: "#64748b",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailText: {
    marginLeft: 6,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
  },
  address: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 20,
  },
  description: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 20,
  },
  utilitiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  utilityCard: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  utilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  utilityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 5,
  },
  utilityPrice: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 16,
  },
  utilityIncluded: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
  },
  actionSection: {
    padding: 12,
    paddingBottom: 14,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  bookButton: {
    backgroundColor: "#14b8a6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 5,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#14b8a6",
    backgroundColor: "white",
  },
  contactButtonText: {
    color: "#14b8a6",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  disabledButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
