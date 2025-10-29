import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getRoomById } from "../../api/roomApi";

const { width } = Dimensions.get("window");

export default function RoomDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <Ionicons name="bed-outline" size={64} color="#cbd5e1" />
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
        <Text style={styles.headerTitle}>Chi tiết phòng</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Room Header
        <View style={styles.roomHeader}>
          <View style={styles.roomIconContainer}>
            <Ionicons name="bed" size={40} color="#14b8a6" />
          </View>
          <View style={styles.roomHeaderInfo}>
            <Text style={styles.roomName}>{room.name}</Text>
            {room.buildingId && typeof room.buildingId === "object" && (
              <View style={styles.buildingBadge}>
                <Ionicons name="business" size={14} color="#64748b" />
                <Text style={styles.buildingName}>{room.buildingId.name}</Text>
              </View>
            )}
          </View>
        </View> */}

        {/* Room Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                room.image ||
                "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg",
            }}
            style={styles.roomImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.content}>
          {/* Room Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin phòng</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="resize-outline" size={20} color="#6366f1" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Diện tích</Text>
                    <Text style={styles.infoValue}>
                      {room.area ? `${room.area}m²` : "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoItem}>
                  <Ionicons name="cash-outline" size={20} color="#10b981" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Giá phòng</Text>
                    <Text style={styles.infoValue}>
                      {formatPrice(room.price)}/tháng
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={20} color="#f59e0b" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Số người tối đa</Text>
                    <Text style={styles.infoValue}>
                      {room.maxOccupants || "N/A"} người
                    </Text>
                  </View>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoItem}>
                  <Ionicons
                    name={room.isOccupied ? "close-circle" : "checkmark-circle"}
                    size={20}
                    color={room.isOccupied ? "#dc2626" : "#10b981"}
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Trạng thái</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: room.isOccupied ? "#dc2626" : "#10b981" },
                      ]}
                    >
                      {room.isOccupied ? "Đã cho thuê" : "Còn trống"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Building Info Section */}
          {room.buildingId && typeof room.buildingId === "object" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin tòa nhà</Text>

              <View style={styles.buildingCard}>
                <View style={styles.buildingHeader}>
                  <Ionicons name="business-outline" size={20} color="#0f172a" />
                  <Text style={styles.buildingTitle}>
                    {room.buildingId.name}
                  </Text>
                </View>

                {room.buildingId.address && (
                  <View style={styles.addressRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#64748b"
                    />
                    <Text style={styles.addressText}>
                      {room.buildingId.address}
                    </Text>
                  </View>
                )}

                {/* Utilities */}
                <View style={styles.utilitiesContainer}>
                  <Text style={styles.utilitiesTitle}>Tiện ích</Text>
                  <View style={styles.utilitiesGrid}>
                    <View style={styles.utilityBox}>
                      <Ionicons name="flash" size={18} color="#f59e0b" />
                      <View>
                        <Text style={styles.utilityLabel}>Điện</Text>
                        <Text style={styles.utilityValue}>
                          {room.buildingId.eIndexType === "included"
                            ? "Đã bao gồm"
                            : `${formatPrice(room.buildingId.ePrice)}/kWh`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.utilityBox}>
                      <Ionicons name="water" size={18} color="#0ea5e9" />
                      <View>
                        <Text style={styles.utilityLabel}>Nước</Text>
                        <Text style={styles.utilityValue}>
                          {room.buildingId.wIndexType === "included"
                            ? "Đã bao gồm"
                            : `${formatPrice(room.buildingId.wPrice)}/m³`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Room Description */}
          {room.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{room.description}</Text>
            </View>
          )}

          {/* <View style={styles.statusCard}>
            <Ionicons
              name={room.isOccupied ? "information-circle" : "checkmark-circle"}
              size={24}
              color={room.isOccupied ? "#f59e0b" : "#10b981"}
            />
            <Text style={styles.statusText}>
              {room.isOccupied
                ? "Phòng này hiện đang được thuê. Vui lòng liên hệ để biết thêm thông tin."
                : "Phòng này hiện đang trống và sẵn sàng cho thuê."}
            </Text>
          </View> */}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!room.isOccupied ? (
          <>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="call-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Liên hệ thuê</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="heart-outline" size={20} color="#14b8a6" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.disabledButton} disabled>
            <Text style={styles.disabledButtonText}>
              Phòng đã có người thuê
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
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

  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  roomIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
  },
  roomHeaderInfo: {
    flex: 1,
    gap: 8,
  },
  roomName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  buildingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  buildingName: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  imageContainer: {
    width: width,
    height: 220,
    backgroundColor: "#f1f5f9",
  },
  roomImage: {
    width: "100%",
    height: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },

  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e2e8f0",
  },
  separator: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },

  buildingCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  buildingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buildingTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 30,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },

  utilitiesContainer: {
    gap: 12,
  },
  utilitiesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  utilitiesGrid: {
    flexDirection: "row",
    gap: 12,
  },
  utilityBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  utilityLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  utilityValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },

  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: "#78350f",
    lineHeight: 20,
  },

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
