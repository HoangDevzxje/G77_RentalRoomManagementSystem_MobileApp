import React from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../utils/roomHelpers";

const RoomSelectorModal = ({
  visible,
  rooms,
  selectedRoomId,
  onSelectRoom,
  onClose,
}) => {
  const renderContractInfo = (item) => {
    const contractData = item.contract || {};
    const startDate = contractData.startDate
      ? formatDate(contractData.startDate)
      : item.formattedStartDate || "";
    const endDate = contractData.endDate
      ? formatDate(contractData.endDate)
      : item.formattedEndDate || "";
    const contractNo = contractData.contractNo || contractData.no || "";

    return (
      <View style={styles.contractInfoContainer}>
        {contractNo ? (
          <Text style={styles.contractNoText}>Số HĐ: {contractNo}</Text>
        ) : null}

        {startDate && endDate ? (
          <View style={styles.contractDateRow}>
            <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
            <Text style={styles.contractDateText}>
              {startDate} - {endDate}
            </Text>
          </View>
        ) : null}

        {item.contractCount > 1 && (
          <View style={styles.multipleContractsBadge}>
            <Ionicons name="list-outline" size={10} color="#64748b" />
            <Text style={styles.multipleContractsText}>
              +{item.contractCount - 1} hợp đồng khác
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderRoomItem = ({ item }) => {
    const roomId = item.roomId || item._id;
    const isSelected = selectedRoomId === roomId;

    return (
      <TouchableOpacity
        style={[styles.roomOption, isSelected && styles.roomOptionSelected]}
        onPress={() => onSelectRoom(roomId)}
      >
        <View style={styles.roomOptionLeft}>
          <View style={styles.roomOptionIcon}>
            <Ionicons
              name={item.status === "active" ? "home" : "home-outline"}
              size={20}
              color={item.status === "active" ? "#10B981" : "#F59E0B"}
            />
          </View>
          <View style={styles.roomOptionInfo}>
            <Text style={styles.roomOptionName}>Phòng {item.roomNumber}</Text>
            <Text style={styles.roomOptionBuilding}>
              {item.buildingName || "Tòa nhà"}
            </Text>
            {renderContractInfo(item)}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Chọn phòng của bạn</Text>
              <Text style={styles.modalSubtitle}>
                Bạn có {rooms.length} phòng
              </Text>
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {rooms.length === 0 ? (
            <View style={styles.emptyModal}>
              <Ionicons name="home-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyModalText}>Không có phòng để chọn</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={rooms}
                keyExtractor={(item, index) =>
                  item.roomId || item._id || `room-${index}`
                }
                renderItem={renderRoomItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.modalListContent}
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={onClose}
                >
                  <Text style={styles.modalActionButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  emptyModal: {
    alignItems: "center",
    padding: 60,
  },
  emptyModalText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 12,
  },
  roomOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  roomOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  roomOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  roomOptionInfo: {
    flex: 1,
  },
  roomOptionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  roomOptionBuilding: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  roomOptionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  roomOptionSelected: {
    backgroundColor: "#f0fdfa",
  },
  contractInfoContainer: {
    marginTop: 4,
  },
  contractNoText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 4,
  },
  contractDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contractDateText: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: 4,
  },
  multipleContractsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  multipleContractsText: {
    fontSize: 10,
    color: "#64748b",
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  checkIcon: {
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
  },
  modalListContent: {
    paddingBottom: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  modalActionButton: {
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RoomSelectorModal;
