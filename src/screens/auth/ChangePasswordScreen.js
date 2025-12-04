import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { changePasswordApi } from "../../api/authApi";
import { getAccessToken } from "../../utils/storage";
import Toast from "react-native-toast-message";

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const navigation = useNavigation();

  useEffect(() => {
    if (confirmPassword && touched.confirmPassword) {
      const error = validateConfirmPassword(newPassword, confirmPassword);
      setErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  }, [newPassword]);

  const checkPasswordStrength = (password) => {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordStrength(strength);
    return Object.values(strength).every((item) => item === true);
  };

  const checkSamePassword = (oldPass, newPass) => {
    if (oldPass && newPass && oldPass === newPass) {
      return true;
    }
    return false;
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword.trim()) return "Vui lòng xác nhận mật khẩu";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp";
    return "";
  };

  const validateAll = () => {
    const newErrors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    let isValid = true;

    if (!oldPassword.trim()) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
      isValid = false;
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
      isValid = false;
    } else {
      if (checkSamePassword(oldPassword, newPassword)) {
        newErrors.newPassword = "Mật khẩu mới không được trùng với mật khẩu cũ";
        isValid = false;
      } else if (!checkPasswordStrength(newPassword)) {
        newErrors.newPassword = "Mật khẩu không đủ mạnh";
        isValid = false;
      }
    }

    const confirmError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmError) {
      newErrors.confirmPassword = confirmError;
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({
      oldPassword: true,
      newPassword: true,
      confirmPassword: true,
    });
    return isValid;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    checkPasswordStrength(text);

    if (text.trim()) {
      setErrors((prev) => ({ ...prev, newPassword: "" }));
    }

    if (oldPassword && text && oldPassword === text) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu mới không được trùng với mật khẩu cũ",
      }));
    } else if (
      errors.newPassword === "Mật khẩu mới không được trùng với mật khẩu cũ"
    ) {
      setErrors((prev) => ({ ...prev, newPassword: "" }));
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);

    if (text.trim()) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }

    const error = validateConfirmPassword(newPassword, text);
    if (error) {
      setErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleOldPasswordChange = (text) => {
    setOldPassword(text);
    if (text.trim()) {
      setErrors((prev) => ({ ...prev, oldPassword: "" }));
    }

    if (newPassword && text && newPassword === text) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu mới không được trùng với mật khẩu cũ",
      }));
    } else if (newPassword && text && newPassword !== text) {
      if (
        errors.newPassword === "Mật khẩu mới không được trùng với mật khẩu cũ"
      ) {
        setErrors((prev) => ({ ...prev, newPassword: "" }));
      }
    }
  };

  const handleChangePassword = async () => {
    const token = await getAccessToken();
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Bạn chưa đăng nhập hoặc token đã hết hạn.",
      });
      return;
    }

    if (!validateAll()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng kiểm tra lại thông tin!",
      });
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi(oldPassword, newPassword);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đổi mật khẩu thành công",
      });

      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        navigation.navigate("BottomTabs");
      }, 1500);
    } catch (error) {
      console.log("Error response:", error.response?.data);

      const errorMessage =
        error.response?.data?.message || "Đổi mật khẩu thất bại";

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getStrengthColor = () => {
    const score = getStrengthScore();
    if (score <= 2) return "#ef4444";
    if (score === 3) return "#f59e0b";
    if (score === 4) return "#3b82f6";
    return "#10b981";
  };

  const getStrengthText = () => {
    const score = getStrengthScore();
    if (score <= 2) return "Yếu";
    if (score === 3) return "Trung bình";
    if (score === 4) return "Mạnh";
    return "Rất mạnh";
  };

  const isSamePassword =
    oldPassword && newPassword && oldPassword === newPassword;

  const isPasswordMatch =
    confirmPassword && newPassword && newPassword === confirmPassword;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt tài khoản</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Card đổi mật khẩu */}
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#2563eb" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Đổi mật khẩu</Text>
                <Text style={styles.cardDescription}>
                  Để bảo mật tài khoản, hãy sử dụng mật khẩu mới khác với mật
                  khẩu cũ và đủ mạnh
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Mật khẩu hiện tại */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Mật khẩu hiện tại <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Nhập mật khẩu hiện tại"
                    value={oldPassword}
                    onChangeText={handleOldPasswordChange}
                    onBlur={() => handleBlur("oldPassword")}
                    secureTextEntry={!showOldPassword}
                    style={[
                      styles.input,
                      errors.oldPassword &&
                        touched.oldPassword &&
                        styles.inputError,
                    ]}
                    placeholderTextColor="#9ca3af"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowOldPassword(!showOldPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {errors.oldPassword && touched.oldPassword ? (
                  <Text style={styles.errorText}>{errors.oldPassword}</Text>
                ) : null}
              </View>

              {/* Mật khẩu mới */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Mật khẩu mới <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChangeText={handleNewPasswordChange}
                    onBlur={() => handleBlur("newPassword")}
                    secureTextEntry={!showNewPassword}
                    style={[
                      styles.input,
                      (errors.newPassword && touched.newPassword) ||
                      isSamePassword
                        ? styles.inputError
                        : null,
                    ]}
                    placeholderTextColor="#9ca3af"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>

                {/* Thông báo mật khẩu trùng nhau */}
                {isSamePassword && (
                  <View style={styles.samePasswordWarning}>
                    <Ionicons
                      name="warning-outline"
                      size={14}
                      color="#f59e0b"
                    />
                    <Text style={styles.samePasswordText}>
                      Mật khẩu mới không được trùng với mật khẩu cũ
                    </Text>
                  </View>
                )}

                {/* Password Strength Indicator */}
                {newPassword && !isSamePassword ? (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthHeader}>
                      <Text style={styles.strengthLabel}>
                        Độ mạnh mật khẩu:
                      </Text>
                      <Text
                        style={[
                          styles.strengthText,
                          { color: getStrengthColor() },
                        ]}
                      >
                        {getStrengthText()}
                      </Text>
                    </View>

                    {/* Strength bar */}
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${(getStrengthScore() / 5) * 100}%`,
                            backgroundColor: getStrengthColor(),
                          },
                        ]}
                      />
                    </View>

                    {/* Requirements list */}
                    <View style={styles.requirementsList}>
                      <View style={styles.requirementItem}>
                        <Ionicons
                          name={
                            passwordStrength.length
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            passwordStrength.length ? "#10b981" : "#9ca3af"
                          }
                          style={styles.requirementIcon}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordStrength.length && styles.requirementMet,
                          ]}
                        >
                          Ít nhất 8 ký tự
                        </Text>
                      </View>

                      <View style={styles.requirementItem}>
                        <Ionicons
                          name={
                            passwordStrength.uppercase
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            passwordStrength.uppercase ? "#10b981" : "#9ca3af"
                          }
                          style={styles.requirementIcon}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordStrength.uppercase && styles.requirementMet,
                          ]}
                        >
                          Chữ hoa (A-Z)
                        </Text>
                      </View>

                      <View style={styles.requirementItem}>
                        <Ionicons
                          name={
                            passwordStrength.lowercase
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            passwordStrength.lowercase ? "#10b981" : "#9ca3af"
                          }
                          style={styles.requirementIcon}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordStrength.lowercase && styles.requirementMet,
                          ]}
                        >
                          Chữ thường (a-z)
                        </Text>
                      </View>

                      <View style={styles.requirementItem}>
                        <Ionicons
                          name={
                            passwordStrength.number
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            passwordStrength.number ? "#10b981" : "#9ca3af"
                          }
                          style={styles.requirementIcon}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordStrength.number && styles.requirementMet,
                          ]}
                        >
                          Số (0-9)
                        </Text>
                      </View>

                      <View style={styles.requirementItem}>
                        <Ionicons
                          name={
                            passwordStrength.specialChar
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            passwordStrength.specialChar ? "#10b981" : "#9ca3af"
                          }
                          style={styles.requirementIcon}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordStrength.specialChar &&
                              styles.requirementMet,
                          ]}
                        >
                          Ký tự đặc biệt (!@#$...)
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : !isSamePassword ? (
                  <Text style={styles.hint}>
                    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ
                    thường, số và ký tự đặc biệt
                  </Text>
                ) : null}

                {errors.newPassword &&
                touched.newPassword &&
                !isSamePassword ? (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                ) : null}
              </View>

              {/* Xác nhận mật khẩu mới */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Xác nhận mật khẩu mới <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword &&
                      touched.confirmPassword &&
                      styles.inputError,
                    isPasswordMatch && styles.inputSuccess,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    onBlur={() => handleBlur("confirmPassword")}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>

                {/* Match indicator */}
                {isPasswordMatch && (
                  <View style={styles.matchIndicator}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#10b981"
                    />
                    <Text style={styles.matchText}>Mật khẩu khớp</Text>
                  </View>
                )}

                {errors.confirmPassword &&
                touched.confirmPassword &&
                !isPasswordMatch ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (loading || isSamePassword) && styles.submitButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={loading || isSamePassword}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitButtonText}>Đang xử lý...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSamePassword ? "Mật khẩu không hợp lệ" : "Đổi mật khẩu"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Card thông tin bảo mật */}
          <View style={styles.card}>
            <Text style={styles.securityTitle}>Lưu ý bảo mật</Text>
            <View style={styles.securityList}>
              <View style={styles.securityItem}>
                <View style={styles.bullet} />
                <Text style={styles.securityText}>
                  Mật khẩu mới phải khác với mật khẩu cũ
                </Text>
              </View>
              <View style={styles.securityItem}>
                <View style={styles.bullet} />
                <Text style={styles.securityText}>
                  Mật khẩu mạnh giúp bảo vệ tài khoản khỏi các mối đe dọa bảo
                  mật
                </Text>
              </View>
              <View style={styles.securityItem}>
                <View style={styles.bullet} />
                <Text style={styles.securityText}>
                  Không chia sẻ mật khẩu với bất kỳ ai
                </Text>
              </View>
              <View style={styles.securityItem}>
                <View style={styles.bullet} />
                <Text style={styles.securityText}>
                  Thay đổi mật khẩu định kỳ để tăng cường bảo mật
                </Text>
              </View>
              <View style={styles.securityItem}>
                <View style={styles.bullet} />
                <Text style={styles.securityText}>
                  Đăng xuất và đăng nhập lại sau khi đổi mật khẩu để đảm bảo bảo
                  mật
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    maxWidth: 768,
    alignSelf: "center",
    width: "100%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  inputSuccess: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    marginLeft: 4,
  },
  samePasswordWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
    padding: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  samePasswordText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
    flex: 1,
  },
  strengthContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementIcon: {
    width: 16,
  },
  requirementText: {
    fontSize: 12,
    color: "#6b7280",
  },
  requirementMet: {
    color: "#10b981",
    fontWeight: "500",
  },
  // Match Indicator
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  securityList: {
    gap: 12,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3b82f6",
    marginTop: 6,
    marginRight: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
});
