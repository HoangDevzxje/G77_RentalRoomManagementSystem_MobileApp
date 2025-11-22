import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";
import { getMyRoomDetail } from "../../api/roomApi";
import { Ionicons } from "@expo/vector-icons";

const IMAGE_BASE_URL = "";

// normalize image uri helper
function normalizeUri(uri) {
  if (!uri || typeof uri !== "string") return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (IMAGE_BASE_URL)
    return IMAGE_BASE_URL.replace(/\/$/, "") + "/" + uri.replace(/^\//, "");
  return uri;
}

// Helper functions để hiển thị thông tin điện nước
const getElectricityDisplay = (electricity) => {
  if (!electricity) return "—";

  const { indexType, price } = electricity;

  switch (indexType) {
    case "byNumber":
      return price > 0
        ? `${Number(price).toLocaleString("vi-VN")} đ/kWh`
        : "Miễn phí";
    case "included":
      return "Đã bao gồm trong giá thuê";
    default:
      return "—";
  }
};

const getWaterDisplay = (water) => {
  if (!water) return "—";

  const { indexType, price } = water;

  switch (indexType) {
    case "byNumber":
      return price > 0
        ? `${Number(price).toLocaleString("vi-VN")} đ/m³`
        : "Miễn phí";
    case "byPerson":
      return price > 0
        ? `${Number(price).toLocaleString("vi-VN")} đ/người`
        : "Miễn phí";
    case "included":
      return "Đã bao gồm trong giá thuê";
    default:
      return "—";
  }
};

const getElectricityDescription = (electricity) => {
  if (!electricity) return "";
  switch (electricity.indexType) {
    case "byNumber":
      return "Tính theo chỉ số công tơ";
    case "included":
      return "Đã bao gồm trong tiền thuê";
    default:
      return "";
  }
};

const getWaterDescription = (water) => {
  if (!water) return "";
  switch (water.indexType) {
    case "byNumber":
      return "Tính theo chỉ số đồng hồ nước";
    case "byPerson":
      return "Tính theo số người";
    case "included":
      return "Đã bao gồm trong tiền thuê";
    default:
      return "";
  }
};

const getServiceIcon = (serviceName) => {
  const icons = {
    internet: "wifi",
    parking: "car-sport",
    cleaning: "brush",
    security: "shield-checkmark",
    other: "ellipsis-horizontal",
  };
  return icons[serviceName] || "cube";
};

const getServiceColor = (serviceName) => {
  const colors = {
    internet: "#3B82F6",
    parking: "#10B981",
    cleaning: "#8B5CF6",
    security: "#EF4444",
    other: "#6B7280",
  };
  return colors[serviceName] || "#6B7280";
};

export default function RoomScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [room, setRoom] = useState(null);
  const [furnitures, setFurnitures] = useState([]);

  const parseResponse = (res) => {
    const payload = res && res.data ? res.data : res || {};
    const roomObj = payload.room ?? payload.data?.room ?? payload;
    const furn = payload.furnitures ?? payload.data?.furnitures ?? [];
    return { room: roomObj, furnitures: Array.isArray(furn) ? furn : [] };
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await getMyRoomDetail();
      const { room: r, furnitures: f } = parseResponse(res);
      setRoom(r || null);

      const safeFurnitures = Array.isArray(f)
        ? f.map((it) => {
            const { condition, ...rest } = it || {};
            return rest;
          })
        : [];
      setFurnitures(safeFurnitures);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải thông tin phòng",
        position: "top",
      });
      setRoom(null);
      setFurnitures([]);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const renderFurniture = ({ item }) => (
    <View style={styles.furnitureCard}>
      <View style={styles.furnitureContent}>
        <Text style={styles.furnitureName} numberOfLines={1}>
          {item?.name || "Không tên"}
        </Text>
      </View>
      <View style={styles.furnitureQtyBadge}>
        <Text style={styles.furnitureQty}>×{item?.quantity ?? 0}</Text>
      </View>
    </View>
  );

  const renderService = ({ item }) => (
    <View style={styles.serviceCard}>
      <View
        style={[
          styles.serviceIcon,
          { backgroundColor: `${getServiceColor(item.name)}10` },
        ]}
      >
        <Ionicons
          name={getServiceIcon(item.name)}
          size={20}
          color={getServiceColor(item.name)}
        />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName}>{item.label}</Text>
        {item.description ? (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.servicePrice}>
        <Text style={styles.servicePriceText}>{item.displayText}</Text>
      </View>
    </View>
  );

  const goToRoommates = () => {
    const roomId = room?.id ?? room?._id ?? null;
    if (!roomId) {
      Toast.show({ type: "info", text1: "ID phòng không sẵn sàng" });
      return;
    }
    navigation.navigate("Roommates", { roomId });
  };

  const goToMaintenanceList = () => {
    const roomId = room?.id ?? room?._id ?? null;
    navigation.navigate("MaintenanceRequests", { roomId });
  };

  const openBuildingReviewList = () => {
    const buildingId = room?.building?._id ?? room?.buildingId ?? null;
    if (!buildingId) {
      Toast.show({ type: "info", text1: "Thông tin tòa nhà không sẵn sàng" });
      return;
    }
    navigation.navigate("BuildingReviewList", { buildingId });
  };

  const openCreateBuildingReview = () => {
    const buildingId = room?.building?._id ?? room?.buildingId ?? null;
    if (!buildingId) {
      Toast.show({ type: "info", text1: "Thông tin tòa nhà không sẵn sàng" });
      return;
    }
    navigation.navigate("CreateBuildingReview", {
      buildingId,
      buildingName: room?.building?.name ?? null,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải thông tin phòng...</Text>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="home-outline" size={64} color="#cbd5e1" />
        </View>
        <Text style={styles.emptyTitle}>Chưa có phòng</Text>
        <Text style={styles.emptyText}>
          Bạn chưa được gán vào phòng nào hoặc không có dữ liệu.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => fetchData(true)}
        >
          <Text style={styles.primaryButtonText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    roomNumber,
    images,
    floor,
    area,
    price,
    currentContract,
    tenants,
    contractRoommates,
    eStart,
    wStart,
    electricity,
    water,
    building,
    services = [],
  } = room;

  const mainImageUri =
    Array.isArray(images) && images.length > 0 ? normalizeUri(images[0]) : null;

  const totalRoommates =
    (Array.isArray(tenants) ? tenants.length : 0) +
    (Array.isArray(contractRoommates) ? contractRoommates.length : 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0d9488"
          colors={["#0d9488"]}
        />
      }
    >
      <View style={styles.imageContainer}>
        {mainImageUri ? (
          <Image source={{ uri: mainImageUri }} style={styles.mainImage} />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="home-outline" size={48} color="#94a3b8" />
            <Text style={styles.noImageText}>Không có ảnh</Text>
          </View>
        )}
        <View style={styles.roomNumberBadge}>
          <Text style={styles.roomNumberText}>Phòng {roomNumber ?? "—"}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.quickActionsCard}>
          {/* Người ở cùng */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={goToRoommates}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#f0f9ff" }]}>
              <Ionicons name="people" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Người ở cùng</Text>
              <Text style={styles.actionSubtitle}>
                {totalRoommates > 0
                  ? `${totalRoommates} thành viên`
                  : "Chưa có ai"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Yêu cầu bảo trì */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={goToMaintenanceList}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#fef7ed" }]}>
              <Ionicons name="construct" size={20} color="#f59e0b" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Yêu cầu bảo trì</Text>
              <Text style={styles.actionSubtitle}>
                Xem & theo dõi các yêu cầu của phòng
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Gửi đánh giá */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={openCreateBuildingReview}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="star" size={18} color="#22c55e" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Gửi đánh giá tòa nhà</Text>
              <Text style={styles.actionSubtitle}>
                Chia sẻ trải nghiệm của bạn
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Xem đánh giá */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={openBuildingReviewList}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#faf5ff" }]}>
              <Ionicons name="book" size={18} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Xem đánh giá tòa nhà</Text>
              <Text style={styles.actionSubtitle}>Danh sách đánh giá</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="business" size={18} color="#0d9488" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tòa nhà</Text>
                <Text style={styles.infoValue}>{building?.name ?? "—"}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location" size={18} color="#0d9488" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {building?.address ?? "—"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="layers" size={18} color="#0d9488" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tầng</Text>
                <Text style={styles.infoValue}>
                  {typeof floor === "string"
                    ? floor
                    : floor?.name ?? floor?.floorNumber ?? "—"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="resize" size={18} color="#0d9488" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Diện tích</Text>
                <Text style={styles.infoValue}>
                  {area ? `${area} m²` : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="play-forward" size={18} color="#0d9488" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Chỉ số điện đầu</Text>
                <Text style={styles.infoValue}>{eStart ?? 0}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="play-forward" size={18} color="#0d9488" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Chỉ số nước đầu</Text>
                <Text style={styles.infoValue}>{wStart ?? 0}</Text>
              </View>
            </View>
          </View>

          {building?.contact ? (
            <View style={styles.contactSection}>
              <View style={styles.contactHeader}>
                <Ionicons name="call" size={16} color="#64748b" />
                <Text style={styles.contactLabel}>Liên hệ quản lý</Text>
              </View>
              <Text style={styles.contactValue}>{building.contact}</Text>
            </View>
          ) : null}

          <View style={styles.priceSection}>
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Giá thuê</Text>
              <Text style={styles.priceValue}>
                {price
                  ? `${Number(price).toLocaleString("vi-VN")} đ/tháng`
                  : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Electricity and Water Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Điện & Nước</Text>
          </View>

          <View style={styles.utilityGrid}>
            <View style={styles.utilityItem}>
              <View
                style={[styles.utilityIcon, { backgroundColor: "#fef7ed" }]}
              >
                <Ionicons name="flash" size={20} color="#d97706" />
              </View>
              <View style={styles.utilityContent}>
                <Text style={styles.utilityTitle}>Điện</Text>
                <Text style={styles.utilitySubtitle}>
                  {getElectricityDisplay(electricity)}
                </Text>
                <Text style={styles.utilityDescription}>
                  {getElectricityDescription(electricity)}
                </Text>
              </View>
            </View>

            <View style={styles.utilityItem}>
              <View
                style={[styles.utilityIcon, { backgroundColor: "#f0f9ff" }]}
              >
                <Ionicons name="water" size={20} color="#0ea5e9" />
              </View>
              <View style={styles.utilityContent}>
                <Text style={styles.utilityTitle}>Nước</Text>
                <Text style={styles.utilitySubtitle}>
                  {getWaterDisplay(water)}
                </Text>
                <Text style={styles.utilityDescription}>
                  {getWaterDescription(water)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Services Card */}
        {services && services.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Dịch vụ</Text>
              <View style={styles.servicesBadge}>
                <Text style={styles.servicesBadgeText}>{services.length}</Text>
              </View>
            </View>

            <FlatList
              data={services}
              keyExtractor={(item, index) => `service-${item.id || index}`}
              renderItem={renderService}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Furniture Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Nội thất</Text>
            {furnitures && furnitures.length > 0 ? (
              <View style={styles.furnitureBadge}>
                <Text style={styles.furnitureBadgeText}>
                  {furnitures.length}
                </Text>
              </View>
            ) : null}
          </View>

          {furnitures && furnitures.length > 0 ? (
            <FlatList
              data={furnitures}
              keyExtractor={(it, i) => `${it.name ?? "f"}-${i}`}
              renderItem={renderFurniture}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyFurniture}>
              <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyFurnitureText}>
                Chưa có nội thất được ghi nhận
              </Text>
            </View>
          )}
        </View>
      </View>

      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8fafc",
  },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14 },

  imageContainer: { position: "relative", marginBottom: 16 },
  mainImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e2e8f0",
  },
  noImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noImageText: { color: "#94a3b8", fontSize: 14, marginTop: 8 },

  roomNumberBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(13, 148, 136, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roomNumberText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 68,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    marginBottom: 12,
  },
  infoItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },

  descriptionSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },

  contactSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },

  priceSection: {
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0d9488",
  },
  priceContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 16,
    color: "#0d9488",
    fontWeight: "600",
  },

  utilityGrid: {
    marginBottom: 12,
  },
  utilityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  utilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  utilityContent: {
    flex: 1,
  },
  utilityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  utilitySubtitle: {
    fontSize: 14,
    color: "#0d9488",
    fontWeight: "500",
    marginBottom: 2,
  },
  utilityDescription: {
    fontSize: 12,
    color: "#64748b",
  },

  servicesBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  servicesBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: "#64748b",
  },
  servicePrice: {
    alignItems: "flex-end",
  },
  servicePriceText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0d9488",
  },

  furnitureBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  furnitureBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  furnitureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  furnitureContent: {
    flex: 1,
    paddingRight: 12,
  },
  furnitureName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 2,
  },
  furnitureQtyBadge: {
    backgroundColor: "#0d9488",
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  furnitureQty: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  emptyFurniture: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyFurnitureText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },

  primaryButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
