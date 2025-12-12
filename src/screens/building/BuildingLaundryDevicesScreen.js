import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { getBuildingLaundryDevices } from "../../api/buildingApi";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#2563EB",
  background: "#FFFFFF",
  card: "#FFFFFF",
  textMain: "#1F2937",
  textSub: "#6B7280",
  border: "#E5E7EB",
  chipBg: "#F3F4F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
};

const THEME_COLORS = {
  total: { bg: "#F3F4F6", text: "#374151", icon: "#4B5563" },
  running: { bg: "#FFF7ED", text: "#C2410C", icon: "#EA580C" },
  idle: { bg: "#F0FDF4", text: "#15803D", icon: "#16A34A" },
  unknown: { bg: "#F3F4F6", text: "#6B7280", icon: "#9CA3AF" },
  washer: { bg: "#EFF6FF", text: "#1D4ED8", icon: "#2563EB" },
  dryer: { bg: "#FAF5FF", text: "#7E22CE", icon: "#9333EA" },
};

export default function BuildingLaundryDevicesScreen({ route, navigation }) {
  const { buildingId, buildingName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    idle: 0,
    unknown: 0,
  });

  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const availableFloors = useMemo(() => {
    const levels = new Set(devices.map((d) => d.floorLevel));
    return Array.from(levels).sort((a, b) => a - b);
  }, [devices]);

  const fetchData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const devicesRes = await getBuildingLaundryDevices(buildingId, {});
      const data = devicesRes.data || [];
      setDevices(data);
      applyClientSideFilter(data, selectedFloor, selectedType, selectedStatus);
    } catch (error) {
      console.error("Error fetching data:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: error.response?.data?.message || "Không thể tải dữ liệu",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyClientSideFilter = (sourceData, floor, type, status) => {
    let result = sourceData;
    if (floor !== "all") result = result.filter((d) => d.floorLevel === floor);
    if (type !== "all") result = result.filter((d) => d.type === type);
    if (status !== "all") {
      if (status === "unknown") {
        result = result.filter(
          (d) => d.status !== "running" && d.status !== "idle"
        );
      } else {
        result = result.filter((d) => d.status === status);
      }
    }

    setFilteredDevices(result);
    calculateStats(sourceData);
  };

  const calculateStats = (deviceList) => {
    const runningCount = deviceList.filter(
      (d) => d.status === "running"
    ).length;
    const idleCount = deviceList.filter((d) => d.status === "idle").length;
    const unknownCount = deviceList.length - runningCount - idleCount;

    setStats({
      total: deviceList.length,
      running: runningCount,
      idle: idleCount,
      unknown: unknownCount,
    });
  };

  useEffect(() => {
    if (buildingId) fetchData();
  }, [buildingId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleApplyFilter = () => {
    applyClientSideFilter(devices, selectedFloor, selectedType, selectedStatus);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setSelectedFloor("all");
    setSelectedType("all");
    setSelectedStatus("all");
    applyClientSideFilter(devices, "all", "all", "all");
    setShowFilterModal(false);
  };

  useEffect(() => {
    applyClientSideFilter(devices, selectedFloor, selectedType, selectedStatus);
  }, [selectedFloor, selectedType, selectedStatus, devices]);

  const getStatusTheme = (status) => {
    switch (status) {
      case "running":
        return THEME_COLORS.running;
      case "idle":
        return THEME_COLORS.idle;
      default:
        return THEME_COLORS.unknown;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "running":
        return "Đang chạy";
      case "idle":
        return "Rảnh";
      default:
        return "Không xác định";
    }
  };

  const getDeviceIconName = (type) => {
    if (type === "washer") {
      return "washing-machine";
    } else {
      return "tumble-dryer";
    }
  };

  const getDeviceTypeColor = (type) =>
    type === "washer" ? THEME_COLORS.washer : THEME_COLORS.dryer;

  const formatPower = (power) => {
    if (power === null || power === undefined || power === "") {
      return "N/A";
    }
    const num = Number(power);
    if (isNaN(num)) {
      return "N/A";
    }

    return `${num.toFixed(1)}W`;
  };

  const getActiveFilterDescription = () => {
    const filters = [];
    if (selectedFloor !== "all") filters.push(`Tầng ${selectedFloor}`);
    if (selectedType !== "all")
      filters.push(selectedType === "washer" ? "Máy giặt" : "Máy sấy");
    if (selectedStatus !== "all") {
      const statusText =
        selectedStatus === "idle"
          ? "Rảnh"
          : selectedStatus === "running"
          ? "Đang chạy"
          : "Không xác định";
      filters.push(statusText);
    }
    return filters.length > 0 ? filters.join(" • ") : "Tất cả";
  };

  const renderQuickFilterBar = () => (
    <View style={styles.quickFilterBar}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilterModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="filter" size={18} color={COLORS.primary} />
        <Text style={styles.filterButtonText}>
          {getActiveFilterDescription()}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.textSub} />
      </TouchableOpacity>

      {(selectedFloor !== "all" ||
        selectedType !== "all" ||
        selectedStatus !== "all") && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={handleResetFilter}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDeviceItem = ({ item }) => {
    const statusTheme = getStatusTheme(item.status);
    const typeTheme = getDeviceTypeColor(item.type);

    return (
      <TouchableOpacity
        style={styles.deviceCard}
        activeOpacity={0.7}
        onPress={() =>
          Toast.show({
            type: "info",
            text1: item.name,
            text2: `Công suất: ${formatPower(
              item.power
            )} | Trạng thái: ${getStatusText(item.status)} | ID: ${
              item.tuyaDeviceId || "N/A"
            }`,
          })
        }
      >
        <View style={styles.cardContent}>
          {/* Phần trái: Icon và thông tin cơ bản */}
          <View style={styles.cardLeftSection}>
            <View
              style={[styles.deviceIcon, { backgroundColor: typeTheme.bg }]}
            >
              <MaterialCommunityIcons
                name={getDeviceIconName(item.type)}
                size={20}
                color={typeTheme.text}
              />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name}</Text>
              <View style={styles.deviceMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="business-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>Tầng {item.floorLevel}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flash-outline" size={12} color="#6B7280" />
                  <Text style={styles.metaText}>{formatPower(item.power)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Phần phải: Trạng thái */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}
          >
            <Ionicons
              name={
                item.status === "running"
                  ? "play-circle"
                  : item.status === "idle"
                  ? "checkmark-circle"
                  : "help-circle"
              }
              size={14}
              color={statusTheme.text}
            />
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Dòng mô tả và Device ID */}
        <View style={styles.bottomInfo}>
          {item.floorDescription && (
            <View style={styles.descriptionRow}>
              <Ionicons
                name="information-circle-outline"
                size={12}
                color="#9CA3AF"
              />
              <Text style={styles.floorDescription} numberOfLines={1}>
                {item.floorDescription}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bộ lọc</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Tầng */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Tầng</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.modalFilterOption,
                    selectedFloor === "all" && styles.modalFilterOptionActive,
                  ]}
                  onPress={() => setSelectedFloor("all")}
                >
                  <Ionicons
                    name="layers-outline"
                    size={18}
                    color={selectedFloor === "all" ? "#FFFFFF" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.modalFilterOptionText,
                      selectedFloor === "all" &&
                        styles.modalFilterOptionTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {availableFloors.map((floor) => (
                  <TouchableOpacity
                    key={floor}
                    style={[
                      styles.modalFilterOption,
                      selectedFloor === floor && styles.modalFilterOptionActive,
                    ]}
                    onPress={() => setSelectedFloor(floor)}
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={selectedFloor === floor ? "#FFFFFF" : "#4B5563"}
                    />
                    <Text
                      style={[
                        styles.modalFilterOptionText,
                        selectedFloor === floor &&
                          styles.modalFilterOptionTextActive,
                      ]}
                    >
                      Tầng {floor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Loại thiết bị */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Loại thiết bị</Text>
              <View style={styles.filterOptions}>
                {["all", "washer", "dryer"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalFilterOption,
                      selectedType === type && styles.modalFilterOptionActive,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    {type === "all" ? (
                      <Ionicons
                        name="grid-outline"
                        size={18}
                        color={selectedType === type ? "#FFFFFF" : "#6B7280"}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={
                          type === "washer" ? "washing-machine" : "tumble-dryer"
                        }
                        size={18}
                        color={
                          selectedType === type
                            ? "#FFFFFF"
                            : type === "washer"
                            ? "#2563EB"
                            : "#9333EA"
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.modalFilterOptionText,
                        selectedType === type &&
                          styles.modalFilterOptionTextActive,
                      ]}
                    >
                      {type === "all"
                        ? "Tất cả"
                        : type === "washer"
                        ? "Máy giặt"
                        : "Máy sấy"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Trạng thái */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Trạng thái</Text>
              <View style={styles.filterOptions}>
                {[
                  {
                    value: "all",
                    label: "Tất cả",
                    icon: "apps-outline",
                    color: "#6B7280",
                  },
                  {
                    value: "idle",
                    label: "Rảnh",
                    icon: "checkmark-circle-outline",
                    color: COLORS.success,
                  },
                  {
                    value: "running",
                    label: "Đang chạy",
                    icon: "play-circle-outline",
                    color: COLORS.warning,
                  },
                  {
                    value: "unknown",
                    label: "Không xác định",
                    icon: "help-circle-outline",
                    color: "#6B7280",
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalFilterOption,
                      selectedStatus === option.value &&
                        styles.modalFilterOptionActive,
                    ]}
                    onPress={() => setSelectedStatus(option.value)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={
                        selectedStatus === option.value
                          ? "#FFFFFF"
                          : option.color
                      }
                    />
                    <Text
                      style={[
                        styles.modalFilterOptionText,
                        selectedStatus === option.value &&
                          styles.modalFilterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButtonModal}
              onPress={handleResetFilter}
            >
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilter}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Thiết bị giặt sấy trọ: {buildingName}
            </Text>
            <Text style={styles.headerSubtitle}>
              Đang có {filteredDevices.length} thiết bị
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={styles.filterHeaderButton}
          >
            <Ionicons name="filter" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#E0F2FE" }]}>
              <Ionicons name="server-outline" size={20} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.statLabel}>Tổng thiết bị</Text>
              <Text style={styles.statNumber}>{stats.total}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#FFEDD5" }]}>
              <Ionicons name="play-circle-outline" size={20} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.statLabel}>Đang chạy</Text>
              <Text style={styles.statNumber}>{stats.running}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#16A34A"
              />
            </View>
            <View>
              <Text style={styles.statLabel}>Rảnh</Text>
              <Text style={styles.statNumber}>{stats.idle}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            </View>
            <View>
              <Text style={styles.statLabel}>Không xác định</Text>
              <Text style={styles.statNumber}>{stats.unknown}</Text>
            </View>
          </View>
        </View>

        {renderQuickFilterBar()}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải thiết bị...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.deviceId || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={COLORS.border}
                />
                <Text style={styles.emptyTitle}>Không tìm thấy thiết bị</Text>
                <Text style={styles.emptySubtitle}>
                  {getActiveFilterDescription()}
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={handleResetFilter}
                >
                  <Text style={styles.emptyButtonText}>Hiển thị tất cả</Text>
                </TouchableOpacity>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
              />
            }
          />
        )}

        {renderFilterModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  filterHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  statCard: {
    width: (width - 40) / 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  quickFilterBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
    marginHorizontal: 8,
  },
  clearFilterButton: {
    padding: 8,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSub,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textMain,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  deviceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 6,
  },
  deviceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bottomInfo: {
    marginTop: 8,
    gap: 4,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  floorDescription: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
    flex: 1,
  },
  deviceIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deviceIdText: {
    fontSize: 11,
    color: "#9CA3AF",
    flex: 1,
    fontFamily: "monospace",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textMain,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMain,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalFilterOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  modalFilterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalFilterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textMain,
    marginLeft: 8,
  },
  modalFilterOptionTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  resetButtonModal: {
    flex: 1,
    backgroundColor: COLORS.chipBg,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  applyButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
