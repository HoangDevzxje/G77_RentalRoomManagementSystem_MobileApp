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
  const [originalData, setOriginalData] = useState({
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
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempFullName, setTempFullName] = useState("");

  // Hàm chuyển đổi từ yyyy-mm-dd sang dd/mm/yyyy
  const formatDateToVN = (dateString) => {
    if (!dateString) return "";

    // Nếu đã là định dạng dd/mm/yyyy thì giữ nguyên
    if (dateString.includes("/")) return dateString;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Hàm chuyển đổi từ dd/mm/yyyy sang yyyy-mm-dd
  const formatDateToISO = (dateString) => {
    if (!dateString) return "";

    const parts = dateString.split("/");
    if (parts.length !== 3) return dateString;

    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];

    return `${year}-${month}-${day}`;
  };

  // Hàm validate định dạng dd/mm/yyyy
  const isValidDate = (dateString) => {
    if (!dateString) return true; // Cho phép trống

    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!regex.test(dateString)) return false;

    const parts = dateString.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Kiểm tra ngày tháng cụ thể
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  // Hàm tự động định dạng khi nhập
  const formatDateInput = (text) => {
    // Xóa tất cả ký tự không phải số
    let cleaned = text.replace(/[^0-9]/g, "");

    // Giới hạn độ dài
    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }

    // Tự động thêm dấu /
    if (cleaned.length > 4) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(
        2,
        4
      )}/${cleaned.substring(4)}`;
    } else if (cleaned.length > 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }

    return cleaned;
  };

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
          // Sử dụng hàm formatDateToVN để chuyển đổi sang dd/mm/yyyy
          formattedDob = formatDateToVN(userInfo.dob);
        }

        const profileData = {
          fullName: userInfo.fullName || "",
          phoneNumber: userInfo.phoneNumber || "",
          dob: formattedDob,
          gender: userInfo.gender || "",
          address: userInfo.address || [],
        };

        setUserData(profileData);
        setOriginalData(JSON.parse(JSON.stringify(profileData)));
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải thông tin profile");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(userData) !== JSON.stringify(originalData);
  };

  const handleSave = async () => {
    if (!userData.fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
      return;
    }

    if (userData.dob && !isValidDate(userData.dob)) {
      Alert.alert(
        "Lỗi",
        "Định dạng ngày sinh không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY"
      );
      return;
    }

    try {
      setLoading(true);

      // Chuyển đổi ngày sinh từ dd/mm/yyyy sang yyyy-mm-dd để gửi lên server
      const dobToSend = userData.dob
        ? formatDateToISO(userData.dob)
        : undefined;

      const dataToSend = {
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        dob: dobToSend,
        gender: userData.gender || undefined,
        address: userData.address,
      };

      await updateProfile(dataToSend);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");

      // Cập nhật originalData với dữ liệu mới (giữ nguyên định dạng dd/mm/yyyy)
      setOriginalData(JSON.parse(JSON.stringify(userData)));
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
      const updatedAddresses = [...userData.address];
      updatedAddresses[editingAddress.index] = newAddress;
      setUserData((prev) => ({ ...prev, address: updatedAddresses }));
    } else {
      setUserData((prev) => ({
        ...prev,
        address: [...prev.address, newAddress],
      }));
      setSelectedAddressIndex(userData.address.length);
    }

    setShowAddressModal(false);
    setEditingAddress(null);
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

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const selectedAddress = userData.address[selectedAddressIndex];

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
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(userData.fullName)}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              {!isEditingName ? (
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>
                    {userData.fullName || "Chưa cập nhật"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setTempFullName(userData.fullName);
                      setIsEditingName(true);
                    }}
                    style={styles.editIconBtn}
                  >
                    <Ionicons name="pencil" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <View style={styles.badge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color="#10b981"
                    />
                    <Text style={styles.badgeText}>Đã kích hoạt</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={tempFullName}
                    onChangeText={setTempFullName}
                    placeholder="Nhập họ và tên"
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={() => {
                      setUserData((prev) => ({
                        ...prev,
                        fullName: tempFullName,
                      }));
                      setIsEditingName(false);
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => {
                      setTempFullName(userData.fullName);
                      setIsEditingName(false);
                    }}
                  >
                    <Ionicons name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.infoRow}>
                <Ionicons name="mail" size={14} color="#64748b" />
                <Text style={styles.infoText}>
                  {user.email || user.user?.email}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person" size={14} color="#64748b" />
                <Text style={styles.infoText}>User</Text>
              </View>
            </View>
          </View>

          {hasChanges() && (
            <TouchableOpacity
              style={[styles.saveTopBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveTopBtnText}>Lưu thay đổi</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Two Column Layout */}
        <View style={styles.twoColumnContainer}>
          {/* Personal Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color="#3b82f6" />
              <Text style={styles.cardTitle}>Thông Tin Cá Nhân</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="call" size={20} color="#94a3b8" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Số điện thoại</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Nhập số điện thoại"
                    value={userData.phoneNumber}
                    onChangeText={(text) =>
                      setUserData((prev) => ({ ...prev, phoneNumber: text }))
                    }
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="calendar" size={20} color="#94a3b8" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Ngày sinh</Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      userData.dob &&
                        !isValidDate(userData.dob) &&
                        styles.errorInput,
                    ]}
                    placeholder="DD/MM/YYYY"
                    value={userData.dob}
                    onChangeText={(text) => {
                      const formattedText = formatDateInput(text);
                      setUserData((prev) => ({ ...prev, dob: formattedText }));
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  {userData.dob && !isValidDate(userData.dob) && (
                    <Text style={styles.errorText}>
                      Định dạng ngày không hợp lệ
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="person" size={20} color="#94a3b8" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Giới tính</Text>
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
                          userData.gender === "female" &&
                            styles.genderTextActive,
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
                          userData.gender === "other" &&
                            styles.genderTextActive,
                        ]}
                      >
                        Khác
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Address Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={20} color="#3b82f6" />
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
              {userData.address.length > 0 ? (
                <>
                  <View style={styles.addressSelectContainer}>
                    <Text style={styles.fieldLabel}>Chọn địa chỉ hiển thị</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {userData.address.map((addr, index) => (
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
                        <Ionicons name="location" size={16} color="#3b82f6" />
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
                            handleEditAddress(
                              selectedAddress,
                              selectedAddressIndex
                            )
                          }
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={16}
                            color="#3b82f6"
                          />
                          <Text style={styles.addressActionTextEdit}>Sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.addressActionBtnLarge}
                          onPress={() =>
                            handleDeleteAddress(selectedAddressIndex)
                          }
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#ef4444"
                          />
                          <Text style={styles.addressActionTextDelete}>
                            Xóa
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noAddressLarge}>
                  <Ionicons name="location-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.noAddressTextLarge}>
                    Chưa có địa chỉ nào
                  </Text>
                </View>
              )}
            </View>
          </View>
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
    backgroundColor: "#f1f5f9",
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
  profileCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 4,
    borderColor: "#dbeafe",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginRight: 8,
  },
  editIconBtn: {
    padding: 4,
    marginRight: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "600",
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  checkBtn: {
    backgroundColor: "#10b981",
    padding: 6,
    borderRadius: 6,
  },
  closeBtn: {
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#64748b",
  },
  saveTopBtn: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveTopBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  twoColumnContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 8,
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
    backgroundColor: "#3b82f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addAddressBtnSmallText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  cardContent: {
    padding: 16,
  },
  fieldGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  fieldIcon: {
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 15,
    color: "#1e293b",
  },
  errorInput: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: "row",
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  genderBtnActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  genderText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  genderTextActive: {
    color: "#fff",
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
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  addressChipText: {
    fontSize: 13,
    color: "#64748b",
    maxWidth: 120,
  },
  addressChipTextActive: {
    color: "#3b82f6",
    fontWeight: "500",
  },
  selectedAddressCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
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
    borderTopColor: "#bfdbfe",
  },
  addressActionBtnLarge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  addressActionTextEdit: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3b82f6",
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
    backgroundColor: "#3b82f6",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
