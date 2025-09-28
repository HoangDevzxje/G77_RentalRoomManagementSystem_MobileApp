import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resetPasswordApi } from "../../api/authApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";

export default function ResetPasswordScreen({ route, navigation }) {
  const { email, isOtpVerified } = route.params;
  const { logout } = useAuth(); // Add this line to use the logout function
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Check OTP verification status on mount
  useEffect(() => {
    const checkOtpVerification = async () => {
      const isVerified = await AsyncStorage.getItem(
        `otpVerified_${email}_reset-password`
      );
      if (!isVerified || isVerified !== "true") {
        Alert.alert(
          "Lỗi xác thực",
          "OTP chưa được xác thực. Vui lòng quay lại và xác thực OTP.",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    };

    checkOtpVerification();
  }, [email, navigation]);

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Vui lòng nhập mật khẩu mới!";
    }
    if (password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự!";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt!";
    }
    return "";
  };

  const handleResetPassword = async () => {
    const newErrors = {
      newPassword: "",
      confirmPassword: "",
    };

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu!";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp!";
    }

    if (newErrors.newPassword || newErrors.confirmPassword) {
      setErrors(newErrors);
      return;
    }

    // Double-check OTP verification
    const isVerified = await AsyncStorage.getItem(
      `otpVerified_${email}_reset-password`
    );
    if (!isVerified || isVerified !== "true") {
      Alert.alert(
        "Lỗi xác thực",
        "OTP chưa được xác thực. Vui lòng quay lại và xác thực OTP.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    setErrors({ newPassword: "", confirmPassword: "" });
    setLoading(true);

    try {
      console.log("Sending reset password request for:", email);

      await resetPasswordApi(email, newPassword, confirmPassword);

      Alert.alert(
        "Thành công",
        "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.",
        [
          {
            text: "Đăng nhập",
            onPress: async () => {
              try {
                console.log(
                  "Password reset successful, clearing auth and navigating..."
                );

                // Clear authentication state first
                await logout();

                // Small delay to ensure logout is completed
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                }, 100);
              } catch (error) {
                console.log("Navigation error:", error);
                // Fallback: just navigate without clearing auth
                navigation.navigate("Login");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log("Reset password error:", error);

      let errorMessage = "Đặt lại mật khẩu thất bại";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // If OTP verification error, redirect back to send OTP screen
      if (errorMessage.includes("OTP") || errorMessage.includes("xác thực")) {
        Alert.alert("Lỗi xác thực", errorMessage, [
          {
            text: "Quay lại",
            onPress: () => navigation.navigate("SendOtp"),
          },
        ]);
      } else {
        Alert.alert("Lỗi", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#3b82f6",
    "#22c55e",
  ];
  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

  const passwordRequirements = [
    { label: "Ít nhất 8 ký tự", met: newPassword.length >= 8 },
    { label: "Chứa chữ hoa (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "Chứa chữ thường (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "Chứa số (0-9)", met: /\d/.test(newPassword) },
    {
      label: "Chứa ký tự đặc biệt (@$!%*?&)",
      met: /[@$!%*?&]/.test(newPassword),
    },
  ];

  const isFormValid =
    newPassword &&
    confirmPassword &&
    newPassword === confirmPassword &&
    passwordStrength >= 4;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* Main Card */}
      <View style={styles.card}>
        {/* Header with decorative background */}
        <View style={styles.header}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Decorative circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="key" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Tạo Mật Khẩu Mới</Text>
            <Text style={styles.subtitle}>
              Mật khẩu mạnh giúp bảo vệ tài khoản của bạn tốt hơn
            </Text>
            <Text style={styles.emailText}>Email: {email}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* New Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={newPassword ? "#3b82f6" : "#9ca3af"}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors((prev) => ({ ...prev, newPassword: "" }));
                    }
                  }}
                  style={[
                    styles.input,
                    errors.newPassword && styles.inputError,
                    confirmPassword &&
                      confirmPassword === newPassword &&
                      styles.inputSuccess,
                  ]}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Strength Bar */}
            {newPassword ? (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Độ mạnh mật khẩu</Text>
                  <Text
                    style={[
                      styles.strengthValue,
                      passwordStrength >= 4 && styles.strengthValueStrong,
                      passwordStrength === 3 && styles.strengthValueMedium,
                      passwordStrength <= 2 && styles.strengthValueWeak,
                    ]}
                  >
                    {strengthLabels[passwordStrength - 1] || ""}
                  </Text>
                </View>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        level <= passwordStrength && {
                          backgroundColor: strengthColors[passwordStrength - 1],
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {errors.newPassword ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              </View>
            ) : null}
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={
                    confirmPassword && confirmPassword === newPassword
                      ? "#22c55e"
                      : confirmPassword
                      ? "#9ca3af"
                      : "#9ca3af"
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }
                  }}
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                    confirmPassword &&
                      confirmPassword === newPassword &&
                      styles.inputSuccess,
                  ]}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {confirmPassword && confirmPassword === newPassword ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.successText}>Mật khẩu khớp</Text>
              </View>
            ) : null}

            {errors.confirmPassword ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            ) : null}
          </View>

          {/* Password Requirements Card */}
          <View style={styles.requirementsCard}>
            <View style={styles.requirementsHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#374151" />
              <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu</Text>
            </View>
            <View style={styles.requirementsList}>
              {passwordRequirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <View
                    style={[
                      styles.requirementIcon,
                      req.met && styles.requirementIconMet,
                    ]}
                  >
                    {req.met ? (
                      <Ionicons name="checkmark" size={12} color="#22c55e" />
                    ) : (
                      <View style={styles.requirementDot} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.requirementText,
                      req.met && styles.requirementTextMet,
                    ]}
                  >
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || loading) && styles.submitButtonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Xác nhận và Đặt lại Mật khẩu
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="lock-closed" size={16} color="#3b82f6" />
            <Text style={styles.footerText}>
              Mật khẩu của bạn được mã hóa an toàn
            </Text>
          </View>
          <View style={styles.loginLink}>
            <Text style={styles.footerText}>Đã nhớ mật khẩu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
    marginVertical: 20,
  },
  header: {
    backgroundColor: "#3b82f6",
    padding: 40,
    position: "relative",
    overflow: "hidden",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  decorativeCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: -32,
    left: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerContent: {
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    backdropFilter: "blur(10px)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#e0f2fe",
    textAlign: "center",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 12,
    color: "#e0f2fe",
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    padding: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 8,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  inputSuccess: {
    borderColor: "#22c55e",
  },
  eyeIcon: {
    padding: 4,
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  strengthValueStrong: {
    color: "#22c55e",
  },
  strengthValueMedium: {
    color: "#3b82f6",
  },
  strengthValueWeak: {
    color: "#ef4444",
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    height: 8,
  },
  strengthSegment: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#dc2626",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  successText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
  },
  requirementsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
  },
  requirementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  requirementIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requirementIconMet: {
    backgroundColor: "#dcfce7",
  },
  requirementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9ca3af",
  },
  requirementText: {
    fontSize: 12,
    color: "#6b7280",
  },
  requirementTextMet: {
    color: "#22c55e",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
    gap: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginLinkText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
});
