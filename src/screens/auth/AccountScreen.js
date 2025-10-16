import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { getProfile, updateProfile } from "../../api/userApi";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    address: [],
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    address: "",
    provinceName: "",
    districtName: "",
    wardName: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();

      if (data.user) {
        const userInfo = data.user.userInfo || {};
        let formattedDob = "";
        if (userInfo.dob) {
          const date = new Date(userInfo.dob);
          if (!isNaN(date.getTime())) {
            formattedDob = date.toLocaleDateString("vi-VN");
          }
        }

        setUserData({
          fullName: userInfo.fullName || "",
          phoneNumber: userInfo.phoneNumber || "",
          dob: formattedDob,
          gender: userInfo.gender || "",
          address: userInfo.address || [],
        });
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải thông tin profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userData.fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    try {
      setLoading(true);

      let formattedDob = userData.dob;
      if (userData.dob) {
        const parts = userData.dob.split("/");
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          formattedDob = `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}`;
        }
      }

      const dataToSend = {
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        dob: formattedDob || undefined,
        gender: userData.gender || undefined,
        address: userData.address,
      };

      await updateProfile(dataToSend);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
      await loadProfile();
    } catch (error) {
      console.log("Save error:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

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
          const newAddresses = userData.address.filter((_, i) => i !== index);
          setUserData((prev) => ({ ...prev, address: newAddresses }));
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
      const updatedAddresses = [...userData.address];
      updatedAddresses[editingAddress.index] = newAddress;
      setUserData((prev) => ({ ...prev, address: updatedAddresses }));
    } else {
      setUserData((prev) => ({
        ...prev,
        address: [...prev.address, newAddress],
      }));
    }

    setShowAddressModal(false);
    setEditingAddress(null);
    setNewAddress({
      address: "",
      provinceName: "",
      districtName: "",
      wardName: "",
    });
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await logout();
          navigation.navigate("Login");
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài Khoản</Text>
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color="#ccc" />
          <Text style={styles.noUserText}>
            Vui lòng đăng nhập để xem thông tin
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài Khoản</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.userName}>
            {userData.fullName || "Chưa cập nhật tên"}
          </Text>
          <Text style={styles.userEmail}>{user.email || user.user?.email}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Thông Tin Cá Nhân</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              value={userData.fullName}
              onChangeText={(text) =>
                setUserData((prev) => ({ ...prev, fullName: text }))
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              value={userData.phoneNumber}
              onChangeText={(text) =>
                setUserData((prev) => ({ ...prev, phoneNumber: text }))
              }
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={userData.dob}
              onChangeText={(text) =>
                setUserData((prev) => ({ ...prev, dob: text }))
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  userData.gender === "male" && styles.genderBtnActive,
                ]}
                onPress={() =>
                  setUserData((prev) => ({ ...prev, gender: "male" }))
                }
              >
                <Text
                  style={[
                    styles.genderText,
                    userData.gender === "male" && styles.genderTextActive,
                  ]}
                >
                  Nam
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  userData.gender === "female" && styles.genderBtnActive,
                ]}
                onPress={() =>
                  setUserData((prev) => ({ ...prev, gender: "female" }))
                }
              >
                <Text
                  style={[
                    styles.genderText,
                    userData.gender === "female" && styles.genderTextActive,
                  ]}
                >
                  Nữ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  userData.gender === "other" && styles.genderBtnActive,
                ]}
                onPress={() =>
                  setUserData((prev) => ({ ...prev, gender: "other" }))
                }
              >
                <Text
                  style={[
                    styles.genderText,
                    userData.gender === "other" && styles.genderTextActive,
                  ]}
                >
                  Khác
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.addressHeader}>
              <Text style={styles.label}>
                Địa chỉ ({userData.address.length})
              </Text>
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={handleAddAddress}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addAddressText}>Thêm</Text>
              </TouchableOpacity>
            </View>

            {userData.address.length > 0 ? (
              userData.address.map((address, index) => (
                <View key={index} style={styles.addressItem}>
                  <View style={styles.addressContent}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#14b8a6"
                    />
                    <View style={styles.addressText}>
                      <Text style={styles.addressMain}>{address.address}</Text>
                      <Text style={styles.addressDetail}>
                        {address.wardName}, {address.districtName},{" "}
                        {address.provinceName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.addressActionBtn}
                      onPress={() => handleEditAddress(address, index)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={14}
                        color="#14b8a6"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addressActionBtn}
                      onPress={() => handleDeleteAddress(index)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noAddress}>
                <Ionicons name="location-outline" size={24} color="#ccc" />
                <Text style={styles.noAddressText}>Chưa có địa chỉ nào</Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Lưu thông tin</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal thêm/sửa địa chỉ */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={styles.modalInput}
                placeholder="Địa chỉ chi tiết (số nhà, đường...)"
                value={newAddress.address}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, address: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Tỉnh/Thành phố"
                value={newAddress.provinceName}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, provinceName: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Quận/Huyện"
                value={newAddress.districtName}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, districtName: text }))
                }
              />

              <TextInput
                style={styles.modalInput}
                placeholder="Phường/Xã"
                value={newAddress.wardName}
                onChangeText={(text) =>
                  setNewAddress((prev) => ({ ...prev, wardName: text }))
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
                <Text style={styles.saveButtonText}>
                  {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noUserText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
    marginBottom: 20,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  profileHeader: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  form: {
    backgroundColor: "#fff",
    marginTop: 8,
    padding: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
    color: "#1e293b",
  },
  noteText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    fontStyle: "italic",
  },
  genderContainer: {
    flexDirection: "row",
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  genderBtnActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  genderTextActive: {
    color: "#fff",
  },
  // Address Styles
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14b8a6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addAddressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 8,
  },
  addressText: {
    flex: 1,
  },
  addressMain: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  addressDetail: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  addressActionBtn: {
    padding: 4,
  },
  noAddress: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  noAddressText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: "#14b8a6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
  saveModalButton: {
    backgroundColor: "#14b8a6",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
