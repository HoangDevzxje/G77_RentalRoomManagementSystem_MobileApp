import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import PostCard from "../../components/post/PostCard";
import { useAuth } from "../../context/AuthContext";
import { getPosts } from "../../api/postApi";

const { width, height } = Dimensions.get("window");
const HORIZONTAL_PADDING = 16;
const CARD_SPACING = 12;
const NUM_COLUMNS = 2;
const AVAILABLE_WIDTH = width - HORIZONTAL_PADDING * 2;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_SPACING) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

// match RoomDetail header spacing
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 40;

export default function PostListScreen({ route, navigation }) {
  const buildingId = route.params?.buildingId;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchPosts = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page: pageNum,
        limit: 20,
      };

      if (buildingId) params.buildingId = buildingId;
      if (searchQuery.trim()) params.keyword = searchQuery.trim();

      const response = await getPosts(params);

      if (isLoadMore) {
        setPosts((prev) => [...prev, ...(response.data || response)]);
      } else {
        setPosts(response.data || response);
      }

      if (response.pagination) setTotalPages(response.pagination.totalPages);
      else setTotalPages(1);
      setError(null);
    } catch (err) {
      setError(`Lỗi: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setPage(1);
      fetchPosts(1, false);
    } else {
      setError("Vui lòng đăng nhập để xem danh sách bài đăng");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId, searchQuery, isAuthenticated]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  const renderPostItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <PostCard
        post={item}
        cardWidth={CARD_WIDTH}
        cardHeight={CARD_HEIGHT}
        onPress={() => navigation.navigate("RoomDetail", { id: item._id })}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0d9488" />
        <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header — styled to match RoomDetailScreen */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("Home");
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Danh sách phòng
        </Text>

        {/* right spacer to keep title centered */}
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <View style={styles.loadingIconContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#0d9488" />
          </View>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải danh sách bài đăng...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text style={styles.error}>{error}</Text>
          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons
                name="log-in-outline"
                size={18}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Ionicons
                name="search-outline"
                size={20}
                color="#94a3b8"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm theo tiêu đề hoặc địa chỉ..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => {
                  setPage(1);
                  fetchPosts(1, false);
                }}
              />
              {searchQuery !== "" && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setPage(1);
                    fetchPosts(1, false);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.resultCountContainer}>
            <View style={styles.resultCountWrapper}>
              <Ionicons name="list-outline" size={18} color="#0d9488" />
              <Text style={styles.resultCount}>
                Tìm thấy {posts.length} bài đăng{" "}
                {page < totalPages && `(trang ${page}/${totalPages})`}
              </Text>
            </View>
          </View>

          {posts.length === 0 ? (
            <View style={styles.center}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="file-tray-outline" size={64} color="#94a3b8" />
              </View>
              <Text style={styles.noResults}>Không tìm thấy bài đăng nào</Text>
              <Text style={styles.noResultsSub}>
                {searchQuery
                  ? `với từ khóa "${searchQuery}"`
                  : buildingId
                  ? "trong tòa nhà này"
                  : "phù hợp với tìm kiếm"}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    setSearchQuery("");
                    setPage(1);
                    fetchPosts(1, false);
                  }}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Xóa tìm kiếm</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={posts}
              keyExtractor={(item) => item._id || item.id}
              renderItem={renderPostItem}
              showsVerticalScrollIndicator={false}
              numColumns={NUM_COLUMNS}
              columnWrapperStyle={styles.row}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  /* Header (matching RoomDetail header) */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 16,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    textAlign: "center",
  },
  headerRight: { width: 40 },

  /* Content wrapper (below header) */
  content: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  loadingIconContainer: {
    marginBottom: 16,
    opacity: 0.8,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  emptyIconContainer: {
    marginBottom: 16,
    opacity: 0.6,
  },

  searchContainer: {
    backgroundColor: "white",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },

  resultCountContainer: {
    backgroundColor: "white",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  resultCountWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: CARD_SPACING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
  },
  error: {
    color: "#ef4444",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  noResults: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#64748b",
  },
});
