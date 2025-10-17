import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const AddressManager = ({ addresses, onAddressUpdate }) => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    address: "",
    provinceName: "",
    districtName: "",
    wardName: "",
  });
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setNewAddress({
      address: "",
      provinceName: "",
      districtName: "",
      wardName: "",
    });
    setShowAddressModal(true);
  };

  const handleEditAddress = (address, index) => {
    setEditingAddress({ ...address, index });
    setNewAddress({
      address: address.address || "",
      provinceName: address.provinceName || "",
      districtName: address.districtName || "",
      wardName: address.wardName || "",
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (index) => {
    Alert.alert("Xóa địa chỉ", "Bạn có chắc chắn muốn xóa địa chỉ này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          const newAddresses = addresses.filter((_, i) => i !== index);
          onAddressUpdate(newAddresses);
          if (selectedAddressIndex >= newAddresses.length) {
            setSelectedAddressIndex(Math.max(0, newAddresses.length - 1));
          }
        },
      },
    ]);
  };

  const saveAddress = () => {
    if (
      !newAddress.address.trim() ||
      !newAddress.provinceName.trim() ||
      !newAddress.districtName.trim() ||
      !newAddress.wardName.trim()
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin địa chỉ");
      return;
    }

    if (editingAddress) {
      const updatedAddresses = [...addresses];
      updatedAddresses[editingAddress.index] = newAddress;
      onAddressUpdate(updatedAddresses);
    } else {
      onAddressUpdate([...addresses, newAddress]);
      setSelectedAddressIndex(addresses.length);
    }

    setShowAddressModal(false);
    setEditingAddress(null);
  };

  const selectedAddress = addresses[selectedAddressIndex];

  return (
    <>
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={20} color="#14b8a6" />
          <Text style={styles.cardTitle}>Địa Chỉ</Text>
          <TouchableOpacity
            style={styles.addAddressBtnSmall}
            onPress={handleAddAddress}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addAddressBtnSmallText}>Thêm mới</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          {addresses.length > 0 ? (
            <>
              <View style={styles.addressSelectContainer}>
                <Text style={styles.fieldLabel}>Chọn địa chỉ hiển thị</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {addresses.map((addr, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.addressChip,
                        selectedAddressIndex === index &&
                          styles.addressChipActive,
                      ]}
                      onPress={() => setSelectedAddressIndex(index)}
                    >
                      <Text
                        style={[
                          styles.addressChipText,
                          selectedAddressIndex === index &&
                            styles.addressChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {addr.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {selectedAddress && (
                <View style={styles.selectedAddressCard}>
                  <View style={styles.addressDetailRow}>
                    <Ionicons name="location" size={16} color="#14b8a6" />
                    <View style={styles.addressDetailText}>
                      <Text style={styles.addressDetailMain}>
                        {selectedAddress.address}
                      </Text>
                      <Text style={styles.addressDetailSub}>
                        {selectedAddress.wardName},{" "}
                        {selectedAddress.districtName}
                      </Text>
                      <Text style={styles.addressDetailSub}>
                        {selectedAddress.provinceName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.addressActionRow}>
                    <TouchableOpacity
                      style={styles.addressActionBtnLarge}
                      onPress={() =>
                        handleEditAddress(selectedAddress, selectedAddressIndex)
                      }
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={16}
                        color="#14b8a6"
                      />
                      <Text style={styles.addressActionTextEdit}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addressActionBtnLarge}
                      onPress={() => handleDeleteAddress(selectedAddressIndex)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#ef4444"
                      />
                      <Text style={styles.addressActionTextDelete}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noAddressLarge}>
              <Ionicons name="location-outline" size={48} color="#cbd5e1" />
              <Text style={styles.noAddressTextLarge}>Chưa có địa chỉ nào</Text>
            </View>
          )}
        </View>
      </View>

      {/* Modal thêm/sửa địa chỉ */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={styles.modalInput}
                placeholder="Địa chỉ chi tiết (số nhà, đường...)"
                placeholderTextColor="#94a3b8"
                value={newAddress.address}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, address: text }))
                }
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phường/Xã"
                placeholderTextColor="#94a3b8"
                value={newAddress.wardName}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, wardName: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Quận/Huyện"
                placeholderTextColor="#94a3b8"
                value={newAddress.districtName}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, districtName: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Tỉnh/Thành phố"
                placeholderTextColor="#94a3b8"
                value={newAddress.provinceName}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, provinceName: text }))
                }
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={saveAddress}
              >
                <LinearGradient
                  colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
                  style={styles.gradientButton}
                >
                  <Text style={styles.saveButtonText}>
                    {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  addAddressBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14b8a6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  addAddressBtnSmallText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  cardContent: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: "500",
  },
  addressSelectContainer: {
    marginBottom: 16,
  },
  addressChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addressChipActive: {
    backgroundColor: "#f0fdfa",
    borderColor: "#14b8a6",
  },
  addressChipText: {
    fontSize: 13,
    color: "#64748b",
    maxWidth: 120,
  },
  addressChipTextActive: {
    color: "#14b8a6",
    fontWeight: "500",
  },
  selectedAddressCard: {
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ccfbf1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  addressDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  addressDetailText: {
    flex: 1,
  },
  addressDetailMain: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  addressDetailSub: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  addressActionRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ccfbf1",
  },
  addressActionBtnLarge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  addressActionTextEdit: {
    fontSize: 13,
    fontWeight: "500",
    color: "#14b8a6",
  },
  addressActionTextDelete: {
    fontSize: 13,
    fontWeight: "500",
    color: "#ef4444",
  },
  noAddressLarge: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noAddressTextLarge: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 12,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 0,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 400,
    padding: 20,
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  cancelModalButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 12,
  },
  saveModalButton: {
    backgroundColor: "transparent",
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AddressManager;
