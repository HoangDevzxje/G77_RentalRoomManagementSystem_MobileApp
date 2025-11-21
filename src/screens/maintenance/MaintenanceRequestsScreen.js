// screens/MaintenanceRequestsScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { listMyRoomRequests } from "../../api/maintenanceApi";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function MaintenanceRequestsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async (opts = { showLoading: true, page: 1 }) => {
    try {
      if (opts.showLoading) setLoading(true);
      else setRefreshing(true);

      const res = await listMyRoomRequests({ page: opts.page, limit });
      const payload = res ?? {};

      console.log("Maintenance requests response:", payload);

      // payload may be: { data: [...], room, total, page, ... } or it could be array (legacy)
      if (Array.isArray(payload)) {
        // older shape where API returned array directly
        setRequests(payload);
        setRoomInfo(null);
        setTotal(payload.length);
        setPage(opts.page || 1);
      } else {
        setRequests(Array.isArray(payload.data) ? payload.data : []);
        setRoomInfo(payload.room || null);
        setTotal(
          typeof payload.total === "number"
            ? payload.total
            : Array.isArray(payload.data)
            ? payload.data.length
            : 0
        );
        setPage(payload.page || opts.page || 1);
      }
    } catch (err) {
      console.error("load maintenance requests:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải danh sách yêu cầu",
      });
      setRequests([]);
      setRoomInfo(null);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load({ showLoading: true, page: 1 });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load({ showLoading: false, page: 1 });
    }, [])
  );

  const onRefresh = () => {
    load({ showLoading: false, page: 1 });
  };

  const goToCreate = () => navigation.navigate("CreateMaintenanceRequest");
  const goBack = () => navigation.goBack();

  const getStatusInfo = (status) => {
    switch (status) {
      case "open":
        return {
          color: "#fee2e2",
          textColor: "#dc2626",
          text: "Chờ xử lý",
          icon: "time-outline",
        };
      case "in_progress":
        return {
          color: "#fef3c7",
          textColor: "#d97706",
          text: "Đang xử lý",
          icon: "build-outline",
        };
      case "resolved":
        return {
          color: "#d1fae5",
          textColor: "#059669",
          text: "Đã hoàn thành",
          icon: "checkmark-done-outline",
        };
      case "rejected":
        return {
          color: "#f3f4f6",
          textColor: "#6b7280",
          text: "Đã từ chối",
          icon: "close-outline",
        };
      default:
        return {
          color: "#f3f4f6",
          textColor: "#6b7280",
          text: "Không xác định",
          icon: "help-outline",
        };
    }
  };

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case "low":
        return { color: "#10b981", text: "Thấp" };
      case "medium":
        return { color: "#3b82f6", text: "Bình thường" };
      case "high":
        return { color: "#f59e0b", text: "Cao" };
      case "urgent":
        return { color: "#ef4444", text: "Khẩn cấp" };
      default:
        return { color: "#94a3b8", text: "Không xác định" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  const renderItem = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.status);
    const priorityInfo = getPriorityInfo(item.priority);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === requests.length - 1 && styles.lastCard,
        ]}
        onPress={() =>
          navigation.navigate("MaintenanceDetail", {
            // gửi cả id và object request để tránh mất dữ liệu do shape khác
            requestId: item._id ?? item.id ?? item.requestId,
            request: item,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.badgeContainer}>
              {item.priority && (
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityInfo.color + "20" },
                  ]}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityInfo.color },
                    ]}
                  />
                  <Text
                    style={[styles.priorityText, { color: priorityInfo.color }]}
                  >
                    {priorityInfo.text}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Ionicons
              name={statusInfo.icon}
              size={14}
              color={statusInfo.textColor}
            />
            <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>
                {item.furnitureId?.name ?? "Nội thất"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="copy-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>
                {item.affectedQuantity || 1} cái
              </Text>
            </View>
          </View>

          {item.assigneeName ? (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <Text style={styles.metaText}>{item.assigneeName}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={16} color="#9ca3af" />
                <Text style={styles.metaTextLight}>Chưa gán người xử lý</Text>
              </View>
            </View>
          )}

          {item.scheduledAt && (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.metaText}>
                  {new Date(item.scheduledAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.timeSection}>
            <Ionicons name="time-outline" size={14} color="#9ca3af" />
            <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
          </View>

          {item.estimatedCost && (
            <View style={styles.costSection}>
              <Text style={styles.costLabel}>Dự tính:</Text>
              <Text style={styles.costText}>
                {Number(item.estimatedCost).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#0f766e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Yêu cầu bảo trì</Text>
            {roomInfo && (
              <Text style={styles.roomInfo}>
                Phòng {roomInfo.roomNumber} • {roomInfo.building?.name}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={goToCreate}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) =>
            item._id ?? item.id ?? `request-${index}`
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0d9488"]}
              tintColor="#0d9488"
            />
          }
          ListHeaderComponent={
            total > 0 && (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {total} yêu cầu bảo trì
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="construct-outline" size={80} color="#d1d5db" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có yêu cầu bảo trì</Text>
              <Text style={styles.emptySubtitle}>
                Bắt đầu bằng cách tạo yêu cầu mới để báo cáo sự cố nội thất
                trong phòng của bạn
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={goToCreate}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.emptyCreateButtonText}>
                  Tạo yêu cầu đầu tiên
                </Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  roomInfo: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginLeft: 12,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  firstCard: {
    marginTop: 4,
  },
  lastCard: {
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 22,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    gap: 12,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
  metaTextLight: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  costSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  costLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  costText: {
    fontSize: 13,
    color: "#0d9488",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#0d9488",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyCreateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
