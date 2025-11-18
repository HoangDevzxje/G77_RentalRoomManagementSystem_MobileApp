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
        <Text style={styles.emptyIcon}>🏠</Text>
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
            <Text style={styles.noImageIcon}>🏠</Text>
            <Text style={styles.noImageText}>Không có ảnh</Text>
          </View>
        )}
        <View style={styles.roomNumberBadge}>
          <Text style={styles.roomNumberText}>Phòng {roomNumber ?? "—"}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tòa nhà</Text>
              <Text style={styles.infoValue}>{building?.name ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue}>{building?.address ?? "—"}</Text>
            </View>
          </View>

          {building?.contact ? (
            <View style={styles.infoRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Liên hệ quản lý</Text>
                <Text style={styles.infoValue}>{building.contact}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tầng</Text>
              <Text style={styles.infoValue}>
                {typeof floor === "string"
                  ? floor
                  : floor?.name ?? floor?.floorNumber ?? "—"}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.priceRow]}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Giá thuê</Text>
              <Text style={styles.priceValue}>
                {price
                  ? `${Number(price).toLocaleString("vi-VN")} đ/tháng`
                  : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Contract Card */}
        {currentContract ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Hợp đồng</Text>
              <View style={styles.contractBadge}>
                <Text style={styles.contractBadgeText}>Đang hiệu lực</Text>
              </View>
            </View>

            <View style={styles.contractInfo}>
              <View style={styles.contractItem}>
                <Text style={styles.contractLabel}>Số hợp đồng</Text>
                <Text style={styles.contractValue}>
                  {currentContract.no ?? "—"}
                </Text>
              </View>
              <View style={styles.contractDivider} />
              <View style={styles.contractItem}>
                <Text style={styles.contractLabel}>Thời hạn</Text>
                <Text style={styles.contractValue}>
                  {formatDate(currentContract.startDate)} -{" "}
                  {formatDate(currentContract.endDate)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Tenants Card */}
        {(Array.isArray(tenants) && tenants.length > 0) ||
        (Array.isArray(contractRoommates) && contractRoommates.length > 0) ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Người ở cùng</Text>
            </View>

            {Array.isArray(tenants) && tenants.length > 0 ? (
              <>
                <Text style={styles.sectionSubtitle}>Có tài khoản</Text>
                {tenants.map((t) => (
                  <View key={t.id ?? t._id} style={styles.tenantCard}>
                    <View style={styles.tenantAvatar}>
                      <Text style={styles.tenantAvatarText}>
                        {(t.fullName ?? t.username ?? "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.tenantInfo}>
                      <Text style={styles.tenantName}>
                        {t.fullName ?? t.username ?? "—"}
                      </Text>
                      {t.phoneNumber ? (
                        <Text style={styles.tenantDetail}>{t.phoneNumber}</Text>
                      ) : null}
                      {t.username ? (
                        <Text style={styles.tenantUsername}>@{t.username}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {Array.isArray(contractRoommates) &&
            contractRoommates.length > 0 ? (
              <>
                <Text style={[styles.sectionSubtitle, { marginTop: 16 }]}>
                  Trong hợp đồng
                </Text>
                {contractRoommates.map((p, idx) => (
                  <View key={idx} style={styles.tenantCard}>
                    <View style={styles.tenantAvatar}>
                      <Text style={styles.tenantAvatarText}>
                        {(p.name ?? "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.tenantInfo}>
                      <Text style={styles.tenantName}>{p.name ?? "—"}</Text>
                      {p.phone ? (
                        <Text style={styles.tenantDetail}>📱 {p.phone}</Text>
                      ) : null}
                      {p.cccd ? (
                        <Text style={styles.tenantDetail}>🆔 {p.cccd}</Text>
                      ) : null}
                      {p.dob ? (
                        <Text style={styles.tenantDetail}>
                          🎂 {formatDate(p.dob)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ) : null}

        {/* Utilities Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tiện ích</Text>
          </View>

          <View style={styles.utilityRow}>
            <View style={styles.utilityCard}>
              <Text style={styles.utilityLabel}>Điện</Text>
              <Text style={styles.utilityValue}>{eStart ?? 0}</Text>
              <Text style={styles.utilityUnit}>kWh</Text>
            </View>
            <View style={styles.utilityCard}>
              <Text style={styles.utilityLabel}>Nước</Text>
              <Text style={styles.utilityValue}>{wStart ?? 0}</Text>
              <Text style={styles.utilityUnit}>m³</Text>
            </View>
          </View>
        </View>

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
              <Text style={styles.emptyFurnitureIcon}>📦</Text>
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
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f1f5f9",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },

  // Image Section
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  mainImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#e2e8f0",
  },
  noImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  noImageText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  roomNumberBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(13, 148, 136, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  roomNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },

  // Info Rows
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "600",
  },
  priceRow: {
    borderBottomWidth: 0,
    backgroundColor: "#f0fdfa",
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  priceValue: {
    fontSize: 18,
    color: "#0d9488",
    fontWeight: "700",
  },

  // Contract Section
  contractBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  contractBadgeText: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "600",
  },
  contractInfo: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  contractItem: {
    marginBottom: 8,
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
  contractDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },

  // Tenants Section
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tenantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0d9488",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tenantAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  tenantDetail: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  tenantUsername: {
    fontSize: 12,
    color: "#0d9488",
    fontWeight: "500",
    marginTop: 4,
  },

  // Utilities Section
  utilityRow: {
    flexDirection: "row",
    gap: 12,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  utilityLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: "600",
  },
  utilityValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  utilityUnit: {
    fontSize: 11,
    color: "#94a3b8",
  },

  // Furniture Section
  furnitureBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    borderRadius: 12,
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
  emptyFurnitureIcon: {
    fontSize: 48,
    marginBottom: 8,
    opacity: 0.5,
  },
  emptyFurnitureText: {
    color: "#94a3b8",
    fontSize: 14,
  },

  // Empty State
  emptyIcon: {
    fontSize: 64,
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

  // Button
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
