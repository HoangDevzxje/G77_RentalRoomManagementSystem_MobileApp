import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  TextInput,
  Keyboard,
  ActionSheetIOS,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { listMyRoomRequests } from "../../api/maintenanceApi";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const STATUS_OPTIONS = [
  { key: "", label: "Tất cả trạng thái", icon: "apps-outline" },
  { key: "open", label: "Chờ xử lý", icon: "time-outline" },
  { key: "in_progress", label: "Đang xử lý", icon: "build-outline" },
  { key: "resolved", label: "Đã hoàn thành", icon: "checkmark-done-outline" },
  { key: "rejected", label: "Đã từ chối", icon: "close-outline" },
];

const CATEGORY_LABELS = {
  furniture: "Nội thất",
  electrical: "Điện",
  plumbing: "Nước",
  air_conditioning: "Điều hòa",
  door_lock: "Khóa cửa",
  wall_ceiling: "Tường/Trần",
  flooring: "Sàn nhà",
  windows: "Cửa sổ",
  appliances: "Gia dụng",
  internet_wifi: "Internet/Wifi",
  pest_control: "Côn trùng",
  cleaning: "Vệ sinh",
  safety: "An toàn",
  other: "Khác",
};

function StatusFilterDropdownInline({ options, selected, onSelect, visible }) {
  if (!visible) return null;
  return (
    <View style={inlineStyles.dropdown}>
      <ScrollView style={inlineStyles.dropdownList}>
        {options.map((opt) => {
          const active = opt.key === selected;
          return (
            <TouchableOpacity
              key={opt.key ?? "all"}
              style={[
                inlineStyles.dropdownItem,
                active && inlineStyles.dropdownItemActive,
              ]}
              onPress={() => onSelect(opt.key)}
            >
              <Text
                style={[
                  inlineStyles.dropdownText,
                  active && inlineStyles.dropdownTextActive,
                ]}
              >
                {opt.label}
              </Text>
              {active && (
                <Ionicons name="checkmark" size={16} color="#0d9488" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function MaintenanceRequestsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = async (opts = { showLoading: true, page: 1 }) => {
    try {
      if (opts.showLoading) setLoading(true);
      else setRefreshing(true);

      const res = await listMyRoomRequests({ page: opts.page, limit });
      const payload = res || {};

      let listData = [];
      if (Array.isArray(payload)) {
        listData = payload;
      } else if (payload.requests && Array.isArray(payload.requests)) {
        listData = payload.requests;
      } else if (payload.data && Array.isArray(payload.data)) {
        listData = payload.data;
      }

      setRequests(listData);

      if (payload.rooms && payload.rooms.length > 0) {
        setRoomInfo(payload.rooms[0]);
      } else {
        setRoomInfo(null);
      }

      setTotal(payload.summary?.totalRequests || listData.length);
      setPage(opts.page || 1);
    } catch (err) {
      console.error("Load Requests Error:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải danh sách yêu cầu",
      });
      setRequests([]);
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
        return { color: "#94a3b8", text: "Thường" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDisplayItemName = (item) => {
    if (item.itemName) return item.itemName;
    if (item.furnitureId?.name) return item.furnitureId.name;
    return CATEGORY_LABELS[item.category] || item.category || "Bảo trì chung";
  };

  const filteredRequests = useMemo(() => {
    let list = Array.isArray(requests) ? requests : [];
    if (statusFilter) {
      list = list.filter((it) => (it.status || "") === statusFilter);
    }
    if (!debouncedQuery) return list;

    const q = debouncedQuery.toLowerCase();
    return list.filter((it) => {
      if (!it) return false;
      const title = (it.title || "").toLowerCase();
      const furniture = getDisplayItemName(it).toLowerCase();
      const assignee = (it.assignee?.name || "").toLowerCase();
      const roomNum = (it.roomNumber || "").toString().toLowerCase();

      return (
        title.includes(q) ||
        furniture.includes(q) ||
        assignee.includes(q) ||
        roomNum.includes(q)
      );
    });
  }, [requests, debouncedQuery, statusFilter]);

  const renderItem = ({ item, index }) => {
    const statusInfo = getStatusInfo(item.status);
    const priorityInfo = getPriorityInfo(item.priority || "medium"); // Default medium
    const displayItemName = getDisplayItemName(item);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === requests.length - 1 && styles.lastCard,
        ]}
        onPress={() =>
          navigation.navigate("MaintenanceDetail", {
            requestId: item._id,
            request: item,
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.category && item.category !== "furniture" && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {CATEGORY_LABELS[item.category] || item.category}
                </Text>
              </View>
            )}
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
              {/* Icon thay đổi tùy category */}
              <Ionicons
                name={
                  item.category === "furniture"
                    ? "cube-outline"
                    : "build-outline"
                }
                size={16}
                color="#6b7280"
              />
              <Text style={styles.metaText}>{displayItemName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="copy-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{item.affectedQuantity || 1}</Text>
            </View>
          </View>

          {item.scheduledAt && (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.metaText}>
                  Lịch hẹn: {formatDate(item.scheduledAt)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.timeSection}>
            <Ionicons name="time-outline" size={14} color="#9ca3af" />
            <Text style={styles.timeText}>
              Tạo ngày {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Hiển thị số ảnh đính kèm nếu có */}
          {item.hasPhoto && (
            <View style={styles.photoSection}>
              <Ionicons name="image-outline" size={14} color="#0d9488" />
              <Text style={styles.photoText}>{item.photoCount || 1} ảnh</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    Keyboard.dismiss();
  };

  const clearStatusFilter = () => {
    setStatusFilter("");
  };

  const openStatusSelector = () => {
    if (Platform.OS === "ios") {
      const options = STATUS_OPTIONS.map((s) => s.label);
      const iosOptions = [...options, "Hủy"];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: iosOptions,
          cancelButtonIndex: iosOptions.length - 1,
          title: "Lọc theo trạng thái",
        },
        (buttonIndex) => {
          if (buttonIndex === iosOptions.length - 1) return;
          const selected = STATUS_OPTIONS[buttonIndex];
          setStatusFilter(selected.key);
        }
      );
    } else {
      setStatusDropdownVisible((v) => !v);
    }
  };

  const onSelectStatusInline = (key) => {
    setStatusFilter(key);
    setStatusDropdownVisible(false);
  };

  const getStatusIcon = (statusKey) => {
    const status = STATUS_OPTIONS.find((s) => s.key === statusKey);
    return status ? status.icon : "filter";
  };

  const getStatusLabel = (statusKey) => {
    const status = STATUS_OPTIONS.find((s) => s.key === statusKey);
    return status ? status.label : "Trạng thái";
  };

  const clearAllFilters = () => {
    clearSearch();
    clearStatusFilter();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color="#0f766e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Yêu cầu bảo trì</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={goToCreate}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createButtonText}>Tạo yêu cầu</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View
          style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}
        >
          <Ionicons
            name="search"
            size={20}
            color={searchFocused ? "#0d9488" : "#9ca3af"}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, thiết bị..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => {
              setDebouncedQuery(searchQuery.trim());
              Keyboard.dismiss();
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.searchClear}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter && styles.filterButtonActive,
          ]}
          onPress={openStatusSelector}
          activeOpacity={0.8}
        >
          <Ionicons
            name={getStatusIcon(statusFilter)}
            size={18}
            color={statusFilter ? "#fff" : "#0d9488"}
          />
          <Text
            style={[
              styles.filterButtonText,
              statusFilter && styles.filterButtonTextActive,
            ]}
          >
            {getStatusLabel(statusFilter)}
          </Text>

          {statusFilter ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                clearStatusFilter();
              }}
              style={styles.filterClear}
            >
              <Ionicons name="close-circle" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <Ionicons
              name={statusDropdownVisible ? "chevron-up" : "chevron-down"}
              size={16}
              color="#0d9488"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>

        <StatusFilterDropdownInline
          options={STATUS_OPTIONS}
          selected={statusFilter}
          onSelect={onSelectStatusInline}
          visible={statusDropdownVisible}
        />
      </View>

      {/* Loading / List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item, index) => item._id || String(index)}
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
                  Bạn có đang có {filteredRequests.length} yêu cầu bảo trì
                  {debouncedQuery || statusFilter ? " tìm thấy" : ""}
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="construct-outline" size={80} color="#d1d5db" />
              </View>
              <Text style={styles.emptyTitle}>
                {debouncedQuery || statusFilter
                  ? "Không tìm thấy kết quả"
                  : "Chưa có yêu cầu nào"}
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => {
                  if (debouncedQuery || statusFilter) clearAllFilters();
                  else goToCreate();
                }}
              >
                <Ionicons
                  name={
                    debouncedQuery || statusFilter
                      ? "refresh"
                      : "add-circle-outline"
                  }
                  size={18}
                  color="#fff"
                />
                <Text style={styles.emptyCreateButtonText}>
                  {debouncedQuery || statusFilter
                    ? "Xóa bộ lọc"
                    : "Tạo yêu cầu mới"}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <Toast />
    </SafeAreaView>
  );
}

const inlineStyles = StyleSheet.create({
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownList: { maxHeight: 200 },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemActive: { backgroundColor: "#f0fdfa" },
  dropdownText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  dropdownTextActive: { color: "#0d9488", fontWeight: "600" },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { padding: 8, marginRight: 10 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  roomInfo: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },

  searchSection: { padding: 16, backgroundColor: "#f8fafc" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchBoxFocused: { borderColor: "#0d9488" },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#0f172a" },
  searchClear: { padding: 4 },

  filterSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterButtonActive: { backgroundColor: "#0d9488", borderColor: "#0d9488" },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#0d9488",
    fontWeight: "600",
  },
  filterButtonTextActive: { color: "#fff" },
  filterClear: { marginLeft: 6 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748b" },

  listContent: { padding: 16 },
  listHeader: { marginBottom: 10 },
  listHeaderText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  separator: { height: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleSection: { flex: 1, marginRight: 10 },
  title: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginBottom: 4 },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: { fontSize: 11, color: "#64748b", fontWeight: "500" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 12, fontWeight: "600", marginLeft: 4 },

  cardContent: { marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  metaText: { fontSize: 13, color: "#374151", marginLeft: 6 },
  metaTextLight: {
    fontSize: 13,
    color: "#9ca3af",
    marginLeft: 6,
    fontStyle: "italic",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  timeSection: { flexDirection: "row", alignItems: "center" },
  timeText: { fontSize: 12, color: "#94a3b8", marginLeft: 6 },
  photoSection: { flexDirection: "row", alignItems: "center" },
  photoText: {
    fontSize: 12,
    color: "#0d9488",
    marginLeft: 4,
    fontWeight: "500",
  },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginVertical: 10,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyCreateButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
});
