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
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { getMyContracts } from "../../api/contractApi";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

const ContractsListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [page] = useState(1);
  const [statusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittingSearch, setSubmittingSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [page, statusFilter]);

  const fetchContracts = async (opts = {}) => {
    setLoading(true);
    try {
      const res = await getMyContracts({
        status: statusFilter || undefined,
        page,
        limit: 20,
        ...(opts.keyword ? { keyword: opts.keyword } : {}),
      });

      const items = res.items || res.data || res;
      setContracts(Array.isArray(items) ? items : []);
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
      setSubmittingSearch(false);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getContractStatus = (contractData) => {
    if (!contractData) return "unknown";

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
            return { type: "active", text: "Đang hoạt động" };
          }
        }
        return { type: "active", text: "Đang hoạt động" };

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

  const renderItem = ({ item, index }) => {
    const status = getContractStatus(item);
    const statusInfo = getStatusInfo(status);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === contracts.length - 1 && styles.lastCard,
        ]}
        onPress={() => openDetail(item._id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.contractMainInfo}>
            <View style={styles.contractIcon}>
              <Ionicons name="document-text" size={20} color="#0d9488" />
            </View>
            <View style={styles.contractText}>
              <Text style={styles.contractNumber}>
                {item.contract?.no
                  ? `HĐ ${item.contract.no}`
                  : `HĐ ${item._id?.slice(-8)}`}
              </Text>
              <Text style={styles.contractSubtitle}>Hợp đồng thuê phòng</Text>
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
              <Text style={styles.propertyLabel}>Tòa nhà</Text>
              <Text style={styles.propertyValue} numberOfLines={1}>
                {item.buildingId?.name || "---"}
              </Text>
            </View>

            <View style={styles.propertyItem}>
              <Ionicons name="home" size={16} color="#64748b" />
              <Text style={styles.propertyLabel}>Phòng</Text>
              <Text style={styles.propertyValue}>
                {item.roomId?.roomNumber || "---"}
              </Text>
            </View>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateRange}>
                Từ{" "}
                <Text style={styles.dateHighlight}>
                  {formatDate(item.contract?.startDate)}
                </Text>{" "}
                đến{" "}
                <Text style={styles.dateHighlight}>
                  {formatDate(item.contract?.endDate)}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => openDetail(item._id)}
          >
            <Text style={styles.detailButtonText}>Xem chi tiết</Text>
            <Ionicons name="chevron-forward" size={16} color="#0d9488" />
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

      {/* Search Section */}
      <View style={styles.searchSection}>
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm kiếm hợp đồng..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSubmitSearch}
          disabled={submittingSearch}
        >
          {submittingSearch ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={18} color="#fff" />
          )}
        </TouchableOpacity>
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
          ListHeaderComponent={
            contracts.length > 0 && (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {contracts.length} hợp đồng
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={80}
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

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: STATUS_BAR_HEIGHT,
  },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
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
  searchContainerFocused: {
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
  clearButton: {
    paddingLeft: 8,
  },
  searchButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
    minWidth: 44,
  },

  listContainer: {
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

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  contractMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contractIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contractText: {
    flex: 1,
  },
  contractNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    backgroundColor: "#f8fafc",
    marginBottom: 12,
  },
  propertySection: {
    marginBottom: 12,
  },
  propertyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  propertyItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  propertyLabel: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 6,
    marginRight: 4,
    fontWeight: "500",
  },
  propertyValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 1,
  },

  dateSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  dateRange: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 20,
  },
  dateHighlight: {
    color: "#0f172a",
    fontWeight: "600",
  },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  detailButtonText: {
    fontSize: 14,
    color: "#0d9488",
    fontWeight: "600",
    marginRight: 4,
  },

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

  emptyContainer: {
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
    maxWidth: 300,
  },
});

export default ContractsListScreen;
