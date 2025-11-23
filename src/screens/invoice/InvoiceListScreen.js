import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getMyInvoices } from "../../api/invoiceApi";

const STATUS_COLORS = {
  draft: "#6b7280",
  sent: "#3b82f6",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#9ca3af",
};

const STATUS_LABELS = {
  draft: "Bản nháp",
  sent: "Đã gửi",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Đã hủy",
};

export default function InvoiceListScreen({ navigation }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    periodMonth: "",
    periodYear: "",
  });

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "sent", label: "Chờ thanh toán" },
    { value: "paid", label: "Đã thanh toán" },
    { value: "overdue", label: "Quá hạn" },
    { value: "draft", label: "Bản nháp" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  const loadInvoices = async (showRefresh = false) => {
    try {
      if (!showRefresh) setLoading(true);
      const data = await getMyInvoices(filters);
      setInvoices(data.items || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách hóa đơn");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [filters]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString(
      "vi-VN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )}`;
  };

  const renderInvoiceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() =>
        navigation.navigate("InvoiceDetail", { invoiceId: item._id })
      }
      activeOpacity={0.85}
    >
      {/* Header với số hóa đơn và trạng thái */}
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceNumberContainer}>
            <Ionicons name="document-text" size={20} color="#3b82f6" />
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          </View>
          <View style={styles.periodContainer}>
            <Ionicons name="calendar" size={14} color="#64748b" />
            <Text style={styles.period}>
              Kỳ {item.periodMonth}/{item.periodYear}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] },
          ]}
        >
          <Text style={styles.statusText}>
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.invoiceDetails}>
        {/* Tòa nhà */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={18} color="#3b82f6" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Tòa nhà</Text>
            <Text style={styles.detailValue}>
              {item.buildingId?.name || "Chưa xác định"}
            </Text>
            {item.buildingId?.address && (
              <Text style={styles.detailSubValue}>
                {item.buildingId.address}
              </Text>
            )}
          </View>
        </View>

        {/* Phòng */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="home" size={18} color="#10b981" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Phòng</Text>
            <Text style={styles.detailValue}>
              {item.roomId?.roomNumber || "-"}
            </Text>
          </View>
        </View>

        {/* Ngày phát hành */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="create" size={18} color="#8b5cf6" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Ngày phát hành</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(item.issuedAt)}
            </Text>
          </View>
        </View>

        {/* Hạn thanh toán */}
        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="alarm"
              size={18}
              color={item.status === "overdue" ? "#ef4444" : "#f59e0b"}
            />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Hạn thanh toán</Text>
            <Text
              style={[
                styles.detailValue,
                item.status === "overdue" && styles.overdueDate,
              ]}
            >
              {formatDate(item.dueDate)}
            </Text>
          </View>
        </View>

        {/* Ngày thanh toán (nếu đã thanh toán) */}
        {item.status === "paid" && item.paidAt && (
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Đã thanh toán</Text>
              <Text style={[styles.detailValue, styles.paidDateText]}>
                {formatDateTime(item.paidAt)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Footer với tổng tiền */}
      <View style={styles.invoiceFooter}>
        <View style={styles.totalAmountContainer}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.amount}>{formatCurrency(item.totalAmount)}</Text>
        </View>

        {/* Nút "Xem chi tiết" có onPress riêng để tránh trường hợp touch bị parent chặn */}
        <TouchableOpacity
          style={styles.viewDetailButton}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() =>
            navigation.navigate("InvoiceDetail", { invoiceId: item._id })
          }
        >
          <Text style={styles.viewDetailText}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Badge quá hạn */}
      {item.status === "overdue" && (
        <View style={styles.overdueBadge}>
          <Ionicons name="warning" size={14} color="#fff" />
          <Text style={styles.overdueText}>QUÁ HẠN</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return "time-outline";
      case "paid":
        return "checkmark-circle-outline";
      case "overdue":
        return "alert-circle-outline";
      case "draft":
        return "document-outline";
      case "cancelled":
        return "close-circle-outline";
      default:
        return "apps-outline";
    }
  };

  const getCurrentStatusLabel = () => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === filters.status);
    return option ? option.label : "Tất cả";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Hóa đơn của tôi</Text>
            <Text style={styles.headerSubtitle}>
              Bạn đang có {invoices.length} hóa đơn
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            activeOpacity={0.7}
          >
            <View style={styles.filterButtonContent}>
              <Ionicons
                name={getStatusIcon(filters.status)}
                size={18}
                color="#3b82f6"
              />
              <Text style={styles.filterButtonText}>
                {getCurrentStatusLabel()}
              </Text>
            </View>
            <Ionicons
              name={showFilterDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>

          {/* Dropdown */}
          {showFilterDropdown && (
            <View style={styles.filterDropdown}>
              <ScrollView style={styles.filterDropdownScroll}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterDropdownItem,
                      filters.status === option.value &&
                        styles.filterDropdownItemSelected,
                    ]}
                    onPress={() => {
                      setFilters((prev) => ({ ...prev, status: option.value }));
                      setShowFilterDropdown(false);
                    }}
                  >
                    <View style={styles.filterDropdownItemContent}>
                      <Ionicons
                        name={getStatusIcon(option.value)}
                        size={18}
                        color={
                          filters.status === option.value
                            ? "#3b82f6"
                            : "#64748b"
                        }
                      />
                      <Text
                        style={[
                          styles.filterDropdownText,
                          filters.status === option.value &&
                            styles.filterDropdownTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {filters.status === option.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#3b82f6"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Invoice List */}
        <FlatList
          data={invoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyText}>Không có hóa đơn nào</Text>
                <Text style={styles.emptySubtext}>
                  {filters.status
                    ? `Không có hóa đơn ở trạng thái "${
                        STATUS_LABELS[filters.status]
                      }"`
                    : "Bạn chưa có hóa đơn nào được tạo"}
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  filterDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterDropdownScroll: {
    maxHeight: 250,
  },
  filterDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterDropdownItemSelected: {
    backgroundColor: "#eff6ff",
  },
  filterDropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filterDropdownText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  filterDropdownTextSelected: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
    marginLeft: 8,
  },
  periodContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  period: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 2,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  detailSubValue: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  overdueDate: {
    color: "#ef4444",
  },
  paidDateText: {
    color: "#10b981",
  },
  invoiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  totalAmountContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  amount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  viewDetailText: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "600",
    marginRight: 4,
  },
  overdueBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  overdueText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
