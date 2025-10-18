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
import { getRoomFurnitures } from "../../api/furnitureApi";
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
  const [furnitures, setFurnitures] = useState([]);
  const [furnituresLoading, setFurnituresLoading] = useState(true);
  const [furnituresExpanded, setFurnituresExpanded] = useState(false);

  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const data = await getRoomById(id);
        setRoom(data);
        fetchFurnitures(data._id);
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetail();
  }, [id]);

  const fetchFurnitures = async (roomId) => {
    try {
      const data = await getRoomFurnitures(roomId);
      if (Array.isArray(data)) {
        setFurnitures(data);
      } else if (data && Array.isArray(data.data)) {
        setFurnitures(data.data);
      } else {
        setFurnitures([]);
      }
    } catch (error) {
      console.error("Error fetching furnitures:", error);
      setFurnitures([]);
    } finally {
      setFurnituresLoading(false);
    }
  };

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

  const getStatusInfo = (status) => {
    switch (status) {
      case "available":
        return { color: "#10b981", text: "Còn trống" };
      case "rented":
        return { color: "#ef4444", text: "Đã thuê" };
      case "maintenance":
        return { color: "#f59e0b", text: "Bảo trì" };
      default:
        return { color: "#6b7280", text: "Không xác định" };
    }
  };

  const getConditionInfo = (condition) => {
    switch (condition) {
      case "good":
        return { icon: "checkmark-circle", color: "#10b981", text: "Tốt" };
      case "damaged":
        return { icon: "close-circle", color: "#ef4444", text: "Hỏng" };
      case "under_repair":
        return { icon: "construct", color: "#f59e0b", text: "Đang sửa" };
      default:
        return { icon: "help-circle", color: "#94a3b8", text: "Không rõ" };
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
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <Ionicons name="home-outline" size={64} color="#cbd5e1" />
        <Text style={styles.errorText}>Không tìm thấy thông tin phòng</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(room.status);
  const displayedFurnitures = furnituresExpanded
    ? furnitures
    : furnitures.slice(0, 4);
  const hasFurnitures = furnitures.length > 0;
  const hasMoreFurnitures = furnitures.length > 4;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phòng {room.roomNumber}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUri() }}
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
          />

          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>

          {/* Image Navigation */}
          {getImageList().length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navLeft]}
                onPress={handlePrevImage}
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.navRight]}
                onPress={handleNextImage}
              >
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>

              {/* Dots Indicator */}
              <View style={styles.dotsContainer}>
                {getImageList().map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentImageIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.content}>
          {/* Room Info */}
          <View style={styles.section}>
            <View style={styles.roomHeader}>
              <Text style={styles.price}>
                Giá: {formatPrice(room.price)}/tháng
              </Text>
            </View>

            {room.buildingId?.address && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Địa chỉ</Text>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={18} color="#0f172a" />
                  <Text style={styles.address}>{room.buildingId.address}</Text>
                </View>
              </View>
            )}

            {/* Quick Info */}
            <View style={styles.quickInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="resize-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>{room.area || "—"}m²</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>
                  {room.maxTenants || 1} người
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {room.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{room.description}</Text>
            </View>
          )}

          {/* Utilities */}
          {room.buildingId && typeof room.buildingId === "object" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tiện ích</Text>
              <View style={styles.utilitiesRow}>
                <View style={styles.utilityItem}>
                  <Ionicons name="flash" size={18} color="#f59e0b" />
                  <View style={styles.utilityInfo}>
                    <Text style={styles.utilityLabel}>Điện</Text>
                    <Text style={styles.utilityValue}>
                      {room.buildingId.eIndexType === "included"
                        ? "Đã bao gồm"
                        : `${
                            room.buildingId.ePrice?.toLocaleString() || "0"
                          }đ/kWh`}
                    </Text>
                  </View>
                </View>

                <View style={styles.utilityItem}>
                  <Ionicons name="water" size={18} color="#0ea5e9" />
                  <View style={styles.utilityInfo}>
                    <Text style={styles.utilityLabel}>Nước</Text>
                    <Text style={styles.utilityValue}>
                      {room.buildingId.wIndexType === "included"
                        ? "Đã bao gồm"
                        : `${
                            room.buildingId.wPrice?.toLocaleString() || "0"
                          }đ/m³`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Furniture */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nội thất</Text>
              {hasFurnitures && (
                <Text style={styles.countBadge}>{furnitures.length}</Text>
              )}
            </View>

            {furnituresLoading ? (
              <ActivityIndicator
                size="small"
                color="#14b8a6"
                style={{ marginTop: 12 }}
              />
            ) : !hasFurnitures ? (
              <Text style={styles.emptyText}>Chưa có thông tin nội thất</Text>
            ) : (
              <>
                <View style={styles.furnitureGrid}>
                  {displayedFurnitures.map((item, index) => {
                    const conditionInfo = getConditionInfo(item.condition);
                    const name =
                      item.furnitureId?.name || item.name || "Nội thất";

                    return (
                      <View
                        key={item._id || index}
                        style={styles.furnitureCard}
                      >
                        <View style={styles.furnitureTop}>
                          <Text style={styles.furnitureName} numberOfLines={1}>
                            {name}
                          </Text>
                          <Ionicons
                            name={conditionInfo.icon}
                            size={16}
                            color={conditionInfo.color}
                          />
                        </View>
                        <Text style={styles.furnitureQuantity}>
                          SL: {item.quantity || 1}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {hasMoreFurnitures && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setFurnituresExpanded(!furnituresExpanded)}
                  >
                    <Text style={styles.expandText}>
                      {furnituresExpanded
                        ? "Thu gọn"
                        : `Xem thêm ${furnitures.length - 4} nội thất`}
                    </Text>
                    <Ionicons
                      name={furnituresExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="#14b8a6"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {room.status === "available" ? (
          <>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Đặt lịch xem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#14b8a6" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.disabledButton} disabled>
            <Text style={styles.disabledButtonText}>
              {room.status === "rented" ? "Đã được thuê" : "Đang bảo trì"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: "#64748b",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  scrollContent: {
    paddingBottom: 16,
  },

  // Image
  imageContainer: {
    position: "relative",
    backgroundColor: "#f1f5f9",
  },
  image: {
    width: width,
    height: 280,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -18 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  navLeft: {
    left: 16,
  },
  navRight: {
    right: 16,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: "white",
    width: 20,
  },

  // Content
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
  },
  countBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#14b8a6",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  // Room Info
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  roomNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  buildingName: {
    fontSize: 14,
    color: "#64748b",
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#dc2626",
  },
  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
  },

  // Description & Address
  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },

  // Utilities
  utilitiesRow: {
    flexDirection: "row",
    gap: 12,
  },
  utilityItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  utilityInfo: {
    flex: 1,
  },
  utilityLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },
  utilityValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  // Furniture
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingVertical: 16,
  },
  furnitureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  furnitureCard: {
    width: (width - 60) / 2,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  furnitureTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  furnitureName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
    marginRight: 6,
  },
  furnitureQuantity: {
    fontSize: 13,
    color: "#64748b",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  expandText: {
    fontSize: 14,
    color: "#14b8a6",
    fontWeight: "500",
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
  },
  disabledButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButtonText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
});
