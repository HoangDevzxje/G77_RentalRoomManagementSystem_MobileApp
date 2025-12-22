import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getMyInvoices } from "../../api/invoiceApi";

const STATUS_COLORS = {
  draft: "#94a3b8",
  sent: "#3b82f6",
  transfer_pending: "#f59e0b",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#64748b",
  replaced: "#475569",
};

const STATUS_LABELS = {
  draft: "Bản nháp",
  sent: "Chờ thanh toán",
  transfer_pending: "Chờ xác nhận",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Đã hủy",
  replaced: "Đã thay thế",
};

const FILTER_OPTIONS = [
  { key: "", label: "Tất cả", icon: "list", color: "#64748b" },
  {
    key: "sent",
    label: "Chờ thanh toán",
    icon: "time-outline",
    color: "#3b82f6",
  },
  {
    key: "transfer_pending",
    label: "Chờ xác nhận",
    icon: "hourglass-outline",
    color: "#f59e0b",
  },
  {
    key: "paid",
    label: "Đã thanh toán",
    icon: "checkmark-circle",
    color: "#10b981",
  },
  { key: "overdue", label: "Quá hạn", icon: "alert-circle", color: "#ef4444" },
  {
    key: "cancelled",
    label: "Đã hủy",
    icon: "close-circle-outline",
    color: "#64748b",
  },
];

export default function InvoiceListScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const loadInvoices = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const params = { limit: 50, page: 1 };
      if (statusFilter) params.status = statusFilter;

      const data = await getMyInvoices(params);
      setInvoices(data.items || []);
    } catch (error) {
      console.error("Load Invoice Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [statusFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--/--/----";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const handleFilterSelect = (filterKey) => {
    setStatusFilter(filterKey);
    setModalVisible(false);
  };

  const getActiveFilterLabel = () => {
    const active = FILTER_OPTIONS.find((f) => f.key === statusFilter);
    return active ? active.label : "Tất cả";
  };

  const renderItem = ({ item }) => {
    const isPaid = item.status === "paid";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("InvoiceDetail", { invoiceId: item._id })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.row}>
            <Ionicons name="receipt-outline" size={18} color="#475569" />
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: STATUS_COLORS[item.status] || "#94a3b8" },
            ]}
          >
            <Text style={styles.badgeText}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.buildingName}>
            {item.buildingId?.name} - P.{item.roomId?.roomNumber}
          </Text>
          <Text style={styles.periodText}>
            Hóa đơn kỳ: {item.periodMonth}/{item.periodYear}
          </Text>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Tổng tiền:</Text>
            <Text style={styles.amountText}>
              {formatCurrency(item.totalAmount)}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>
              {isPaid ? "Ngày thanh toán:" : "Hạn thanh toán:"}
            </Text>
            <Text
              style={[
                styles.dateText,
                item.status === "overdue" && { color: "#ef4444" },
              ]}
            >
              {formatDate(isPaid ? item.paidAt : item.dueDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hóa đơn của tôi</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="filter" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Filter Button Display */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.filterButtonContent}>
          <Ionicons name="funnel-outline" size={18} color="#3b82f6" />
          <Text style={styles.filterButtonText}>{getActiveFilterLabel()}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#cbd5e1"
              />
              <Text style={styles.emptyText}>Chưa có hóa đơn nào</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc theo trạng thái</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {FILTER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    statusFilter === option.key && styles.filterOptionActive,
                  ]}
                  onPress={() => handleFilterSelect(option.key)}
                >
                  <View style={styles.filterOptionLeft}>
                    <View
                      style={[
                        styles.filterIcon,
                        { backgroundColor: option.color + "20" },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={option.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.filterOptionText,
                        statusFilter === option.key &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {statusFilter === option.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#3b82f6"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  filterButtonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterButtonText: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  invoiceNumber: { fontSize: 14, fontWeight: "600", color: "#475569" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "bold" },
  cardBody: { gap: 4 },
  buildingName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  periodText: { fontSize: 13, color: "#64748b" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 13, color: "#64748b" },
  amountText: { fontSize: 16, fontWeight: "bold", color: "#3b82f6" },
  dateText: { fontSize: 13, fontWeight: "500", color: "#334155" },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { marginTop: 12, color: "#94a3b8" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  modalBody: { padding: 16 },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  filterOptionActive: {
    backgroundColor: "#eff6ff",
    borderWidth: 1.5,
    borderColor: "#3b82f6",
  },
  filterOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterOptionText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  filterOptionTextActive: { color: "#1e293b", fontWeight: "700" },
});
