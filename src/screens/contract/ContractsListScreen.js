import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Platform,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  Linking,
  Modal,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import {
  getMyContracts,
  downloadContractPdf,
  requestExtend,
} from "../../api/contractApi";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "draft", label: "Bản nháp" },
  { value: "sent_to_tenant", label: "Chờ ký" },
  { value: "signed_by_tenant", label: "Đã ký - Chờ chủ" },
  { value: "signed_by_landlord", label: "Đã ký - Chờ người thuê" },
  { value: "completed", label: "Hoàn thành" },
  { value: "voided", label: "Đã huỷ" },
  { value: "terminated", label: "Đã chấm dứt" },
];

const ContractsListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittingSearch, setSubmittingSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [extendMonths, setExtendMonths] = useState("");
  const [extendNote, setExtendNote] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [page, statusFilter]);

  const fetchContracts = async (opts = {}) => {
    if (!opts.isRefreshing) setLoading(true);
    try {
      const res = await getMyContracts({
        status: statusFilter || undefined,
        page,
        limit: 20,
        ...(opts.keyword ? { keyword: opts.keyword } : {}),
      });
      const items = res.items || res.data || res || [];
      const prepared = (Array.isArray(items) ? items : []).map((c) => ({
        ...c,
        __daysLeft: computeDaysLeft(c.contract?.endDate),
        __statusFromDates: computeStatusFromDates(c),
      }));
      setContracts(prepared);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          e?.response?.data?.message || e?.message || "Không thể tải hợp đồng",
        position: "top",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSubmittingSearch(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchContracts({ isRefreshing: true });
  };

  const onSubmitSearch = () => {
    const kw = searchQuery.trim();
    setSubmittingSearch(true);
    fetchContracts({ keyword: kw });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSubmittingSearch(true);
    fetchContracts({});
  };

  const openDetail = (id) => {
    navigation.navigate("ContractDetail", { id });
  };

  const computeDaysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getContractStatus = (contractData) => {
    if (!contractData) return { type: "unknown", text: "Không xác định" };
    const status = contractData.status;
    const startDate = contractData.contract?.startDate;
    const endDate = contractData.contract?.endDate;
    const now = new Date();

    switch (status) {
      case "draft":
        return { type: "draft", text: "Bản nháp" };
      case "sent_to_tenant":
        return { type: "pending", text: "Chờ ký" };
      case "signed_by_tenant":
        return { type: "pending", text: "Đã ký - Chờ chủ" };
      case "signed_by_landlord":
        return { type: "pending", text: "Đã ký - Chờ người thuê" };
      case "completed":
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          if (now < start) {
            return { type: "pending", text: "Sắp bắt đầu" };
          } else if (now > end) {
            return { type: "expired", text: "Đã hết hạn" };
          } else {
            return { type: "active", text: "Hoàn thành" };
          }
        }
        return { type: "active", text: "Hoàn thành" };
      case "voided":
        return { type: "voided", text: "Đã huỷ" };
      case "terminated":
        return { type: "terminated", text: "Đã chấm dứt" };
      default:
        return { type: "unknown", text: "Không xác định" };
    }
  };

  const getStatusInfo = (status) => {
    switch (status.type) {
      case "draft":
        return { color: "#6b7280", text: status.text, bgColor: "#f3f4f6" };
      case "pending":
        return { color: "#f59e0b", text: status.text, bgColor: "#fef3c7" };
      case "active":
        return { color: "#10b981", text: status.text, bgColor: "#d1fae5" };
      case "expired":
        return { color: "#6b7280", text: status.text, bgColor: "#f3f4f6" };
      case "voided":
        return { color: "#ef4444", text: status.text, bgColor: "#fee2e2" };
      case "terminated":
        return { color: "#dc2626", text: status.text, bgColor: "#fef2f2" };
      default:
        return { color: "#6b7280", text: status.text, bgColor: "#f3f4f6" };
    }
  };

  const computeStatusFromDates = (contractData) => {
    if (!contractData) return { type: "unknown", text: "Không xác định" };
    const startDate = contractData.contract?.startDate;
    const endDate = contractData.contract?.endDate;
    const now = new Date();
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (now < start) {
        return { type: "pending", text: "Hợp đồng sắp bắt đầu" };
      } else if (now > end) {
        return { type: "expired", text: "Hợp đồng đã hết hạn" };
      } else {
        return { type: "active", text: "Hợp đồng đang có hiệu lực" };
      }
    }
    return { type: "unknown", text: "Không xác định" };
  };

  const getUrgencyLevel = (daysLeft) => {
    if (daysLeft === null)
      return { color: "#6b7280", label: "Không có ngày", bgColor: "#f3f4f6" };
    if (daysLeft <= 7)
      return { color: "#ef4444", label: "Sắp hết hạn", bgColor: "#fef2f2" };
    if (daysLeft <= 30)
      return { color: "#f59e0b", label: "Sắp đến hạn", bgColor: "#fffbeb" };
    if (daysLeft <= 60)
      return { color: "#10b981", label: "Còn thời gian", bgColor: "#f0fdf4" };
    return { color: "#6b7280", label: "Còn lâu", bgColor: "#f3f4f6" };
  };

  const goToUpcomingFromItem = (item) => {
    const upcomingContracts = contracts.filter((contract) => {
      const daysLeft =
        contract.__daysLeft ?? computeDaysLeft(contract.contract?.endDate);
      return daysLeft !== null && daysLeft <= 60 && daysLeft > 0;
    });
    navigation.navigate("UpcomingContracts", {
      contracts: upcomingContracts,
      fromFilter: true,
      focusedId: item._id,
    });
  };

  const handleDownloadPdf = async (contract) => {
    if (!contract) return;
    setDownloading(contract._id);
    try {
      if (Platform.OS === "web") {
        await downloadContractPdf(contract._id);
        Toast.show({ type: "success", text1: "Đang tải file PDF..." });
      } else {
        const downloadUrl = `${
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"
        }/api/contracts/${contract._id}/download`;
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
          Toast.show({ type: "success", text1: "Đang mở file PDF..." });
        } else {
          Toast.show({
            type: "error",
            text1: "Lỗi",
            text2: "Không thể mở file PDF trên thiết bị này",
          });
        }
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Tải thất bại",
        text2: e?.message || "Không thể tải file PDF",
      });
    } finally {
      setDownloading(null);
    }
  };

  const openExtendModal = (contract) => {
    setSelectedContract(contract);
    setExtendMonths("");
    setExtendNote("");
    setExtendModalVisible(true);
  };

  const closeExtendModal = () => {
    if (!extendLoading) {
      setExtendModalVisible(false);
      setSelectedContract(null);
    }
  };

  const submitExtend = async () => {
    if (!selectedContract) return;

    const months = Number(extendMonths);
    if (!months || months <= 0) {
      Toast.show({ type: "error", text1: "Số tháng không hợp lệ" });
      return;
    }

    setExtendLoading(true);
    try {
      await requestExtend(selectedContract._id, months, extendNote.trim());
      Toast.show({ type: "success", text1: "Đã gửi yêu cầu gia hạn" });
      setExtendModalVisible(false);
      setSelectedContract(null);
      fetchContracts();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Gửi thất bại",
        text2: e?.response?.data?.message || e.message,
      });
    } finally {
      setExtendLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const renderItem = ({ item, index }) => {
    const statusObj = getContractStatus(item);
    const statusInfo = getStatusInfo(statusObj);
    const statusFromDates =
      item.__statusFromDates ?? computeStatusFromDates(item);
    const daysLeft = item.__daysLeft ?? computeDaysLeft(item.contract?.endDate);
    const urgency = getUrgencyLevel(daysLeft);
    const isDownloading = downloading === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === contracts.length - 1 && styles.lastCard,
        ]}
        onPress={() => openDetail(item._id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.contractMainInfo}>
            <View style={styles.contractIcon}>
              <Ionicons name="document-text" size={22} color="#0d9488" />
            </View>
            <View style={styles.contractText}>
              <Text style={styles.contractNumber} numberOfLines={1}>
                {item.contract?.no
                  ? `Số hợp đồng: ${item.contract.no}`
                  : `Số HĐ: ${item._id?.slice(-8)}`}
              </Text>
              <Text style={styles.contractSubtitle} numberOfLines={1}>
                Hợp đồng thuê phòng
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.bgColor },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.propertySection}>
          <View style={styles.propertyRow}>
            <View style={styles.propertyItem}>
              <Ionicons name="business" size={16} color="#64748b" />
              <Text style={styles.propertyValue} numberOfLines={1}>
                {item.buildingId?.name || "---"}
              </Text>
            </View>
          </View>
          <View style={[styles.propertyRow, { marginTop: 8 }]}>
            <View style={styles.propertyItem}>
              <Ionicons name="bed" size={16} color="#64748b" />
              <Text style={styles.propertyLabel}>Phòng</Text>
              <Text style={styles.propertyValue} numberOfLines={1}>
                {item.roomId?.roomNumber || "---"}
              </Text>
            </View>
          </View>
        </View>

        {/* Date section is tappable:  */}
        <TouchableOpacity
          style={[styles.dateSection, { borderColor: urgency.color }]}
          onPress={() => goToUpcomingFromItem(item)}
          activeOpacity={0.8}
        >
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={18} color="#0d9488" />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateLabelText}>Thời hạn hợp đồng</Text>
              {item.contract?.startDate && item.contract?.endDate ? (
                <Text style={styles.dateRange}>
                  <Text style={styles.dateHighlight}>
                    {formatDate(item.contract.startDate)}
                  </Text>
                  {" → "}
                  <Text style={styles.dateHighlight}>
                    {formatDate(item.contract.endDate)}
                  </Text>
                </Text>
              ) : (
                <Text style={styles.dateRangeEmpty}>
                  Chưa có thời hạn hợp đồng
                </Text>
              )}
              {daysLeft !== null && daysLeft > 0 && (
                <Text
                  style={[styles.expiryTextSmall, { color: urgency.color }]}
                >
                  {`${statusFromDates.text}`}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={urgency.color} />
          </View>
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => openDetail(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons name="eye" size={16} color="#0d9488" />
            <Text style={styles.detailButtonText}>Chi tiết</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownloadPdf(item)}
            disabled={isDownloading}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Ionicons name="download" size={16} color="#059669" />
            )}
            <Text style={styles.downloadButtonText}>
              {isDownloading ? "Đang tải..." : "Tải PDF"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Hợp đồng thuê trọ</Text>
          <Text style={styles.headerSubtitle}>Quản lý hợp đồng của bạn</Text>
        </View>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              searchFocused && styles.searchContainerFocused,
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={searchFocused ? "#0d9488" : "#94a3b8"}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm hợp đồng..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={onSubmitSearch}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={clearSearch}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSubmitSearch}
            activeOpacity={0.8}
          >
            {submittingSearch ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="search" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Row: status filter UI */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStatusFilter(!showStatusFilter)}
            activeOpacity={0.8}
          >
            <Ionicons name="filter" size={16} color="#64748b" />
            <Text style={styles.filterButtonText}>
              {statusOptions.find((o) => o.value === statusFilter)?.label ||
                "Lọc trạng thái"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </TouchableOpacity>

          {statusFilter ? (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setStatusFilter("")}
            >
              <Ionicons name="close" size={16} color="#64748b" />
              <Text style={styles.clearFilterText}>Xóa</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Dropdown */}
        {showStatusFilter && (
          <View style={styles.statusFilterDropdown}>
            <ScrollView style={styles.statusFilterList}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusFilterItem,
                    statusFilter === option.value &&
                      styles.statusFilterItemSelected,
                  ]}
                  onPress={() => {
                    setStatusFilter(option.value);
                    setShowStatusFilter(false);
                  }}
                >
                  <Text
                    style={[
                      styles.statusFilterText,
                      statusFilter === option.value &&
                        styles.statusFilterTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {statusFilter === option.value && (
                    <Ionicons name="checkmark" size={16} color="#0d9488" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color="#cbd5e1"
                />
              </View>
              <Text style={styles.emptyTitle}>Chưa có hợp đồng</Text>
              <Text style={styles.emptySubtitle}>
                Bạn chưa có hợp đồng thuê phòng nào được ghi nhận
              </Text>
            </View>
          }
        />
      )}

      {/* Extend Modal (kept as fallback) */}
      <Modal visible={extendModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Yêu cầu gia hạn hợp đồng</Text>

            {selectedContract && (
              <View style={styles.contractInfoModal}>
                <Text style={styles.contractInfoText}>
                  Phòng: {selectedContract.roomId?.roomNumber} -{" "}
                  {selectedContract.buildingId?.name}
                </Text>
                <Text style={styles.contractInfoText}>
                  Kết thúc: {formatDate(selectedContract.contract?.endDate)}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Số tháng gia hạn *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ví dụ: 12"
              keyboardType="numeric"
              value={extendMonths}
              onChangeText={setExtendMonths}
            />

            <Text style={styles.inputLabel}>Ghi chú (không bắt buộc)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Lý do gia hạn..."
              multiline
              value={extendNote}
              onChangeText={setExtendNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={closeExtendModal}
                disabled={extendLoading}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtnPrimary,
                  (!extendMonths || extendLoading) && styles.modalBtnDisabled,
                ]}
                onPress={submitExtend}
                disabled={!extendMonths || extendLoading}
              >
                <Text style={{ color: "#fff" }}>
                  {extendLoading ? "Đang gửi..." : "Gửi yêu cầu"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingTop: STATUS_BAR_HEIGHT,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerContent: {
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  searchSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    minHeight: 48,
  },
  searchContainerFocused: {
    borderColor: "#0d9488",
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
  },
  clearButton: {
    paddingLeft: 8,
  },
  searchButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 48,
    minWidth: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#0d9488",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  clearFilterText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  statusFilterDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusFilterList: {
    maxHeight: 200,
  },
  statusFilterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  statusFilterItemSelected: {
    backgroundColor: "#f0fdfa",
  },
  statusFilterText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  statusFilterTextSelected: {
    color: "#0d9488",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  listHeader: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  listHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  firstCard: {
    marginTop: 4,
  },
  lastCard: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  contractMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  contractIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contractText: {
    flex: 1,
  },
  contractNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  contractSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 14,
  },
  propertySection: {
    marginBottom: 12,
  },
  propertyRow: {
    flexDirection: "row",
  },
  propertyItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  propertyLabel: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    marginRight: 6,
    fontWeight: "500",
  },
  propertyValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 1,
    marginLeft: 6,
  },
  dateSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  dateLabelText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 20,
  },
  dateRangeEmpty: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 20,
  },
  dateHighlight: {
    color: "#0f172a",
    fontWeight: "700",
  },
  expiryTextSmall: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 6,
  },
  detailButtonText: {
    fontSize: 14,
    color: "#0d9488",
    fontWeight: "600",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    color: "#059669",
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
    fontSize: 15,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  contractInfoModal: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contractInfoText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalBtnPrimary: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  modalBtnSecondary: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 80,
    alignItems: "center",
  },
  modalBtnDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.6,
  },
});

export default ContractsListScreen;
