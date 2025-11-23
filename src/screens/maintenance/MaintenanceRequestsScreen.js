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
  Modal,
  Pressable,
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
  const [statusModalVisible, setStatusModalVisible] = useState(false); // fallback for ios action sheet use

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const load = async (opts = { showLoading: true, page: 1 }) => {
    try {
      if (opts.showLoading) setLoading(true);
      else setRefreshing(true);

      const res = await listMyRoomRequests({ page: opts.page, limit });
      const payload = res ?? {};

      if (Array.isArray(payload)) {
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
      const furniture = (it.furnitureId?.name || "").toLowerCase();
      const assignee = (it.assigneeName || "").toLowerCase();
      const roomNum = (it.roomId?.roomNumber || "").toString().toLowerCase();
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
            requestId: item._id ?? item.id ?? item.requestId,
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
      // iOS action sheet (native)
      const options = STATUS_OPTIONS.map((s) => s.label);
      const iosOptions = [...options, "Hủy"];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: iosOptions,
          cancelButtonIndex: iosOptions.length - 1,
          title: "Lọc theo trạng thái",
        },
        (buttonIndex) => {
          if (buttonIndex === iosOptions.length - 1) return; // cancel
          const selected = STATUS_OPTIONS[buttonIndex];
          setStatusFilter(selected.key);
        }
      );
    } else {
      // Android / other: toggle inline dropdown
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
            {roomInfo && (
              <Text style={styles.roomInfo}>
                Phòng {roomInfo.roomNumber} • {roomInfo.building?.name}
              </Text>
            )}
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
            placeholder="Tìm kiếm yêu cầu bảo trì..."
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
            clearButtonMode="never"
            underlineColorAndroid="transparent"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.searchClear}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section (inline dropdown for Android/others) */}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

        {/* Inline dropdown (same-file) */}
        <StatusFilterDropdownInline
          options={STATUS_OPTIONS}
          selected={statusFilter}
          onSelect={onSelectStatusInline}
          visible={statusDropdownVisible}
        />
      </View>

      {/* Android modal fallback is NOT needed since we have inline dropdown. iOS uses ActionSheet. */}

      {/* Loading / List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
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
                  {filteredRequests.length} yêu cầu
                  {debouncedQuery || statusFilter ? " phù hợp" : ""}
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
                  ? "Không tìm thấy yêu cầu phù hợp"
                  : "Chưa có yêu cầu bảo trì"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {debouncedQuery || statusFilter
                  ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc trạng thái"
                  : "Tạo yêu cầu đầu tiên để báo cáo sự cố nội thất trong phòng"}
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => {
                  if (debouncedQuery || statusFilter) {
                    clearAllFilters();
                  } else {
                    goToCreate();
                  }
                }}
                activeOpacity={0.9}
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
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  roomInfo: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 44,
  },
  searchBoxFocused: {
    borderColor: "#0d9488",
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#0f172a",
    paddingVertical: 0,
  },
  searchClear: {
    paddingLeft: 8,
  },

  filterSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 44,
    alignSelf: "flex-start",
  },
  filterButtonActive: {
    backgroundColor: "#0d9488",
    borderColor: "#0d9488",
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0d9488",
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  filterClear: {
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalContent: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 18,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: "#0d9488",
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  modalOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalCancel: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  modalCancelText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Loading / List */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 32,
  },
  listHeader: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  separator: {
    height: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  firstCard: {
    marginTop: 2,
  },
  lastCard: {
    marginBottom: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 20,
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
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
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
  },
  metaText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
    marginLeft: 6,
  },
  metaTextLight: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  timeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
    marginLeft: 6,
  },
  costSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  costLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
    marginRight: 6,
  },
  costText: {
    fontSize: 13,
    color: "#0d9488",
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: width * 0.85,
  },
  emptyCreateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCreateButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
