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
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { getProfile, updateProfile } from "../../api/userApi";
import AddressManager from "../../components/address/AddressManager";

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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempFullName, setTempFullName] = useState("");

  const formatDateToVN = (dateString) => {
    if (!dateString) return "";
    if (dateString.includes("/")) return dateString;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDateToISO = (dateString) => {
    if (!dateString) return "";

    const parts = dateString.split("/");
    if (parts.length !== 3) return dateString;

    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];

    return `${year}-${month}-${day}`;
  };

  const isValidDate = (dateString) => {
    if (!dateString) return true;

    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!regex.test(dateString)) return false;

    const parts = dateString.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const formatDateInput = (text) => {
    let cleaned = text.replace(/[^0-9]/g, "");

    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }

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

      setOriginalData(JSON.parse(JSON.stringify(userData)));
    } catch (error) {
      console.log("Save error:", error);
      Alert.alert("Lỗi", error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
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

  const handleAddressUpdate = (updatedAddresses) => {
    setUserData((prev) => ({ ...prev, address: updatedAddresses }));
  };

  const headerPaddingTop =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 50;

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.simpleHeader, { paddingTop: headerPaddingTop }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tài Khoản</Text>
          </View>
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color="#14b8a6" />
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
      <View style={[styles.simpleHeader, { paddingTop: headerPaddingTop }]}>
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {getInitials(userData.fullName)}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              {!isEditingName ? (
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>
                    {userData.fullName || "Chưa cập nhật"}
                  </Text>
                  <TouchableOpacity
                    style={styles.editIconBtn}
                    onPress={() => {
                      setTempFullName(userData.fullName);
                      setIsEditingName(true);
                    }}
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
                    autoFocus={true}
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
                <View style={styles.saveButtonContent}>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveTopBtnText}>Lưu thay đổi</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.twoColumnContainer}>
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color="#14b8a6" />
              <Text style={styles.cardTitle}>Thông Tin Cá Nhân</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.fieldGroup}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="call" size={20} color="#14b8a6" />
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
                  <Ionicons name="calendar" size={20} color="#14b8a6" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Ngày sinh (DD/MM/YYYY)</Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      userData.dob &&
                        !isValidDate(userData.dob) &&
                        styles.errorInput,
                    ]}
                    placeholder="01/01/2000"
                    value={userData.dob}
                    onChangeText={(text) => {
                      const formatted = formatDateInput(text);
                      setUserData((prev) => ({ ...prev, dob: formatted }));
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  {userData.dob && !isValidDate(userData.dob) && (
                    <Text style={styles.errorText}>Định dạng không hợp lệ</Text>
                  )}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.fieldIcon}>
                  <Ionicons name="people" size={20} color="#14b8a6" />
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

          <AddressManager
            addresses={userData.address}
            onAddressUpdate={handleAddressUpdate}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  simpleHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
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
  scrollContent: {
    paddingTop: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 400,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: "400",
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  checkBtn: {
    backgroundColor: "#14b8a6",
    padding: 8,
    borderRadius: 8,
  },
  closeBtn: {
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 8,
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
    backgroundColor: "#14b8a6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveTopBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  twoColumnContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
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
    fontWeight: "500",
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
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  genderText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  genderTextActive: {
    color: "#fff",
  },
});
