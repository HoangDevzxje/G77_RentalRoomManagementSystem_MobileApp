import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getMyInvoiceDetail } from "../../api/invoiceApi";

const STATUS_COLORS = {
  draft: "#6b7280",
  sent: "#3b82f6",
  paid: "#10b981",
  overdue: "#ef4444",
  cancelled: "#9ca3af",
};

const STATUS_LABELS = {
  draft: "Bản nháp",
  sent: "Chờ thanh toán",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  cancelled: "Đã hủy",
};

const PAYMENT_METHODS = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  online_gateway: "Cổng thanh toán",
};

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoiceDetail();
  }, [invoiceId]);

  const loadInvoiceDetail = async () => {
    try {
      setLoading(true);
      const data = await getMyInvoiceDetail(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error("Error loading invoice detail:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
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
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>
          <Text style={styles.errorText}>Không tìm thấy hóa đơn</Text>
          <Text style={styles.errorSubtext}>
            Hóa đơn không tồn tại hoặc đã bị xóa
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInvoiceDetail}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
            <Text style={styles.headerSubtitle}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
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
                  { backgroundColor: STATUS_COLORS[invoice.status] },
                ]}
              >
                <Text style={styles.statusTextLarge}>
                  {STATUS_LABELS[invoice.status]}
                </Text>
              </View>
            </View>

            {/* Contract Info */}
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
                {invoice.contractId.contract?.startDate && (
                  <Text style={styles.contractDate}>
                    ({formatDate(invoice.contractId.contract.startDate)} -{" "}
                    {formatDate(invoice.contractId.contract.endDate)})
                  </Text>
                )}
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
              {invoice.sentAt && (
                <>
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineItem}>
                    <View
                      style={[styles.timelineDot, styles.timelineDotPurple]}
                    />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Đã gửi email</Text>
                      <Text style={styles.timelineDate}>
                        {formatDateTime(invoice.sentAt)}
                      </Text>
                      {invoice.emailStatus && (
                        <View style={styles.emailStatusBadge}>
                          <Text style={styles.emailStatusText}>
                            {invoice.emailStatus === "sent"
                              ? "Gửi thành công"
                              : invoice.emailStatus}
                          </Text>
                        </View>
                      )}
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

          {/* Payment Info */}
          {invoice.paymentMethod && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card" size={20} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
              </View>
              <View style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Phương thức</Text>
                  <Text style={styles.paymentValue}>
                    {PAYMENT_METHODS[invoice.paymentMethod] ||
                      invoice.paymentMethod}
                  </Text>
                </View>
                {invoice.paymentRef && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Mã tham chiếu</Text>
                    <Text style={styles.paymentValue}>
                      {invoice.paymentRef}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Notes */}
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

          <View style={{ height: 100 }} />
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 32,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    color: "#1e293b",
    fontWeight: "700",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Status Card
  statusCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statusLeft: {
    flex: 1,
  },
  invoiceNumberLarge: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  periodText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  statusBadgeLarge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusTextLarge: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  contractInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 6,
  },
  contractText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  contractDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
  },
  // Property Card
  propertyCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  propertyItem: {
    flex: 1,
  },
  propertyLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  propertyValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "700",
  },
  propertyDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 6,
  },
  addressText: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
  },
  // Timeline Card
  timelineCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotBlue: {
    backgroundColor: "#3b82f6",
  },
  timelineDotOrange: {
    backgroundColor: "#f59e0b",
  },
  timelineDotRed: {
    backgroundColor: "#ef4444",
  },
  timelineDotGreen: {
    backgroundColor: "#10b981",
  },
  timelineDotPurple: {
    backgroundColor: "#8b5cf6",
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: "#e2e8f0",
    marginLeft: 5,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
    fontWeight: "500",
  },
  timelineDate: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  overdueDateText: {
    color: "#ef4444",
  },
  paidDateText: {
    color: "#10b981",
  },
  overdueTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  overdueTagText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  emailStatusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  emailStatusText: {
    fontSize: 11,
    color: "#3b82f6",
    fontWeight: "600",
  },
  // Items Card
  itemsCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemLeft: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "700",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
    lineHeight: 18,
  },
  itemMeta: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  itemAmount: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "700",
  },
  // Summary Section
  summarySection: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  discountValue: {
    color: "#10b981",
  },
  lateFeeValue: {
    color: "#ef4444",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3b82f6",
  },
  paidValue: {
    color: "#10b981",
  },
  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  remainingLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400e",
  },
  remainingValue: {
    fontSize: 18,
    color: "#f59e0b",
    fontWeight: "700",
  },
  // Payment Card
  paymentCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  paymentValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "700",
  },
  // Note Card
  noteCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noteText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
});
