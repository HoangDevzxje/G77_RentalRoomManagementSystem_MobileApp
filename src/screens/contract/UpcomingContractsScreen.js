import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { listUpcomingExpire, requestExtend } from "../../api/contractApi";

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

const UpcomingContractsScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(!route.params?.fromFilter);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState(route.params?.contracts || []);
  const [days] = useState(60);

  // Extend modal state
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [extendMonths, setExtendMonths] = useState("");
  const [extendNote, setExtendNote] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);

  const listRef = useRef(null);

  const computeDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const diff = new Date(endDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (daysLeft) => {
    if (daysLeft <= 7)
      return { color: "#ef4444", label: "Sắp hết hạn", bgColor: "#fef2f2" };
    if (daysLeft <= 30)
      return { color: "#f59e0b", label: "Sắp đến hạn", bgColor: "#fffbeb" };
    return { color: "#10b981", label: "Còn thời gian", bgColor: "#f0fdf4" };
  };

  const getContractDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "Chưa xác định";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    if (months > 0 && remainingDays > 0) {
      return `${months} tháng ${remainingDays} ngày`;
    } else if (months > 0) {
      return `${months} tháng`;
    } else {
      return `${diffDays} ngày`;
    }
  };

  const getContractStatusFromDates = (contractData) => {
    if (!contractData) return { type: "unknown", text: "Không xác định" };
    const startDate = contractData.contract?.startDate;
    const endDate = contractData.contract?.endDate;
    const now = new Date();
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (now < start) {
        return { type: "pending", text: "Sắp bắt đầu" };
      } else if (now > end) {
        return { type: "expired", text: "Đã hết hạn" };
      } else {
        return { type: "active", text: "Đang hiệu lực" };
      }
    }
    return { type: "unknown", text: "Không xác định" };
  };

  const prepareContracts = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((c) => {
        const daysLeft = computeDaysLeft(c.contract?.endDate);
        return {
          ...c,
          __daysLeft: daysLeft,
          __statusFromDates: getContractStatusFromDates(c),
        };
      })
      .filter((c) => c.__daysLeft > 0 && c.__daysLeft <= days);
  };

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await listUpcomingExpire({ days, limit: 50 });
      const items = res.items || res.data || res || [];
      const prepared = (items || []).map((c) => ({
        ...c,
        __daysLeft: computeDaysLeft(c.contract?.endDate),
        __statusFromDates: getContractStatusFromDates(c),
      }));
      setContracts(
        prepared.filter((c) => c.__daysLeft > 0 && c.__daysLeft <= days)
      );
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          e?.response?.data?.message ||
          e?.message ||
          "Không tải được hợp đồng sắp hết hạn",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (route.params?.fromFilter && Array.isArray(route.params?.contracts)) {
      const prepared = prepareContracts(route.params.contracts || []);
      setContracts(prepared);
      setLoading(false);

      const focusedId = route.params?.focusedId;
      if (focusedId && prepared.length > 0) {
        const idx = prepared.findIndex((c) => c._id === focusedId);
        if (idx >= 0 && listRef.current) {
          setTimeout(() => {
            listRef.current.scrollToIndex({ index: idx, animated: true });
          }, 250);
        }
      }
    } else {
      fetchUpcoming();
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (route.params?.fromFilter && Array.isArray(route.params?.contracts)) {
      setContracts(prepareContracts(route.params.contracts || []));
      setRefreshing(false);
    } else {
      fetchUpcoming();
    }
  };

  const formatDate = (d) => {
    if (!d) return "--/--/----";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const openDetail = (id) => {
    navigation.navigate("ContractDetail", { id });
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
      if (route.params?.fromFilter) {
        navigation.goBack();
      } else {
        fetchUpcoming();
      }
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

  const showContractActions = (contract) => {
    Alert.alert(
      "Tùy chọn hợp đồng",
      `Phòng ${contract.roomId?.roomNumber} - ${contract.buildingId?.name}`,
      [
        {
          text: "Xem chi tiết",
          onPress: () => openDetail(contract._id),
        },
        {
          text: "Yêu cầu gia hạn",
          onPress: () => openExtendModal(contract),
        },
        {
          text: "Hủy",
          style: "cancel",
        },
      ]
    );
  };

  const renderItem = ({ item, index }) => {
    const daysLeft = item.__daysLeft ?? computeDaysLeft(item.contract?.endDate);
    const urgency = getUrgencyLevel(daysLeft);
    const duration = getContractDuration(
      item.contract?.startDate,
      item.contract?.endDate
    );

    return (
      <TouchableOpacity
        style={[
          styles.card,
          index === 0 && styles.firstCard,
          index === contracts.length - 1 && styles.lastCard,
          { borderLeftColor: urgency.color, borderLeftWidth: 4 },
        ]}
        onPress={() => showContractActions(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.propertyInfo}>
            <Text style={styles.buildingName} numberOfLines={1}>
              {item.buildingId?.name || "—"}
            </Text>
            <Text style={styles.roomNumber}>
              Phòng {item.roomId?.roomNumber || "—"}
            </Text>
          </View>
          <View
            style={[styles.urgencyBadge, { backgroundColor: urgency.bgColor }]}
          >
            <Text style={[styles.urgencyText, { color: urgency.color }]}>
              {urgency.label}
            </Text>
          </View>
        </View>

        <View style={styles.contractInfo}>
          <View style={styles.contractRow}>
            <Ionicons name="document-text" size={16} color="#64748b" />
            <Text style={styles.contractNumber} numberOfLines={1}>
              {item.contract?.no || `HĐ: ${item._id?.slice(-8)}`}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text style={styles.dateText}>Thời hạn: {duration}</Text>
          </View>
        </View>

        <View style={styles.contractPeriodSection}>
          <View style={styles.periodRow}>
            <Ionicons name="calendar-outline" size={16} color="#0d9488" />
            <View style={styles.periodTextContainer}>
              <Text style={styles.periodLabel}>Bắt đầu</Text>
              <Text style={styles.periodDate}>
                {formatDate(item.contract?.startDate)}
              </Text>
            </View>
          </View>
          <View style={styles.periodDivider}>
            <Ionicons name="arrow-forward" size={16} color="#cbd5e1" />
          </View>
          <View style={styles.periodRow}>
            <Ionicons name="calendar" size={16} color="#ef4444" />
            <View style={styles.periodTextContainer}>
              <Text style={styles.periodLabel}>Kết thúc</Text>
              <Text style={styles.periodDate}>
                {formatDate(item.contract?.endDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.daysLeftSection}>
          <View style={styles.daysLeftContainer}>
            <Text style={[styles.daysLeftNumber, { color: urgency.color }]}>
              {daysLeft}
            </Text>
            <Text style={[styles.daysLeftLabel, { color: urgency.color }]}>
              ngày
            </Text>
          </View>
          <Text style={styles.daysLeftText}>còn lại</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openDetail(item._id)}
          >
            <Ionicons name="eye" size={16} color="#0d9488" />
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.extendButton]}
            onPress={() => openExtendModal(item)}
          >
            <Ionicons name="calendar" size={16} color="#fff" />
            <Text style={[styles.actionButtonText, { color: "#fff" }]}>
              Gia hạn
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0d9488" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Hợp đồng sắp hết hạn</Text>
          <Text style={styles.headerSubtitle}>
            {contracts.length > 0
              ? `${contracts.length} hợp đồng sẽ hết hạn trong ${days} ngày tới`
              : "Không có hợp đồng nào sắp hết hạn"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        data={contracts}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          contracts.length > 0 && (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {route.params?.fromFilter
                  ? "Các hợp đồng sắp hết hạn từ danh sách của bạn"
                  : "Danh sách hợp đồng sắp hết hạn"}
              </Text>
              <Text style={styles.listSubtitle}>
                Nhấn vào hợp đồng để xem các tùy chọn
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#86efac" />
            </View>
            <Text style={styles.emptySubtitle}>
              {route.params?.fromFilter
                ? "Không có hợp đồng nào sắp hết hạn trong danh sách của bạn"
                : "Tất cả hợp đồng của bạn đều còn hạn dài"}
            </Text>
            <TouchableOpacity
              style={styles.backToHomeButton}
              onPress={() => navigation.navigate("Contracts")}
            >
              <Text style={styles.backToHomeText}>Quay lại danh sách</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Extend Modal */}
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
                  Thời hạn hiện tại:{" "}
                  {getContractDuration(
                    selectedContract.contract?.startDate,
                    selectedContract.contract?.endDate
                  )}
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
  screen: { flex: 1, backgroundColor: "#f1f5f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
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
  backButton: { padding: 4 },
  headerContent: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    textAlign: "center",
  },
  listContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  listHeader: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    marginBottom: 4,
  },
  listSubtitle: { fontSize: 14, color: "#64748b", textAlign: "center" },
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
      android: { elevation: 3 },
    }),
  },
  firstCard: { marginTop: 4 },
  lastCard: { marginBottom: 8 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  propertyInfo: { flex: 1, marginRight: 12 },
  buildingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  roomNumber: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  urgencyText: { fontSize: 12, fontWeight: "600" },
  contractInfo: { marginBottom: 16 },
  contractRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  contractNumber: { marginLeft: 8, fontSize: 14, color: "#64748b", flex: 1 },
  dateRow: { flexDirection: "row", alignItems: "center" },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  contractPeriodSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  periodRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  periodTextContainer: { marginLeft: 8 },
  periodLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  periodDate: { fontSize: 13, color: "#0f172a", fontWeight: "700" },
  periodDivider: { paddingHorizontal: 12 },
  daysLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  daysLeftContainer: { alignItems: "center" },
  daysLeftNumber: { fontSize: 24, fontWeight: "800", color: "#f59e0b" },
  daysLeftLabel: { fontSize: 12, color: "#d97706", fontWeight: "600" },
  daysLeftText: { fontSize: 14, color: "#d97706", fontWeight: "500" },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    gap: 6,
  },
  extendButton: { backgroundColor: "#f59e0b" },
  actionButtonText: { fontSize: 13, fontWeight: "600" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
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
  emptyIcon: { marginBottom: 24, opacity: 0.8 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 32,
  },
  backToHomeButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeText: { color: "#fff", fontWeight: "600", fontSize: 14 },
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
  contractInfoText: { fontSize: 14, color: "#475569", marginBottom: 4 },
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
  modalBtnDisabled: { backgroundColor: "#94a3b8", opacity: 0.6 },
});

export default UpcomingContractsScreen;
