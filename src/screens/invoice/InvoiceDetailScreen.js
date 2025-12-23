import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getMyInvoiceDetail } from "../../api/invoiceApi";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get("window");

const STATUS_CONFIG = {
  draft: { label: "Bản nháp", color: "#94a3b8", bg: "#f1f5f9" },
  sent: { label: "Chờ thanh toán", color: "#3b82f6", bg: "#eff6ff" },
  transfer_pending: { label: "Chờ xác nhận", color: "#f59e0b", bg: "#fffbeb" },
  paid: { label: "Đã thanh toán", color: "#10b981", bg: "#f0fdf4" },
  overdue: { label: "Quá hạn", color: "#ef4444", bg: "#fef2f2" },
  cancelled: { label: "Đã hủy", color: "#64748b", bg: "#f8fafc" },
  replaced: { label: "Đã thay thế", color: "#475569", bg: "#f1f5f9" },
};

const ITEM_TYPE_CONFIG = {
  rent: {
    icon: "home",
    color: "#3b82f6",
    bg: "#eff6ff",
    label: "Tiền thuê phòng",
  },
  electric: {
    icon: "flash",
    color: "#f59e0b",
    bg: "#fffbeb",
    label: "Tiền điện",
  },
  water: { icon: "water", color: "#06b6d4", bg: "#ecfeff", label: "Tiền nước" },
  service: { icon: "wifi", color: "#8b5cf6", bg: "#f5f3ff", label: "Dịch vụ" },
  other: {
    icon: "layers",
    color: "#64748b",
    bg: "#f1f5f9",
    label: "Chi phí khác",
  },
};

const getItemConfig = (type) =>
  ITEM_TYPE_CONFIG[type] || ITEM_TYPE_CONFIG.other;

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoiceId } = route.params;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
    }, [invoiceId])
  );

  const loadDetail = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getMyInvoiceDetail(invoiceId);
      setInvoice(data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải chi tiết hóa đơn",
      });
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePay = () => {
    navigation.navigate("PaymentScreen", {
      invoiceId: invoice._id,
      invoiceCode: invoice.invoiceNumber,
    });
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!invoice) return null;

  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const canPay = ["sent", "overdue"].includes(invoice.status);
  const isPending = invoice.status === "transfer_pending";
  const isPaid = invoice.status === "paid";
  const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDetail(true)}
          />
        }
      >
        {/* --- STATUS BADGE --- */}
        <View
          style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusConfig.color }]}
          />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* --- GENERAL INFO --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt" size={28} color="#3b82f6" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <Text style={styles.periodText}>
                Kỳ {invoice.periodMonth}/{invoice.periodYear}
              </Text>
            </View>
          </View>
          <View style={styles.dividerSmall} />
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>
              {invoice.buildingId?.name} - Phòng {invoice.roomId?.roomNumber}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#64748b" />
            <Text style={styles.infoText}>
              Hạn đóng: {formatDate(invoice.dueDate)}
            </Text>
          </View>
          {isPaid && invoice.paidAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={[styles.infoText, { color: "#10b981" }]}>
                Đã thanh toán: {formatDate(invoice.paidAt)}
              </Text>
            </View>
          )}
        </View>

        {/* --- PENDING BANNER (Nếu đang chờ xác nhận) --- */}
        {isPending && (
          <View style={styles.pendingBox}>
            <Ionicons name="hourglass" size={22} color="#f59e0b" />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Đang chờ duyệt</Text>
              <Text style={styles.pendingText}>
                Bạn đã gửi minh chứng thanh toán. Vui lòng chờ chủ trọ xác nhận.
              </Text>
            </View>
          </View>
        )}

        {/* --- ITEMS LIST --- */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color="#475569" />
          <Text style={styles.sectionTitle}>Chi tiết khoản thu</Text>
        </View>

        <View style={styles.card}>
          {invoice.items &&
            invoice.items.map((item, index) => {
              const config = getItemConfig(item.type);
              return (
                <View key={index} style={styles.itemRow}>
                  <View
                    style={[styles.itemIconBox, { backgroundColor: config.bg }]}
                  >
                    <Ionicons
                      name={config.icon}
                      size={22}
                      color={config.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>
                      {item.label || config.label}
                    </Text>
                    <Text style={styles.itemSub}>
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </Text>
                  </View>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              );
            })}
        </View>

        {/* --- SUMMARY --- */}
        <View style={styles.sectionHeader}>
          <Ionicons name="calculator" size={20} color="#475569" />
          <Text style={styles.sectionTitle}>Tổng kết</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thành tiền</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#10b981" }]}>
                Giảm giá
              </Text>
              <Text style={[styles.summaryValue, { color: "#10b981" }]}>
                -{formatCurrency(invoice.discountAmount)}
              </Text>
            </View>
          )}
          {invoice.lateFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "#ef4444" }]}>
                Phí trễ hạn
              </Text>
              <Text style={[styles.summaryValue, { color: "#ef4444" }]}>
                +{formatCurrency(invoice.lateFee)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TỔNG CỘNG</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
          </View>

          {/* Số tiền đã trả / còn lại */}
          {invoice.paidAmount > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.summaryRow}>
                <Text style={{ fontSize: 14, color: "#10b981" }}>
                  Đã thanh toán
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: "#10b981" }}
                >
                  {formatCurrency(invoice.paidAmount)}
                </Text>
              </View>
            </View>
          )}

          {remainingAmount > 0 && (
            <View
              style={[
                styles.remainingBox,
                {
                  backgroundColor:
                    invoice.status === "overdue" ? "#fef2f2" : "#eff6ff",
                },
              ]}
            >
              <Text style={styles.remainingLabel}>Cần thanh toán</Text>
              <Text
                style={[
                  styles.remainingValue,
                  {
                    color: invoice.status === "overdue" ? "#ef4444" : "#3b82f6",
                  },
                ]}
              >
                {formatCurrency(remainingAmount)}
              </Text>
            </View>
          )}
        </View>

        {/*MINH CHỨNG THANH TOÁN*/}
        {invoice.transferProofImageUrl ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="image-outline" size={20} color="#475569" />
              <Text style={styles.sectionTitle}>Minh chứng chuyển khoản</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.proofDate}>
                Gửi lúc:{" "}
                {formatDate(invoice.transferRequestedAt || invoice.updatedAt)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.proofImageContainer}
                onPress={() => setModalVisible(true)}
              >
                <Image
                  source={{ uri: invoice.transferProofImageUrl }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
                <View style={styles.zoomOverlay}>
                  <Ionicons name="expand-outline" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
              {invoice.paymentNote ? (
                <Text style={styles.noteContent}>
                  Ghi chú: {invoice.paymentNote}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* --- NOTE (General) --- */}
        {invoice.note && (
          <View style={styles.noteBox}>
            <View style={styles.noteHeader}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#64748b"
              />
              <Text style={styles.noteTitle}>Ghi chú hóa đơn</Text>
            </View>
            <Text style={styles.noteContent}>{invoice.note}</Text>
          </View>
        )}
      </ScrollView>

      {/* --- FOOTER BUTTON --- */}
      {canPay && (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerLabel}>Cần thanh toán</Text>
            <Text style={styles.footerAmount}>
              {formatCurrency(remainingAmount)}
            </Text>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.payBtnText}>Thanh toán ngay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- MODAL ZOOM ẢNH --- */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: invoice?.transferProofImageUrl }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  scrollContent: { padding: 16, paddingBottom: 100 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  invoiceNumber: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  periodText: { fontSize: 13, color: "#64748b", marginTop: 2 },
  dividerSmall: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  infoText: { fontSize: 14, color: "#475569", flex: 1 },

  pendingBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  pendingTitle: { fontSize: 14, fontWeight: "700", color: "#92400e" },
  pendingText: { fontSize: 13, color: "#78350f", marginTop: 2 },

  sectionContainer: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemLabel: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  itemSub: { fontSize: 12, color: "#94a3b8" },
  itemAmount: { fontSize: 14, fontWeight: "700", color: "#1e293b" },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#64748b" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#334155" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
  },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#475569" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#3b82f6" },
  remainingBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remainingLabel: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  remainingValue: { fontSize: 16, fontWeight: "800" },

  // Styles cho Proof Image
  proofDate: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
    fontStyle: "italic",
  },
  proofImageContainer: {
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    position: "relative",
    marginBottom: 8,
  },
  proofImage: { width: "100%", height: "100%" },
  zoomOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 6,
  },

  noteBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#94a3b8",
    marginBottom: 20,
  },
  noteHeader: { flexDirection: "row", gap: 6, marginBottom: 6 },
  noteTitle: { fontSize: 14, fontWeight: "700", color: "#475569" },
  noteContent: {
    fontSize: 14,
    color: "#334155",
    fontStyle: "italic",
    lineHeight: 20,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
  },
  footerLeft: { flex: 1 },
  footerLabel: { fontSize: 12, color: "#64748b" },
  footerAmount: { fontSize: 18, fontWeight: "800", color: "#ef4444" },
  payBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalImage: {
    width: width,
    height: height * 0.8,
  },
});
