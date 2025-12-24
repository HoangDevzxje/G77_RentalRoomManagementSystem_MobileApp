import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

import {
  getMyContracts,
  downloadContractPdf,
  requestExtend,
  requestTerminate,
} from "../../api/contractApi";
import SearchBar from "../../components/contracts/list/SearchBar";
import StatusFilterDropdown from "../../components/contracts/list/StatusFilterDropdown";
import ContractCard from "../../components/contracts/list/ContractCard";
import ExtendModal from "../../components/contracts/list/ExtendModal";
import TerminateModal from "../../components/contracts/list/TerminateModal";
import { getAccessToken } from "../../utils/storage";
import {
  computeDaysLeft,
  computeStatusFromDates,
} from "../../utils/contractHelpers";

const STATUS_BAR_HEIGHT = 0;
const { width } = Dimensions.get("window");

const statusOptions = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "sent_to_tenant", label: "Chờ ký" },
  { value: "signed_by_tenant", label: "Đã ký - Chờ chủ" },
  { value: "signed_by_landlord", label: "Đã ký - Chờ người thuê" },
  { value: "completed", label: "Hoàn thành" },
  { value: "voided", label: "Đã huỷ" },
  { value: "terminated", label: "Đã chấm dứt" },
];

const ContractsListScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
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

  const [terminateModalVisible, setTerminateModalVisible] = useState(false);
  const [terminateReason, setTerminateReason] = useState("");
  const [terminateNote, setTerminateNote] = useState("");
  const [terminateLoading, setTerminateLoading] = useState(false);

  const fetchContracts = async (opts = {}) => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!opts.isRefreshing) setLoading(true);
    try {
      const res = await getMyContracts({
        status: statusFilter || undefined,
        page,
        limit: 20,
        ...(opts.keyword ? { keyword: opts.keyword } : {}),
      });
      const items = res.items || res.data || res || [];
      const validItems = (Array.isArray(items) ? items : []).filter(
        (c) => c.status !== "draft"
      );
      const prepared = validItems.map((c) => ({
        ...c,
        __daysLeft: computeDaysLeft(c.contract?.endDate),
        __statusFromDates: computeStatusFromDates(c),
      }));
      setContracts(prepared);
    } catch (e) {
      if (e?.response?.status !== 401) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2:
            e?.response?.data?.message ||
            e?.message ||
            "Không thể tải hợp đồng",
          position: "top",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSubmittingSearch(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContracts();
    } else {
      setLoading(false);
    }
  }, [page, statusFilter, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchContracts();
      }
    }, [isAuthenticated, statusFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (isAuthenticated) {
      fetchContracts({ isRefreshing: true });
    } else {
      setRefreshing(false);
    }
  };

  const onSubmitSearch = () => {
    if (!isAuthenticated) return;
    const kw = searchQuery.trim();
    setSubmittingSearch(true);
    fetchContracts({ keyword: kw });
  };

  const clearSearch = () => {
    if (!isAuthenticated) return;
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

  const openTerminateModal = (contract) => {
    setSelectedContract(contract);
    setTerminateReason("");
    setTerminateNote("");
    setTerminateModalVisible(true);
  };

  const closeTerminateModal = () => {
    if (!terminateLoading) {
      setTerminateModalVisible(false);
      setSelectedContract(null);
    }
  };

  const submitTerminate = async () => {
    if (!selectedContract) return;
    if (!terminateReason.trim()) {
      Toast.show({ type: "error", text1: "Vui lòng nhập lý do chấm dứt" });
      return;
    }
    setTerminateLoading(true);
    try {
      await requestTerminate(
        selectedContract._id,
        terminateReason.trim(),
        terminateNote.trim()
      );
      Toast.show({ type: "success", text1: "Đã gửi yêu cầu chấm dứt" });
      setTerminateModalVisible(false);
      setSelectedContract(null);
      fetchContracts();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Gửi thất bại",
        text2: e?.response?.data?.message || e.message,
      });
    } finally {
      setTerminateLoading(false);
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
      if (!token) throw new Error("Missing auth token");

      const headResp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/pdf, */*",
        },
      });
      const ct = headResp.headers.get("content-type") || "";
      if (!headResp.ok) throw new Error(`Server error`);
      if (!ct.toLowerCase().includes("pdf"))
        throw new Error(`Invalid content type`);

      const fileName = `contract_${contract._id}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!downloadResult || !downloadResult.uri)
        throw new Error("Download error");

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
      Toast.show({ type: "error", text1: "Tải thất bại", text2: message });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
            <Ionicons name="log-in-outline" size={60} color="#0d9488" />
          </View>
          <Text style={styles.emptyTitle}>Chào mừng bạn</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng đăng nhập để xem và quản lý danh sách hợp đồng của bạn.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate("Login")}
          >
            <Ionicons
              name="log-in-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnPrimaryText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
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
            onExtend={openExtendModal}
            onTerminate={openTerminateModal}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0d9488"]}
            tintColor="#0d9488"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.illustrationCircle}>
              <Ionicons
                name="document-text-outline"
                size={60}
                color="#0d9488"
              />
            </View>
            <Text style={styles.emptyTitle}>Chưa có hợp đồng</Text>
            <Text style={styles.emptySubtitle}>
              Bạn chưa có hợp đồng nào. Hãy tìm phòng trọ ưng ý và tạo hợp đồng
              ngay!
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("PostList")}
              style={styles.btnPrimary}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.btnPrimaryText}>Tìm phòng ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onRefresh} style={styles.btnSecondary}>
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#64748b"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnSecondaryText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Gia hạn & Chấm dứt */}
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

      <TerminateModal
        visible={terminateModalVisible}
        onClose={closeTerminateModal}
        onSubmit={submitTerminate}
        reason={terminateReason}
        setReason={setTerminateReason}
        note={terminateNote}
        setNote={setTerminateNote}
        loading={terminateLoading}
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

  listContainer: { paddingBottom: 32, flexGrow: 1 },

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
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
    width: "100%",
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 24,
  },
  btnPrimary: {
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 16,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  btnSecondaryText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ContractsListScreen;
