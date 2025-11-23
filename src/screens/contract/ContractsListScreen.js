import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  getMyContracts,
  downloadContractPdf,
  requestExtend,
} from "../../api/contractApi";
import SearchBar from "../../components/contracts/list/SearchBar";
import StatusFilterDropdown from "../../components/contracts/list/StatusFilterDropdown";
import ContractCard from "../../components/contracts/list/ContractCard";
import ExtendModal from "../../components/contracts/list/ExtendModal";
import { getAccessToken } from "../../utils/storage";
import {
  computeDaysLeft,
  computeStatusFromDates,
  getContractStatus,
  getStatusInfo,
} from "../../utils/contractHelpers";

const STATUS_BAR_HEIGHT = 0;

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

  const handleDownloadPdf = async (contract) => {
    if (!contract) return;

    const hasBuilding = !!contract.buildingId;
    const hasRoom = !!contract.roomId;
    const hasDates =
      !!contract.contract?.startDate && !!contract.contract?.endDate;
    const status = contract.status;

    if (!hasBuilding || !hasRoom || !hasDates || status !== "completed") {
      const problems = [];
      if (!hasBuilding || !hasRoom)
        problems.push("thiếu thông tin tòa nhà hoặc phòng");
      if (!hasDates) problems.push("chưa có ngày bắt đầu/kết thúc");
      if (status !== "completed")
        problems.push("hợp đồng chưa ở trạng thái 'Hoàn thành'");

      Toast.show({
        type: "error",
        text1: "Không thể tải PDF",
        text2: `Vui lòng kiểm tra hợp đồng: ${problems.join(" · ")}.`,
      });
      return;
    }

    setDownloading(contract._id);
    try {
      const API_BASE =
        process.env.EXPO_PUBLIC_API_URL ||
        "https://faultier-nonaristocratically-willene.ngrok-free.dev";

      if (Platform.OS === "web") {
        await downloadContractPdf(contract._id);
        Toast.show({ type: "success", text1: "Đang tải file PDF..." });
        return;
      }

      const url = `${API_BASE.replace(/\/$/, "")}/contracts/${
        contract._id
      }/download`;
      const token = await getAccessToken();

      if (!token) {
        Toast.show({
          type: "error",
          text1: "Thiếu token",
          text2: "Không tìm thấy token. Hãy đăng nhập lại.",
        });
        throw new Error("Missing auth token");
      }

      const headResp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/pdf, */*",
        },
      });
      const ct = headResp.headers.get("content-type") || "";
      const statusCode = headResp.status;

      if (!headResp.ok) {
        const txt = await headResp.text().catch(() => "<no-body>");
        throw new Error(`Server trả ${statusCode}. Body: ${txt}`);
      }
      if (!ct.toLowerCase().includes("pdf")) {
        const bodyText = await headResp.text().catch(() => "<no-body>");
        throw new Error(
          `Server trả content-type="${ct}". Body snippet: ${String(
            bodyText
          ).slice(0, 300)}`
        );
      }

      const fileName = `contract_${contract._id}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!downloadResult || !downloadResult.uri) {
        throw new Error("Download không trả về uri hợp lệ");
      }

      let shared = false;
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri);
          shared = true;
        }
      } catch (err) {}

      if (!shared) {
        const supported = await Linking.canOpenURL(downloadResult.uri);
        if (supported) await Linking.openURL(downloadResult.uri);
        else {
          Toast.show({
            type: "success",
            text1: "Đã tải xong",
            text2: `Lưu tại ${downloadResult.uri}`,
          });
        }
      }

      Toast.show({ type: "success", text1: "Đã tải file PDF" });
    } catch (e) {
      const message = (e && e.message) || String(e);
      Toast.show({
        type: "error",
        text1: "Tải thất bại",
        text2:
          message.includes("404") || message.includes("Cannot GET")
            ? "Server trả 404/Không tìm thấy. Kiểm tra đường dẫn hoặc token."
            : message,
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Hợp đồng thuê trọ</Text>
          <Text style={styles.headerSubtitle}>Quản lý hợp đồng của bạn</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={onSubmitSearch}
          onClear={clearSearch}
          focused={searchFocused}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          submitting={submittingSearch}
        />

        <View style={styles.filterRow}>
          <View style={styles.filterButton}>
            <TouchableOpacity
              onPress={() => setShowStatusFilter(!showStatusFilter)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
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
        </View>

        <StatusFilterDropdown
          options={statusOptions}
          selected={statusFilter}
          onSelect={(v) => {
            setStatusFilter(v);
            setShowStatusFilter(false);
          }}
          visible={showStatusFilter}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <ContractCard
              item={item}
              index={index}
              lastIndex={contracts.length - 1}
              onOpenDetail={openDetail}
              onDownload={handleDownloadPdf}
              downloading={downloading}
            />
          )}
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

      <ExtendModal
        visible={extendModalVisible}
        onClose={closeExtendModal}
        onSubmit={submitExtend}
        selectedContract={selectedContract}
        months={extendMonths}
        setMonths={setExtendMonths}
        note={extendNote}
        setNote={setExtendNote}
        loading={extendLoading}
      />

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
  },
  headerContent: { alignItems: "center", marginBottom: 12 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  searchSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  filterRow: { marginTop: 8 },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    marginLeft: 8,
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
  clearFilterText: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  listContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
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
  emptyIcon: { marginBottom: 20, opacity: 0.8 },
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
});

export default ContractsListScreen;
