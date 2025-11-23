import React from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const ExtendModal = ({
  visible,
  onClose,
  onSubmit,
  selectedContract,
  months,
  setMonths,
  note,
  setNote,
  loading,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
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
                Kết thúc:{" "}
                {selectedContract.contract?.endDate
                  ? new Date(
                      selectedContract.contract.endDate
                    ).toLocaleDateString("vi-VN")
                  : "--/--/----"}
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Số tháng gia hạn *</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Ví dụ: 12"
            keyboardType="numeric"
            value={months}
            onChangeText={setMonths}
          />

          <Text style={styles.inputLabel}>Ghi chú (không bắt buộc)</Text>
          <TextInput
            style={[styles.modalInput, { height: 80 }]}
            placeholder="Lý do gia hạn..."
            multiline
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              onPress={onClose}
              disabled={loading}
            >
              <Text>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtnPrimary,
                (!months || loading) && styles.modalBtnDisabled,
              ]}
              onPress={onSubmit}
              disabled={!months || loading}
            >
              <Text style={{ color: "#fff" }}>
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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

export default ExtendModal;
