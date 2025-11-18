import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import HeroSection from "../../components/Homepage/HeroSection";
import WhyChoose from "../../components/Homepage/WhyChoose";
import Testimonials from "../../components/Homepage/Testimonials";
import PostCard from "../../components/post/PostCard";
import { useAuth } from "../../context/AuthContext";
import { getPosts } from "../../api/postApi";
import { getMyRoomDetail } from "../../api/roomApi";
import { useFocusEffect } from "@react-navigation/native";
import StatsSection from "../../components/Homepage/StatsSection";

const { width } = Dimensions.get("window");
const HORIZONTAL_PADDING = 16;
const CARD_SPACING = 12;
const NUM_COLUMNS = 2;
const AVAILABLE_WIDTH = width - HORIZONTAL_PADDING * 2;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_SPACING) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

export default function HomeCombinedScreen({ navigation, route }) {
  const scrollViewRef = useRef(null);
  const { isAuthenticated } = useAuth();

  // login-toast
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // ROOM (tenant's room)
  const [roomLoading, setRoomLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [furnitures, setFurnitures] = useState([]);

  // POSTS (listings)
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // refresh
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkLoginSuccess();
  }, []);

  useEffect(() => {
    if (route?.params?.fromLogin) {
      setShowSuccessAlert(true);
      const t = setTimeout(() => setShowSuccessAlert(false), 2000);
      return () => clearTimeout(t);
    }
  }, [route?.params]);

  const checkLoginSuccess = async () => {
    try {
      const justLoggedIn = await AsyncStorage.getItem("justLoggedIn");
      if (justLoggedIn === "true") {
        setShowSuccessAlert(true);
        await AsyncStorage.removeItem("justLoggedIn");
        const t = setTimeout(() => setShowSuccessAlert(false), 2000);
        return () => clearTimeout(t);
      }
    } catch (err) {
      console.log("checkLoginSuccess err", err);
    }
  };

  // --- ROOM fetch ---
  const fetchRoom = async (showLoading = true) => {
    try {
      if (showLoading) setRoomLoading(true);
      const res = await getMyRoomDetail();
      setRoom(res?.room || null);
      setFurnitures(Array.isArray(res?.furnitures) ? res.furnitures : []);
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
      if (showLoading) setRoomLoading(false);
      setRefreshing(false);
    }
  };

  // --- POSTS fetch (paginated) ---
  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (!append) {
        setPostsLoading(true);
        setPostsError(null);
      } else {
        setPostsLoadingMore(true);
      }

      const params = { page, limit: 20 };
      if (searchQuery?.trim()) params.keyword = searchQuery.trim();
      if (route?.params?.buildingId)
        params.buildingId = route.params.buildingId;

      const res = await getPosts(params);
      const items = res.data || res;
      if (append) {
        setPosts((prev) => [...prev, ...(items || [])]);
      } else {
        setPosts(items || []);
      }
      if (res.pagination) {
        setPostsTotalPages(res.pagination.totalPages || 1);
      } else {
        setPostsTotalPages(1);
      }
      setPostsPage(page);
    } catch (err) {
      console.error("fetchPosts err", err);
      setPostsError(
        err?.response?.data?.message || err?.message || "Lỗi tải bài đăng"
      );
    } finally {
      setPostsLoading(false);
      setPostsLoadingMore(false);
    }
  };

  // initial loads
  useEffect(() => {
    fetchRoom(true);
    if (isAuthenticated) fetchPosts(1, false);
    else {
      setPostsError("Vui lòng đăng nhập để xem danh sách bài đăng");
      setPostsLoading(false);
    }
  }, [isAuthenticated]);

  // refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchRoom(false);
      if (isAuthenticated) fetchPosts(1, false);
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoom(false);
    if (isAuthenticated) fetchPosts(1, false);
    else setRefreshing(false);
  };

  const handleLoadMorePosts = () => {
    if (postsLoadingMore) return;
    if (postsPage < postsTotalPages) {
      const next = postsPage + 1;
      fetchPosts(next, true);
    }
  };

  const onSearchPosts = () => {
    if (!isAuthenticated) {
      setPostsError("Vui lòng đăng nhập để tìm phòng");
      return;
    }
    fetchPosts(1, false);
  };

  const renderFurniture = ({ item }) => (
    <View style={styles.furnitureCard}>
      <View style={styles.furnitureLeft}>
        <Text style={styles.furnitureName} numberOfLines={1}>
          {item?.name || "Không tên"}
        </Text>
        {item?.description ? (
          <Text style={styles.furnitureDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.furnitureMeta}>
        <Text style={styles.furnitureQty}>x{item?.quantity ?? 0}</Text>
        {item?.condition ? (
          <Text style={styles.furnitureCondition}>{item.condition}</Text>
        ) : null}
      </View>
    </View>
  );

  // Preview posts = first 4 posts
  const previewPosts = (posts || []).slice(0, 4);

  return (
    <View style={styles.container}>
      {showSuccessAlert && (
        <View style={[styles.topAlert, styles.successAlert]}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="white"
            style={styles.alertIcon}
          />
          <Text style={styles.alertMessage}>Đăng nhập thành công</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HERO + STATS */}
        <HeroSection navigation={navigation} />
        <StatsSection />

        {/* POSTS PREVIEW SECTION */}
        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <View style={styles.postsHeaderLeft}>
              <Text style={styles.postsTitle}>Tìm phòng</Text>
              <Text style={styles.postsSubtitle}>
                Gợi ý phòng gần bạn — xem trước 4 phòng mới nhất
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("PostList", {
                  buildingId: route?.params?.buildingId || null,
                })
              }
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={18} color="#0d9488" />
            </TouchableOpacity>
          </View>

          {postsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0d9488" />
              <Text style={styles.loadingText}>
                Đang tải danh sách bài đăng...
              </Text>
            </View>
          ) : postsError ? (
            <View style={styles.centerCard}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.error}>{postsError}</Text>
              {!isAuthenticated && (
                <TouchableOpacity
                  style={styles.authBtn}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Ionicons name="log-in-outline" size={16} color="#fff" />
                  <Text style={styles.authBtnText}>Đăng nhập</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : previewPosts.length === 0 ? (
            <View style={styles.centerCard}>
              <Ionicons name="home-outline" size={48} color="#94a3b8" />
              <Text style={styles.noResults}>Chưa có phòng để hiển thị</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {previewPosts.map((item, index) => (
                <View
                  key={item._id || item.id || index}
                  style={styles.postCardWrapper}
                >
                  <PostCard
                    post={item}
                    cardWidth={CARD_WIDTH}
                    cardHeight={CARD_HEIGHT}
                    onPress={() =>
                      navigation.navigate("RoomDetail", { id: item._id })
                    }
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* WHY CHOOSE / TESTIMONIALS */}
        <WhyChoose />
        <Testimonials />

        {/* ROOM DETAIL (show only when tenant has a room) */}
        {roomLoading ? (
          <View style={styles.roomLoader}>
            <ActivityIndicator size="small" color="#0d9488" />
            <Text style={styles.loadingText}>Đang tải thông tin phòng...</Text>
          </View>
        ) : room ? (
          <View style={styles.roomCardWrapper}>
            <View style={styles.roomCard}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomTitle}>Chi tiết phòng của bạn</Text>
                <TouchableOpacity
                  style={styles.roomAction}
                  onPress={() =>
                    navigation.navigate("RoomDetail", { id: room.id })
                  }
                >
                  <Ionicons name="chevron-forward" size={20} color="#0d9488" />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Số phòng</Text>
                <Text style={styles.value}>{room.roomNumber ?? "—"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Tòa nhà</Text>
                <Text style={styles.value}>{room.building?.name ?? "—"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Địa chỉ</Text>
                <Text style={styles.value}>
                  {room.building?.address ?? "—"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Diện tích</Text>
                <Text style={styles.value}>
                  {room.area ? `${room.area} m²` : "—"}
                </Text>
              </View>

              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.label}>Giá thuê</Text>
                <Text style={styles.value}>
                  {room.price
                    ? `${Number(room.price).toLocaleString("vi-VN")} đ/tháng`
                    : "Liên hệ"}
                </Text>
              </View>

              {furnitures.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Nội thất trong phòng
                    </Text>
                    <Text style={styles.sectionSub}>
                      {furnitures.length} mục
                    </Text>
                  </View>

                  <FlatList
                    data={furnitures}
                    keyExtractor={(i) =>
                      i.id?.toString() || `${i.furnitureId || i.name}`
                    }
                    renderItem={renderFurniture}
                    scrollEnabled={false}
                  />
                </>
              )}
            </View>
          </View>
        ) : null}

        <View style={{ height: 48 }} />
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f9ff" },
  scrollView: { flex: 1 },

  topAlert: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successAlert: { backgroundColor: "#10B981" },
  alertIcon: { marginRight: 8 },
  alertMessage: { color: "white", fontSize: 14, fontWeight: "500", flex: 1 },

  postsSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 16,
  },
  postsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  postsHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  postsTitle: {
    fontSize: 22,
    fontWeight: "650",
    color: "#0f172a",
    marginBottom: 4,
  },
  postsSubtitle: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  viewAllText: {
    color: "#0d9488",
    fontWeight: "700",
    fontSize: 13,
  },

  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  postCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: CARD_SPACING,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  centerCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 8,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  error: {
    color: "#ef4444",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  noResults: {
    color: "#64748b",
    fontSize: 15,
    marginTop: 12,
    textAlign: "center",
  },
  authBtn: {
    marginTop: 20,
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  authBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },

  roomLoader: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  roomCardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  roomCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  roomAction: {
    padding: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  label: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionSub: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  furnitureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  furnitureLeft: {
    flex: 1,
    paddingRight: 12,
  },
  furnitureName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  furnitureDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  furnitureMeta: {
    alignItems: "flex-end",
  },
  furnitureQty: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0d9488",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  furnitureCondition: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "600",
  },
});
