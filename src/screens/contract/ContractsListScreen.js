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

      const items = res.items ?? res.data ?? res;
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

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item._id)}>
      <View style={styles.cardHeader}>
        <View style={styles.contractInfo}>
          <Ionicons name="document-text" size={20} color="#0d9488" />
          <Text style={styles.contractNumber}>
            {item.contract?.no
              ? `Mã hợp đồng: ${item.contract.no}`
              : `Mã hợp đồng: ${item._id?.slice(-8)}`}
          </Text>
        </View>
      </View>

      <View style={styles.propertyInfo}>
        <Ionicons name="business" size={16} color="#64748b" />
        <Text style={styles.propertyText}>
          Toà: {item.buildingId?.name || "Chưa có tên tòa nhà"}
        </Text>
      </View>

      <View style={styles.roomInfo}>
        <Ionicons name="home" size={16} color="#64748b" />
        <Text style={styles.roomText}>
          Phòng: {item.roomId?.roomNumber || "---"}
        </Text>
      </View>

      <View style={styles.dateContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Ngày bắt đầu:</Text>
          <Text style={styles.dateValue}>
            {item.contract?.startDate
              ? new Date(item.contract.startDate).toLocaleDateString("vi-VN")
              : "---"}
          </Text>
        </View>

        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Ngày kết thúc:</Text>
          <Text style={styles.dateValue}>
            {item.contract?.endDate
              ? new Date(item.contract.endDate).toLocaleDateString("vi-VN")
              : "---"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      {/* Header không có nút trở về */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách hợp đồng thuê trọ</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo mã hợp đồng / tòa / phòng..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
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

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color="#cbd5e1"
              />
              <Text style={styles.emptyTitle}>Chưa có hợp đồng nào</Text>
              <Text style={styles.emptySubtitle}>
                Bạn chưa có hợp đồng thuê nhà nào
              </Text>
            </View>
          }
        />
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },

  /* Header */
  header: {
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "650",
    color: "#0f172a",
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0f172a",
  },
  clearBtn: { paddingLeft: 8 },
  searchBtn: {
    marginLeft: 10,
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  /* List */
  listContainer: { padding: 16, paddingBottom: 120 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  contractInfo: { flexDirection: "row", alignItems: "center" },
  contractNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginLeft: 8,
  },
  propertyInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  propertyText: {
    color: "#374151",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  roomInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  roomText: { color: "#64748b", fontSize: 14, marginLeft: 8 },

  dateContainer: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
  },
  dateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateLabel: { color: "#64748b", fontSize: 13 },
  dateValue: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600",
  },

  /* States */
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b" },

  empty: { marginTop: 60, alignItems: "center", paddingHorizontal: 20 },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});

export default ContractsListScreen;
