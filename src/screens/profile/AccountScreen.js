import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { getProfile, updateProfile } from "../../api/userApi";
import Toast from "react-native-toast-message";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({
    fullName: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    address: "",
  });

  const [originalData, setOriginalData] = useState({
    fullName: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    address: "",
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempFullName, setTempFullName] = useState("");

  const formatDateToVN = (dateString) => {
    if (!dateString) return "";
    if (dateString.includes("/")) return dateString;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDateToISO = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
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
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);

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
          address: userInfo.address || "",
        };

        setUserData(profileData);
        setOriginalData(JSON.parse(JSON.stringify(profileData)));
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Không thể tải thông tin cá nhân.",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(userData) !== JSON.stringify(originalData);
  };

  const handleSave = async () => {
    if (!userData.fullName.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập họ và tên.",
      });
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (userData.phoneNumber && !phoneRegex.test(userData.phoneNumber)) {
      Toast.show({
        type: "error",
        text1: "Số điện thoại không hợp lệ",
        text2: "Vui lòng nhập đúng 10 chữ số.",
      });
      return;
    }

    if (userData.dob && !isValidDate(userData.dob)) {
      Toast.show({
        type: "error",
        text1: "Ngày sinh không hợp lệ",
        text2: "Vui lòng nhập đúng định dạng DD/MM/YYYY.",
      });
      return;
    }

    try {
      setLoading(true);

      let dobToSend = undefined;
      if (userData.dob && isValidDate(userData.dob)) {
        dobToSend = formatDateToISO(userData.dob);
      }

      const dataToSend = {
        fullName: userData.fullName.trim(),
        phoneNumber: userData.phoneNumber ? userData.phoneNumber.trim() : "",
        gender: userData.gender || "",
        address: userData.address ? userData.address.trim() : "",
      };

      if (dobToSend) {
        dataToSend.dob = dobToSend;
      }

      await updateProfile(dataToSend);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Cập nhật hồ sơ thành công!",
      });

      setOriginalData({ ...userData });
    } catch (error) {
      const message =
        error.response?.data?.message || "Cập nhật thất bại, vui lòng thử lại.";
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: message,
      });
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
          Toast.show({
            type: "success",
            text1: "Đăng xuất",
            text2: "Hẹn gặp lại bạn!",
          });
          setTimeout(() => {
            navigation.navigate("Login");
          }, 500);
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const headerPaddingTop =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 50;

  if (!user) {
    return (
      <View style={styles.container}>
        <View
          style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}
        >
          <Text style={styles.headerTitle}>Tài Khoản</Text>
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="person-circle-outline" size={80} color="#cbd5e1" />
          <Text style={styles.noUserText}>
            Vui lòng đăng nhập để xem thông tin
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.primaryBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ Sơ Của Tôi</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={["#2dd4bf", "#0ea5e9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
                      {userData.fullName || "Chưa đặt tên"}
                    </Text>
                    <TouchableOpacity
                      style={styles.editIconBtn}
                      onPress={() => {
                        setTempFullName(userData.fullName);
                        setIsEditingName(true);
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#64748b"
                      />
                    </TouchableOpacity>
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
                      style={styles.actionBtn}
                      onPress={() => {
                        setUserData((prev) => ({
                          ...prev,
                          fullName: tempFullName,
                        }));
                        setIsEditingName(false);
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color="#10b981"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setTempFullName(userData.fullName);
                        setIsEditingName(false);
                      }}
                    >
                      <Ionicons name="close-circle" size={28} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.emailRow}>
                  <Ionicons name="mail-outline" size={14} color="#64748b" />
                  <Text style={styles.emailText}>
                    {user.email || user.user?.email}
                  </Text>
                </View>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Thành viên</Text>
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
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.saveTopBtnText}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>

            <View style={styles.formCard}>
              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập 10 chữ số"
                    value={userData.phoneNumber}
                    onChangeText={(text) =>
                      setUserData((prev) => ({
                        ...prev,
                        phoneNumber: text.replace(/[^0-9]/g, ""),
                      }))
                    }
                    keyboardType="number-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* DOB */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày sinh</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={20}
                    color="#94a3b8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      userData.dob &&
                        !isValidDate(userData.dob) &&
                        styles.inputError,
                    ]}
                    placeholder="DD/MM/YYYY"
                    value={userData.dob}
                    onChangeText={(text) => {
                      const formatted = formatDateInput(text);
                      setUserData((prev) => ({ ...prev, dob: formatted }));
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderRow}>
                  {["male", "female", "other"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.genderOption,
                        userData.gender === type && styles.genderOptionActive,
                      ]}
                      onPress={() =>
                        setUserData((prev) => ({ ...prev, gender: type }))
                      }
                    >
                      <Ionicons
                        name={
                          type === "male"
                            ? "male-outline"
                            : type === "female"
                            ? "female-outline"
                            : "help-circle-outline"
                        }
                        size={18}
                        color={userData.gender === type ? "#fff" : "#64748b"}
                      />
                      <Text
                        style={[
                          styles.genderLabel,
                          userData.gender === type && styles.genderLabelActive,
                        ]}
                      >
                        {type === "male"
                          ? "Nam"
                          : type === "female"
                          ? "Nữ"
                          : "Khác"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Address (TextArea) */}
              <View style={[styles.inputGroup, { borderBottomWidth: 0 }]}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color="#64748b"
                    style={styles.labelIcon}
                  />
                  <Text style={styles.label}>Địa chỉ</Text>
                </View>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Số nhà, tên đường, phường/xã..."
                    value={userData.address}
                    onChangeText={(text) =>
                      setUserData((prev) => ({ ...prev, address: text }))
                    }
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  headerContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginRight: 8,
  },
  editIconBtn: {
    padding: 4,
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
    color: "#1e293b",
    borderBottomWidth: 2,
    borderBottomColor: "#14b8a6",
    paddingVertical: 4,
  },
  actionBtn: {
    padding: 2,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: "#64748b",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  saveTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14b8a6",
    paddingVertical: 12,
    borderRadius: 10,
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

  formSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelIcon: {
    marginRight: 6,
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    height: "100%",
  },
  inputError: {
    color: "#ef4444",
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    gap: 6,
  },
  genderOptionActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  genderLabelActive: {
    color: "#fff",
    fontWeight: "600",
  },
  textAreaWrapper: {
    height: "auto",
    minHeight: 100,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    textAlignVertical: "top",
    height: "100%",
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noUserText: {
    fontSize: 16,
    color: "#64748b",
    marginVertical: 16,
  },
  primaryBtn: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
