// screens/RoomScreen.jsx
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

function normalizeUri(uri) {
  if (!uri || typeof uri !== "string") return null;
  if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
  if (IMAGE_BASE_URL)
    return IMAGE_BASE_URL.replace(/\/$/, "") + "/" + uri.replace(/^\//, "");
  return uri;
}

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
      setFurnitures(Array.isArray(f) ? f : []);
    } catch (err) {
      console.error("Fetch room detail error:", err);
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
        {item?.condition ? (
          <Text style={styles.furnitureCondition}>{item.condition}</Text>
        ) : null}
      </View>
      <View style={styles.furnitureQtyBadge}>
        <Text style={styles.furnitureQty}>×{item?.quantity ?? 0}</Text>
      </View>
    </View>
  );

  const goToRoommates = () => {
    const roomId = room?.id ?? room?._id ?? room?.id ?? room?._id;
    if (!roomId) {
      Toast.show({ type: "info", text1: "ID phòng không sẵn sàng" });
      return;
    }
    navigation.navigate("Roommates", { roomId });
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
        <TouchableOpacity style={styles.btn} onPress={() => fetchData(true)}>
          <Text style={styles.btnText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    roomNumber,
    images,
    building,
    floor,
    area,
    price,
    currentContract,
    tenants,
    contractRoommates,
    eStart,
    wStart,
  } = room;

  const mainImageUri =
    Array.isArray(images) && images.length > 0 ? normalizeUri(images[0]) : null;

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("vi-VN");
    } catch {
      return d;
    }
  };

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
      {/* Header Image */}
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
        {/* Quick Actions Card */}
        <View style={styles.quickActionsCard}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={goToRoommates}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#f0fdfa" }]}
            >
              <Ionicons name="people" size={24} color="#0d9488" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Người ở cùng</Text>
              <Text style={styles.quickActionSubtitle}>
                {totalRoommates > 0
                  ? `${totalRoommates} thành viên`
                  : "Chưa có ai"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
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

        {/* Contract */}
        {currentContract ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Hợp đồng</Text>
              <View style={styles.contractBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                <Text style={styles.contractBadgeText}>Đang hiệu lực</Text>
              </View>
            </View>

            <View style={styles.contractInfo}>
              <View style={styles.contractRow}>
                <View style={styles.contractItem}>
                  <Text style={styles.contractLabel}>Số hợp đồng</Text>
                  <Text style={styles.contractValue}>
                    {currentContract.no ?? "—"}
                  </Text>
                </View>
                <View style={styles.contractItem}>
                  <Text style={styles.contractLabel}>Thời hạn</Text>
                  <Text style={styles.contractValue}>
                    {formatDate(currentContract.startDate)} -{" "}
                    {formatDate(currentContract.endDate)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Utilities */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Chỉ số tiện ích</Text>
          </View>

          <View style={styles.utilityRow}>
            <View style={styles.utilityCard}>
              <View
                style={[styles.utilityIcon, { backgroundColor: "#fef3c7" }]}
              >
                <Ionicons name="flash" size={24} color="#d97706" />
              </View>
              <Text style={styles.utilityLabel}>Điện</Text>
              <Text style={styles.utilityValue}>{eStart ?? 0}</Text>
              <Text style={styles.utilityUnit}>kWh</Text>
            </View>
            <View style={styles.utilityCard}>
              <View
                style={[styles.utilityIcon, { backgroundColor: "#dbeafe" }]}
              >
                <Ionicons name="water" size={24} color="#2563eb" />
              </View>
              <Text style={styles.utilityLabel}>Nước</Text>
              <Text style={styles.utilityValue}>{wStart ?? 0}</Text>
              <Text style={styles.utilityUnit}>m³</Text>
            </View>
          </View>
        </View>

        {/* Furniture */}
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
  // mainImage and noImage: hiển thị vuông, không bo tròn
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
  },
  noImageText: { color: "#94a3b8", fontSize: 14, marginTop: 8 },

  roomNumberBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(13, 148, 136, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  roomNumberText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
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
    fontWeight: "600",
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
    fontWeight: "600",
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
    fontWeight: "700",
  },

  contractBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  contractBadgeText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "600",
  },
  contractInfo: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
  },
  contractRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contractItem: {
    flex: 1,
  },
  contractLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  contractValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },

  tenantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tenantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0d9488",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tenantAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },

  utilityRow: {
    flexDirection: "row",
    gap: 12,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  utilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  utilityLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "600",
  },
  utilityValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  utilityUnit: {
    fontSize: 11,
    color: "#94a3b8",
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
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  furnitureCondition: {
    fontSize: 12,
    color: "#64748b",
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
    fontWeight: "700",
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
    fontSize: 20,
    fontWeight: "700",
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

  btn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
