import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native"; // Thêm import này
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  getContractStatus,
  getStatusInfo,
  computeStatusFromDates,
  computeDaysLeft,
  getUrgencyLevel,
} from "../../../utils/contractHelpers";

const ContractCard = ({
  item,
  index,
  lastIndex,
  onOpenDetail,
  onDownload,
  downloading,
}) => {
  const navigation = useNavigation(); // Thêm hook navigation

  const statusObj = getContractStatus(item);
  const statusInfo = getStatusInfo(statusObj);
  const statusFromDates =
    item.__statusFromDates ?? computeStatusFromDates(item);
  const daysLeft = item.__daysLeft ?? computeDaysLeft(item.contract?.endDate);
  const urgency = getUrgencyLevel(daysLeft);
  const isDownloading = downloading === item._id;

  // Thêm hàm xử lý khi ấn vào phần thời gian
  const handleTimePress = () => {
    navigation.navigate("UpcomingContracts", {
      fromFilter: true,
      contracts: [item], // Truyền contract hiện tại
      focusedId: item._id,
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        index === 0 && styles.firstCard,
        index === lastIndex && styles.lastCard,
      ]}
      onPress={() => onOpenDetail(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.contractMainInfo}>
          <View style={styles.contractIcon}>
            <Ionicons name="document-text" size={22} color="#0d9488" />
          </View>
          <View style={styles.contractText}>
            <Text style={styles.contractNumber} numberOfLines={1}>
              {item.contract?.no
                ? `Số hợp đồng: ${item.contract.no}`
                : `Số HĐ: ${item._id?.slice(-8)}`}
            </Text>
            <Text style={styles.contractSubtitle} numberOfLines={1}>
              Hợp đồng thuê phòng
            </Text>
          </View>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
          />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.propertySection}>
        <View style={styles.propertyRow}>
          <View style={styles.propertyItem}>
            <Ionicons name="business" size={16} color="#64748b" />
            <Text style={styles.propertyValue} numberOfLines={1}>
              {item.buildingId?.name || "---"}
            </Text>
          </View>
        </View>
        <View style={[styles.propertyRow, { marginTop: 8 }]}>
          <View style={styles.propertyItem}>
            <Ionicons name="bed" size={16} color="#64748b" />
            <Text style={styles.propertyLabel}>Phòng</Text>
            <Text style={styles.propertyValue} numberOfLines={1}>
              {item.roomId?.roomNumber || "---"}
            </Text>
          </View>
        </View>
      </View>

      {/* Sửa onPress từ () => {} thành handleTimePress */}
      <TouchableOpacity
        style={[styles.dateSection, { borderColor: urgency.color }]}
        onPress={handleTimePress} // Đã sửa thành hàm mới
        activeOpacity={0.8}
      >
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={18} color="#0d9488" />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabelText}>Thời hạn hợp đồng</Text>
            {item.contract?.startDate && item.contract?.endDate ? (
              <Text style={styles.dateRange}>
                <Text style={styles.dateHighlight}>
                  {new Date(item.contract.startDate).toLocaleDateString(
                    "vi-VN"
                  )}
                </Text>
                {" → "}
                <Text style={styles.dateHighlight}>
                  {new Date(item.contract.endDate).toLocaleDateString("vi-VN")}
                </Text>
              </Text>
            ) : (
              <Text style={styles.dateRangeEmpty}>
                Chưa có thời hạn hợp đồng
              </Text>
            )}
            {daysLeft !== null && daysLeft > 0 && (
              <Text
                style={[styles.expiryTextSmall, { color: urgency.color }]}
              >{`${statusFromDates.text}`}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={urgency.color} />
        </View>
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => onOpenDetail(item._id)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye" size={16} color="#0d9488" />
          <Text style={styles.detailButtonText}>Chi tiết</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => onDownload(item)}
          disabled={isDownloading}
          activeOpacity={0.7}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <Ionicons name="download" size={16} color="#059669" />
          )}
          <Text style={styles.downloadButtonText}>
            {isDownloading ? "Đang tải..." : "Tải PDF"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  firstCard: { marginTop: 4 },
  lastCard: { marginBottom: 8 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  contractMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  contractIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contractText: { flex: 1 },
  contractNumber: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  contractSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 14 },
  propertySection: { marginBottom: 12 },
  propertyRow: { flexDirection: "row" },
  propertyItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  propertyLabel: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    marginRight: 6,
    fontWeight: "500",
  },
  propertyValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 1,
    marginLeft: 6,
  },
  dateSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateContainer: { flexDirection: "row", alignItems: "center" },
  dateTextContainer: { flex: 1, marginLeft: 10 },
  dateLabelText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 20,
  },
  dateRangeEmpty: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 20,
  },
  dateHighlight: { color: "#0f172a", fontWeight: "700" },
  expiryTextSmall: { marginTop: 6, fontSize: 13, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 6,
  },
  detailButtonText: { fontSize: 14, color: "#0d9488", fontWeight: "600" },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  downloadButtonText: { fontSize: 14, color: "#059669", fontWeight: "600" },
});

export default ContractCard;
