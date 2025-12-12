import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getMyInvoiceDetail } from "../../api/invoiceApi";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const STATUS_COLORS = {
  draft: "#6b7280",
  sent: "#3b82f6",
  transfer_pending: "#f59e0b",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#9ca3af",
};

const STATUS_LABELS = {
  draft: "Bản nháp",
  sent: "Chờ thanh toán",
  transfer_pending: "Chờ xác nhận",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Đã hủy",
};

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadInvoiceDetail();
    }, [invoiceId])
  );

  const loadInvoiceDetail = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getMyInvoiceDetail(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error("Error loading invoice detail:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải thông tin hóa đơn",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoiceDetail(true);
  };

  const handlePayPress = () => {
    navigation.navigate("PaymentScreen", {
      invoiceId: invoiceId,
      invoiceCode: invoice.invoiceNumber,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
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

  const getDaysOverdue = () => {
    if (!invoice?.dueDate || invoice.status !== "overdue") return 0;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải thông tin hóa đơn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Không tìm thấy hóa đơn</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadInvoiceDetail()}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canPay = invoice.status === "sent" || invoice.status === "overdue";
  const isPending = invoice.status === "transfer_pending";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("InvoiceList")}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
            <Text style={styles.headerSubtitle}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusLeft}>
                <Text style={styles.invoiceNumberLarge}>
                  {invoice.invoiceNumber}
                </Text>
                <Text style={styles.periodText}>
                  Kỳ {invoice.periodMonth}/{invoice.periodYear}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadgeLarge,
                  {
                    backgroundColor: STATUS_COLORS[invoice.status] || "#9ca3af",
                  },
                ]}
              >
                <Text style={styles.statusTextLarge}>
                  {STATUS_LABELS[invoice.status] || invoice.status}
                </Text>
              </View>
            </View>

            {isPending && (
              <View style={styles.pendingAlert}>
                <Ionicons name="time-outline" size={20} color="#92400e" />
                <Text style={styles.pendingText}>
                  Bạn đã gửi minh chứng. Vui lòng chờ chủ trọ xác nhận.
                </Text>
              </View>
            )}

            {invoice.contractId && (
              <View style={styles.contractInfo}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#64748b"
                />
                <Text style={styles.contractText}>
                  Hợp đồng: {invoice.contractId.contract?.no || "N/A"}
                </Text>
              </View>
            )}
          </View>

          {/* Property Info */}
          <View style={styles.section}>
            <View style={styles.propertyCard}>
              <View style={styles.propertyRow}>
                <View style={styles.propertyItem}>
                  <Text style={styles.propertyLabel}>Tòa nhà</Text>
                  <Text style={styles.propertyValue}>
                    {invoice.buildingId?.name || "-"}
                  </Text>
                </View>
                <View style={styles.propertyDivider} />
                <View style={styles.propertyItem}>
                  <Text style={styles.propertyLabel}>Phòng</Text>
                  <Text style={styles.propertyValue}>
                    {invoice.roomId?.roomNumber || "-"}
                  </Text>
                </View>
              </View>
              {invoice.buildingId?.address && (
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={16} color="#64748b" />
                  <Text style={styles.addressText}>
                    {invoice.buildingId.address}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Thời gian</Text>
            </View>
            <View style={styles.timelineCard}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotBlue]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Ngày phát hành</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(invoice.issuedAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.timelineLine} />
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    invoice.status === "overdue"
                      ? styles.timelineDotRed
                      : styles.timelineDotOrange,
                  ]}
                />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Hạn thanh toán</Text>
                  <Text
                    style={[
                      styles.timelineDate,
                      invoice.status === "overdue" && styles.overdueDateText,
                    ]}
                  >
                    {formatDate(invoice.dueDate)}
                  </Text>
                  {invoice.status === "overdue" && (
                    <View style={styles.overdueTag}>
                      <Ionicons name="warning" size={12} color="#ef4444" />
                      <Text style={styles.overdueTagText}>
                        Quá hạn {getDaysOverdue()} ngày
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {invoice.paidAt && (
                <>
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineItem}>
                    <View
                      style={[styles.timelineDot, styles.timelineDotGreen]}
                    />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Đã thanh toán</Text>
                      <Text style={[styles.timelineDate, styles.paidDateText]}>
                        {formatDateTime(invoice.paidAt)}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Invoice Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Chi tiết hóa đơn</Text>
            </View>
            <View style={styles.itemsCard}>
              {invoice.items?.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIconContainer}>
                      <Ionicons
                        name={item.type === "rent" ? "home" : "layers"}
                        size={18}
                        color="#3b82f6"
                      />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      {item.description && (
                        <Text style={styles.itemDescription}>
                          {item.description}
                        </Text>
                      )}
                      {item.quantity > 1 && (
                        <Text style={styles.itemMeta}>
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoice.subtotal)}
              </Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatCurrency(invoice.discountAmount)}
                </Text>
              </View>
            )}
            {invoice.lateFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí trễ hạn</Text>
                <Text style={[styles.summaryValue, styles.lateFeeValue]}>
                  +{formatCurrency(invoice.lateFee)}
                </Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </View>
            {invoice.paidAmount > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Đã thanh toán</Text>
                  <Text style={[styles.summaryValue, styles.paidValue]}>
                    {formatCurrency(invoice.paidAmount)}
                  </Text>
                </View>
                {invoice.totalAmount - invoice.paidAmount > 0 && (
                  <View style={styles.remainingRow}>
                    <Text style={styles.remainingLabel}>Còn lại</Text>
                    <Text style={styles.remainingValue}>
                      {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Notes Section - ĐÃ CẬP NHẬT GIAO DIỆN */}
          {invoice.note && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbox" size={20} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Ghi chú</Text>
              </View>
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>{invoice.note}</Text>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {canPay && (
          <View style={styles.bottomBar}>
            <View style={styles.bottomBarContent}>
              <View>
                <Text style={styles.bottomTotalLabel}>Tổng thanh toán</Text>
                <Text style={styles.bottomTotalValue}>
                  {formatCurrency(
                    invoice.totalAmount - (invoice.paidAmount || 0)
                  )}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.payButton}
                onPress={handlePayPress}
              >
                <>
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.payButtonText}>Thanh toán ngay</Text>
                </>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: { padding: 8, marginRight: 8 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  headerSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748b" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    color: "#1e293b",
  },
  retryButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  statusCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceNumberLarge: { fontSize: 22, fontWeight: "bold", color: "#1e293b" },
  periodText: { color: "#64748b" },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextLarge: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  contractInfo: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 8,
  },
  contractText: { color: "#475569", fontSize: 13 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  propertyCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  propertyRow: { flexDirection: "row" },
  propertyItem: { flex: 1 },
  propertyLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  propertyValue: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  propertyDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  addressRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexDirection: "row",
    gap: 8,
  },
  addressText: { color: "#64748b", fontSize: 13, flex: 1 },
  timelineCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timelineItem: { flexDirection: "row" },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  timelineDotBlue: { backgroundColor: "#3b82f6" },
  timelineDotOrange: { backgroundColor: "#f59e0b" },
  timelineDotRed: { backgroundColor: "#ef4444" },
  timelineDotGreen: { backgroundColor: "#10b981" },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: "#e2e8f0",
    marginLeft: 4,
    marginVertical: 2,
  },
  timelineContent: { flex: 1, paddingBottom: 4 },
  timelineLabel: { fontSize: 12, color: "#64748b" },
  timelineDate: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  itemsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    justifyContent: "space-between",
  },
  itemLeft: { flexDirection: "row", flex: 1, paddingRight: 12 },
  itemIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  itemDescription: { fontSize: 12, color: "#64748b", marginTop: 2 },
  itemMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  itemAmount: { fontWeight: "700", color: "#1e293b" },
  summarySection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { color: "#64748b" },
  summaryValue: { fontWeight: "600", color: "#1e293b" },
  discountValue: { color: "#10b981" },
  lateFeeValue: { color: "#ef4444" },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  totalValue: { fontSize: 20, fontWeight: "bold", color: "#3b82f6" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomTotalLabel: { fontSize: 12, color: "#64748b" },
  bottomTotalValue: { fontSize: 18, fontWeight: "bold", color: "#3b82f6" },
  payButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  pendingAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  pendingText: {
    color: "#92400e",
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  noteCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  noteText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
  },
});
