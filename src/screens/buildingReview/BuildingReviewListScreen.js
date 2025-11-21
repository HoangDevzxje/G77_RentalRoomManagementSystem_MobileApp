import React, { useEffect, useState, useCallback } from "react";
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
  SafeAreaView,
  StatusBar,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
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
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title || "Đánh giá tòa nhà"}
        </Text>
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

  // Optimistic delete with local state updates
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
                <Text style={styles.name}>{name}</Text>
                <View style={styles.ratingDateContainer}>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= (item.rating ?? 0) ? "star" : "star-outline"}
                        size={16}
                        color="#f59e0b"
                        style={{ marginRight: 2 }}
                      />
                    ))}
                  </View>
                  <Text style={styles.date}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Nút xóa icon - chỉ hiện khi có quyền */}
            {item.canDelete && (
              <TouchableOpacity
                onPress={() => onDelete(item._1d)}
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
      </View>

      <FlatList
        data={ratings}
        keyExtractor={(it) => it._id ?? String(Math.random())}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
            <Text style={styles.emptySubText}>
              Hãy là người đầu tiên đánh giá tòa nhà này
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  backBtn: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  summary: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryRating: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginLeft: 8,
    marginRight: 8,
  },
  summaryText: {
    color: "#64748b",
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
    flexGrow: 1,
  },
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
  itemDeleting: {
    opacity: 0.6,
    backgroundColor: "#fef2f2",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
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
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: 15,
  },
  ratingDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    flexWrap: "wrap",
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  date: {
    color: "#64748b",
    fontSize: 13,
  },
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
  actionRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteTextBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteTextBtnDisabled: {
    backgroundColor: "#fca5a5",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 4,
  },
  comment: {
    marginTop: 12,
    color: "#334155",
    fontSize: 15,
    lineHeight: 20,
  },
  imagesContainer: {
    marginTop: 12,
  },
  imagesContent: {
    paddingRight: 12,
  },
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
});
