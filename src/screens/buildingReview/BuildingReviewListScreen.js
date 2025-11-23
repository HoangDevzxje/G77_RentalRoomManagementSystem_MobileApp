import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  fetchBuildingReviews,
  removeMyReview,
} from "../../api/buildingReviewApi";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Header = ({ title, onBack }) => {
  const androidStatus =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  return (
    <SafeAreaView style={[styles.headerSafe, { paddingTop: androidStatus }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title || "Đánh giá tòa nhà"}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );
};

export default function BuildingReviewListScreen({ route, navigation }) {
  const { buildingId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [starFilter, setStarFilter] = useState("all");
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { user } = useAuth();

  const fetchRatings = async () => {
    if (!buildingId) return;
    try {
      setLoading(true);
      const res = await fetchBuildingReviews(buildingId, {
        page: 1,
        limit: 50,
      });

      const ratingsData = res.ratings ?? res.data?.ratings ?? [];

      const ratingsWithDeleteFlag = ratingsData.map((rating) => ({
        ...rating,
        canDelete: user && rating.userId === user.id,
      }));

      setSummary(res.summary ?? res.data?.summary ?? null);
      setRatings(ratingsWithDeleteFlag);
    } catch (err) {
      Toast.show({ type: "error", text1: "Lỗi tải đánh giá" });
      setRatings([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRatings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRatings();
  };

  const onDelete = (ratingId) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa đánh giá này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          let deletedItem = null;
          try {
            setDeletingId(ratingId);

            deletedItem = ratings.find((r) => r._id === ratingId);

            // optimistic UI update
            setRatings((prev) => prev.filter((r) => r._id !== ratingId));

            setSummary((prev) => {
              if (!prev) return prev;
              const newTotal = Math.max(0, (prev.totalRatings || 1) - 1);
              return {
                ...prev,
                totalRatings: newTotal,
              };
            });

            await removeMyReview(ratingId);

            Toast.show({
              type: "success",
              text1: "Đã xóa đánh giá",
              text2: "Đánh giá của bạn đã được xóa thành công",
            });
          } catch (err) {
            // rollback optimistic update on failure
            if (deletedItem) {
              setRatings((prev) =>
                [...prev, deletedItem].sort(
                  (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
              );

              setSummary((prev) => ({
                ...prev,
                totalRatings: (prev?.totalRatings || 0) + 1,
              }));
            }

            Toast.show({
              type: "error",
              text1: "Xóa thất bại",
              text2: err.message || "Vui lòng thử lại sau",
            });
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleLongPressItem = (item) => {
    if (item.canDelete) {
      Alert.alert("Xóa đánh giá", "Bạn có muốn xóa đánh giá này?", [
        { text: "Không", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => onDelete(item._id),
        },
      ]);
    } else {
      Toast.show({
        type: "info",
        text1: "Không thể xóa",
        text2: "Bạn chỉ có thể xóa đánh giá của chính mình",
      });
    }
  };

  const renderItem = ({ item }) => {
    const user = item.user ?? null;
    const avatar = user?.avatar ?? null;
    const name = item.isAnonymous ? "Ẩn danh" : user?.fullName ?? "Người dùng";
    const isDeleting = deletingId === item._id;

    return (
      <TouchableWithoutFeedback
        onLongPress={() => handleLongPressItem(item)}
        delayLongPress={600}
      >
        <View style={[styles.item, isDeleting && styles.itemDeleting]}>
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
              <View style={styles.userDetails}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.name}>{name}</Text>
                  <View style={{ width: 8 }} />
                  <View style={styles.smallStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= (item.rating ?? 0) ? "star" : "star-outline"}
                        size={14}
                        color="#f59e0b"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.date}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </Text>
              </View>
            </View>

            {item.canDelete && (
              <TouchableOpacity
                onPress={() => onDelete(item._id)}
                style={styles.deleteBtn}
                accessibilityRole="button"
                accessibilityLabel="Xóa đánh giá"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <Ionicons name="trash-outline" size={19} color="#ef4444" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {item.comment ? (
            <Text style={styles.comment}>{item.comment}</Text>
          ) : null}

          {item.images && item.images.length > 0 ? (
            <ScrollView
              horizontal
              style={styles.imagesContainer}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesContent}
            >
              {item.images.map((uri, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.9}
                  onPress={() => {}}
                >
                  <Image
                    source={{ uri }}
                    style={styles.reviewImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Filtered list based on starFilter only
  const filteredRatings = useMemo(() => {
    if (starFilter === "all") return ratings;
    return ratings.filter((r) => (r.rating ?? 0) === Number(starFilter));
  }, [ratings, starFilter]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Danh sách đánh giá" onBack={() => navigation.goBack()} />

      {/* Summary + filter row */}
      <View style={styles.summary}>
        <View style={styles.summaryContent}>
          <Ionicons name="star" size={20} color="#f59e0b" />
          <Text style={styles.summaryRating}>
            {summary?.averageRating ? `${summary.averageRating}/5` : "—"}
          </Text>
          <Text style={styles.summaryText}>
            {summary
              ? `• ${summary.totalRatings ?? 0} đánh giá`
              : "Chưa có đánh giá"}
          </Text>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Lọc theo số sao</Text>
          <TouchableOpacity
            style={styles.filterBox}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.filterText}>
              {starFilter === "all"
                ? "Tất cả đánh giá: "
                : `Đánh giá: ${starFilter} `}
            </Text>
            <Ionicons name="star" size={16} color="#f59e0b" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredRatings}
        keyExtractor={(it) => it._id ?? String(Math.random())}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Không có đánh giá phù hợp</Text>
            <Text style={styles.emptySubText}>
              Thử đổi bộ lọc sang "Tất cả"
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn số sao</Text>
            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  starFilter === "all" && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setStarFilter("all");
                  setFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    starFilter === "all" && styles.modalOptionTextActive,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>

              {[5, 4, 3, 2, 1].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.modalOption,
                    starFilter === n && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setStarFilter(n);
                    setFilterModalVisible(false);
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="star"
                      size={16}
                      color={starFilter === n ? "#fff" : "#f59e0b"}
                    />
                    <Text
                      style={[
                        styles.modalOptionText,
                        starFilter === n && styles.modalOptionTextActive,
                      ]}
                    >
                      {n} sao
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerSafe: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backBtn: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14 },

  summary: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryRating: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginLeft: 8,
    marginRight: 8,
  },
  summaryText: { color: "#64748b", fontSize: 16 },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterLabel: { fontSize: 13, color: "#64748b", marginRight: 12 },
  filterBox: {
    height: 44,
    minWidth: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },

  listContent: { padding: 16, paddingTop: 12, flexGrow: 1 },
  item: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemDeleting: { opacity: 0.6, backgroundColor: "#fef2f2" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#64748b",
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: { marginLeft: 12, flex: 1 },
  name: { fontWeight: "700", color: "#0f172a", fontSize: 15 },
  smallStars: { flexDirection: "row", marginLeft: 4 },
  date: { color: "#64748b", fontSize: 13, marginTop: 4 },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  comment: { marginTop: 12, color: "#334155", fontSize: 15, lineHeight: 20 },
  imagesContainer: { marginTop: 12 },
  imagesContent: { paddingRight: 12 },
  reviewImage: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.2,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
  },
  emptySubText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  modalContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "30%",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  modalOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6eef0",
    marginRight: 8,
    marginBottom: 8,
  },
  modalOptionActive: { backgroundColor: "#0d9488", borderColor: "#0d9488" },
  modalOptionText: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    marginLeft: 6,
  },
  modalOptionTextActive: { color: "#fff" },
  modalCancel: { marginTop: 8, alignItems: "center", paddingVertical: 10 },
  modalCancelText: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
});
