import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Keyboard,
  Alert,
  RefreshControl,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  getMyRoomDetail,
  getMyRoommates,
  searchUser,
  addRoommate,
  removeRoommate,
  leaveRoommate,
} from "../../api/roomatesApi";
import { useFocusEffect } from "@react-navigation/native";

export default function RoommatesScreen({ navigation, route }) {
  const passedRoomId = route?.params?.roomId ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [room, setRoom] = useState(null);
  const [roommatesData, setRoommatesData] = useState([]);
  const [canAddMore, setCanAddMore] = useState(false);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unwrap = (res) => {
    if (!res) return null;
    const maybe = res?.data !== undefined ? res.data : res;
    const inner = maybe?.data ?? maybe;
    return inner ?? maybe ?? null;
  };

  const load = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      setRoom(null);
      setRoommatesData([]);
      setCanAddMore(false);

      let roomId = passedRoomId ?? null;
      let payload = null;

      if (!roomId) {
        const rRes = await getMyRoomDetail();
        const rPayload = unwrap(rRes);
        const roomObj = rPayload?.room ?? rPayload;
        if (!roomObj) {
          throw new Error("Không tìm thấy phòng hiện tại của bạn");
        }
        roomId = roomObj.id ?? roomObj._id ?? roomObj._id ?? null;
        if (!roomId) {
          throw new Error("roomId không xác định được từ /rooms/my-room");
        }
      }

      const mmRes = await getMyRoommates(roomId);
      const mmPayload = unwrap(mmRes);

      if (Array.isArray(mmPayload)) {
        setRoom({ id: roomId, roomNumber: "", currentCount: mmPayload.length });
        setRoommatesData(mmPayload);
        setCanAddMore(false);
        return;
      }

      payload = mmPayload ?? {};
      const final = payload?.data ?? payload;

      const roomNumber =
        final?.roomNumber ??
        final?.room?.roomNumber ??
        final?.id ??
        final?._id ??
        "";
      const roommates =
        final?.roommates ??
        final?.data?.roommates ??
        final?.currentTenantIds ??
        [];
      const normalizedRoommates = Array.isArray(roommates) ? roommates : [];

      setRoom({
        id: roomId,
        _id: roomId,
        roomNumber: roomNumber,
        currentCount: final?.currentCount ?? normalizedRoommates.length,
        maxTenants: final?.maxTenants ?? null,
        canAddMore: final?.canAddMore ?? false,
        __raw: final,
      });

      setRoommatesData(normalizedRoommates);
      setCanAddMore(final?.canAddMore ?? false);
    } catch (err) {
      console.error("load roommates error:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể tải người ở chung",
      });
      setRoom(null);
      setRoommatesData([]);
      setCanAddMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    load(false);
  }, []);

  useEffect(() => {
    load(true);
  }, [passedRoomId]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [passedRoomId])
  );

  const onSearch = async () => {
    if (!query || query.trim().length < 2) {
      Toast.show({
        type: "info",
        text1: "Nhập tối thiểu 2 ký tự",
        position: "bottom",
      });
      return;
    }
    setSearching(true);
    setShowSearchResults(true);
    try {
      const res = await searchUser(query.trim());
      const payload = unwrap(res);
      const results = payload?.data ?? payload ?? [];
      setSearchResults(Array.isArray(results) ? results : []);
      Keyboard.dismiss();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi tìm kiếm",
        text2: err?.response?.data?.message || "Không thể tìm người dùng",
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId, userName) => {
    if (!room) return;
    const roomId = room.id ?? room._id;
    if (!roomId) return;

    setActionLoading(true);
    try {
      const res = await addRoommate(roomId, [userId]);
      const payload = unwrap(res);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Đã thêm ${userName} vào phòng`,
      });
      await load(false);
      setSearchResults((s) => s.filter((x) => (x._id ?? x.id) !== userId));
      setQuery("");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Thêm thất bại",
        text2: err?.response?.data?.message || "Không thể thêm người dùng",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = (userId, fullName) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa ${fullName} khỏi phòng?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => doRemove(userId, fullName),
        },
      ]
    );
  };

  const doRemove = async (userId, fullName) => {
    if (!room) return;
    const roomId = room.id ?? room._id;
    if (!roomId) return;

    setActionLoading(true);
    try {
      const res = await removeRoommate(roomId, [userId]);
      const payload = unwrap(res);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: `Đã xóa ${fullName} khỏi phòng`,
      });
      await load(false);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Xóa thất bại",
        text2: err?.response?.data?.message || "Không thể xóa người dùng",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      "Xác nhận rời phòng",
      "Bạn có chắc chắn muốn rời khỏi phòng này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Rời đi",
          style: "destructive",
          onPress: doLeave,
        },
      ]
    );
  };

  const doLeave = async () => {
    if (!room) return;
    const roomId = room.id ?? room._id;
    if (!roomId) return;

    setActionLoading(true);
    try {
      await leaveRoommate(roomId);
      Toast.show({
        type: "success",
        text1: "Đã rời phòng thành công",
      });

      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Rời phòng thất bại",
        text2: err?.response?.data?.message || "Lỗi hệ thống",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const clearSearchResults = () => {
    setShowSearchResults(false);
    setSearchResults([]);
    setQuery("");
  };

  const handleQueryChange = (text) => {
    setQuery(text);
    if (text.length < 2) {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const renderRoommateItem = ({ item, index }) => {
    const id = item._id ?? item.id ?? item.userId ?? null;
    const isMainTenant = item.isMainTenant ?? false;
    const isMe = item.isMe ?? false;

    return (
      <TouchableOpacity
        style={[styles.roommateItem, index === 0 && styles.firstItem]}
        onPress={() => navigation.navigate("RoommateDetail", { userId: id })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.fullName?.[0] || item.email?.[0] || "U").toUpperCase()}
            </Text>
          </View>
          {isMainTenant && (
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.fullName ?? item.email ?? "—"}
            </Text>
            {isMe && (
              <View style={styles.meBadge}>
                <Text style={styles.meText}>Bạn</Text>
              </View>
            )}
          </View>
          <Text style={styles.phone} numberOfLines={1}>
            {item.phoneNumber || "Chưa cập nhật SĐT"}
          </Text>
          {item.email && (
            <Text style={styles.email} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          {canAddMore && !isMainTenant && !isMe && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(id, item.fullName ?? item.email)}
              disabled={actionLoading}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {isMe && !isMainTenant && (
            <TouchableOpacity
              style={[styles.leaveBtn]}
              onPress={handleLeave}
              disabled={actionLoading}
            >
              <Ionicons name="log-out-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() =>
              navigation.navigate("RoommateDetail", { userId: id })
            }
          >
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchItem = ({ item }) => (
    <View style={styles.searchItem}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.fullName?.[0] || item.email?.[0] || "U").toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {item.fullName || "Chưa đặt tên"}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {item.email}
        </Text>
        {item.phoneNumber && (
          <Text style={styles.phone} numberOfLines={1}>
            {item.phoneNumber}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.addBtn, actionLoading && styles.addBtnDisabled]}
        onPress={() =>
          handleAdd(item._id ?? item.id, item.fullName || item.email)
        }
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.addText}>Thêm</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const RoomInfoHeader = () => (
    <View style={styles.roomHeader}>
      <View style={styles.roomInfo}>
        <Ionicons name="business-outline" size={20} color="#0d9488" />
        <Text style={styles.roomNumber}>
          {room?.roomNumber ? `Phòng ${room.roomNumber}` : "Phòng của bạn"}
        </Text>
      </View>
      <View style={styles.roomStats}>
        <Text style={styles.roomStatsText}>
          {room?.currentCount ?? 0}/{room?.maxTenants ?? "—"} người
        </Text>
        {canAddMore && (
          <View style={styles.canAddBadge}>
            <Text style={styles.canAddText}>Có thể thêm</Text>
          </View>
        )}
      </View>
    </View>
  );

  const SearchResultsSection = () => {
    if (!showSearchResults) return null;

    return (
      <View style={styles.searchResultsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
          <View style={styles.searchResultsHeader}>
            <Text style={styles.sectionSubtitle}>
              {searchResults.length} kết quả
            </Text>
            <TouchableOpacity
              style={styles.closeResultsBtn}
              onPress={clearSearchResults}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {searching ? (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="small" color="#0d9488" />
            <Text style={styles.searchLoadingText}>Đang tìm kiếm...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(i, idx) => i?._id ?? i?.id ?? `search-${idx}`}
            renderItem={renderSearchItem}
            showsVerticalScrollIndicator={false}
            style={styles.searchResultsList}
          />
        ) : (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={48} color="#cbd5e1" />
            <Text style={styles.noResultsTitle}>Không tìm thấy kết quả</Text>
            <Text style={styles.noResultsSubtitle}>
              Không có người dùng nào phù hợp với từ khóa "{query}"
            </Text>
            <TouchableOpacity
              style={styles.tryAgainBtn}
              onPress={clearSearchResults}
            >
              <Text style={styles.tryAgainText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />
      <View style={styles.wrapper}>
        {/* HEADER */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Người ở cùng</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={refreshing ? "#94a3b8" : "#0f172a"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          {room && <RoomInfoHeader />}

          {/* SEARCH SECTION */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Tìm người để thêm</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchInputContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color="#64748b"
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Nhập email để tìm kiếm..."
                  placeholderTextColor="#64748b"
                  value={query}
                  onChangeText={handleQueryChange}
                  style={styles.searchInput}
                  onSubmitEditing={onSearch}
                  returnKeyType="search"
                  color="#0f172a"
                />

                {query.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearInputBtn}
                    onPress={() => {
                      setQuery("");
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.searchBtn,
                  (!query || query.trim().length < 2) &&
                    styles.searchBtnDisabled,
                ]}
                onPress={onSearch}
                disabled={searching || !query || query.trim().length < 2}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="search" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#0d9488" />
              <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.contentScroll}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#0d9488"]}
                  tintColor="#0d9488"
                />
              }
              contentContainerStyle={styles.scrollContent}
            >
              {/* ROOMMATES LIST */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Thành viên trong phòng
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {roommatesData.length} người
                  </Text>
                </View>

                {roommatesData.length > 0 ? (
                  <FlatList
                    data={roommatesData}
                    keyExtractor={(i, idx) =>
                      i?._id ?? i?.id ?? `roommate-${idx}`
                    }
                    renderItem={renderRoommateItem}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>Chưa có người ở cùng</Text>
                    <Text style={styles.emptySubtitle}>
                      Tìm kiếm và thêm người vào phòng của bạn
                    </Text>
                  </View>
                )}
              </View>

              {/* SEARCH RESULTS */}
              <SearchResultsSection />
            </ScrollView>
          )}

          <Toast />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  wrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  roomStats: {
    alignItems: "flex-end",
    gap: 4,
  },
  roomStatsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  canAddBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  canAddText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
  },
  searchSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  searchResultsSection: {
    marginBottom: 20,
    minHeight: 200,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  searchResultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    minHeight: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
  },
  clearInputBtn: {
    padding: 4,
    marginLeft: 8,
  },
  searchBtn: {
    backgroundColor: "#0d9488",
    width: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 50,
  },
  searchBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  closeResultsBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  roommateItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 80,
  },
  firstItem: {
    borderLeftWidth: 4,
    borderLeftColor: "#0d9488",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0d9488",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#f59e0b",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  meBadge: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  meText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  phone: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: "#94a3b8",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  removeBtn: {
    backgroundColor: "#ef4444",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  leaveBtn: {
    backgroundColor: "#ef4444",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 80,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  addBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  addText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  searchLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  searchLoadingText: {
    fontSize: 14,
    color: "#64748b",
  },
  noResults: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    minHeight: 200,
    justifyContent: "center",
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  tryAgainBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tryAgainText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
