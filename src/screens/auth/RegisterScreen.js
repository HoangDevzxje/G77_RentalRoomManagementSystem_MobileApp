import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registerApi } from "../../api/authApi";
import Toast from "react-native-toast-message";

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("resident");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    if (form.confirmPassword && touched.confirmPassword) {
      const error = validateConfirmPassword(
        form.password,
        form.confirmPassword
      );
      setErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  }, [form.password]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, form[field]);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (value.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "password") {
      checkPasswordStrength(value);
      validatePassword(value);
    }

    if (field === "confirmPassword") {
      validateConfirmPassword(form.password, value);
    }

    if (field === "email" && value) {
      validateEmail(value);
    }

    if (field === "fullName" && value) {
      validateFullName(value);
    }
  };

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

  // Validate từng field
  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "fullName":
        error = validateFullName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(form.password, value);
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateFullName = (name) => {
    if (!name.trim()) return "Vui lòng nhập họ và tên";
    if (name.trim().length < 2) return "Họ và tên phải có ít nhất 2 ký tự";
    if (name.trim().length > 50)
      return "Họ và tên không được vượt quá 50 ký tự";
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Vui lòng nhập email";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email không hợp lệ";
    if (email.length > 100) return "Email quá dài";
    return "";
  };

  const validatePassword = (password) => {
    if (!password.trim()) return "Vui lòng nhập mật khẩu";
    if (!checkPasswordStrength(password)) return "Mật khẩu không đủ mạnh";
    return "";
  };

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword.trim()) return "Vui lòng xác nhận mật khẩu";
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp";
    return "";
  };

  // Validate tất cả trước khi submit
  const validateAll = () => {
    const newErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(
        form.password,
        form.confirmPassword
      ),
    };

    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    return !Object.values(newErrors).some((error) => error);
  };

  const getStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getStrengthColor = () => {
    const score = getStrengthScore();
    if (score <= 1) return "#ef4444";
    if (score === 2) return "#f97316";
    if (score === 3) return "#facc15";
    if (score === 4) return "#3b82f6";
    return "#22c55e";
  };

  const getStrengthText = () => {
    const score = getStrengthScore();
    if (score <= 1) return "Rất yếu";
    if (score === 2) return "Yếu";
    if (score === 3) return "Trung bình";
    if (score === 4) return "Mạnh";
    return "Rất mạnh";
  };

  const handleRegister = async () => {
    if (!validateAll()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng kiểm tra lại thông tin!",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        role,
      };

      await registerApi(payload);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
      });

      setTimeout(() => {
        navigation.navigate("VerifyOtp", {
          emailVerify: form.email,
        });
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại!";

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const isPasswordMatch =
    form.confirmPassword &&
    form.password &&
    form.password === form.confirmPassword;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Tạo tài khoản mới</Text>

          {/* Chọn vai trò */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "resident" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("resident")}
              disabled={loading}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color={role === "resident" ? "#2563eb" : "#6b7280"}
              />
              <Text
                style={[
                  styles.roleText,
                  role === "resident" && styles.roleTextActive,
                ]}
              >
                Người thuê
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "landlord" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("landlord")}
              disabled={loading}
            >
              <Ionicons
                name="home-outline"
                size={24}
                color={role === "landlord" ? "#2563eb" : "#6b7280"}
              />
              <Text
                style={[
                  styles.roleText,
                  role === "landlord" && styles.roleTextActive,
                ]}
              >
                Chủ nhà
              </Text>
            </TouchableOpacity>
          </View>

          {/* Họ và tên */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên đầy đủ <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                errors.fullName && touched.fullName && styles.inputError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đầy đủ"
                value={form.fullName}
                onChangeText={(text) => handleChange("fullName", text)}
                onBlur={() => handleBlur("fullName")}
                placeholderTextColor="#9ca3af"
                editable={!loading}
              />
            </View>
            {errors.fullName && touched.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                errors.email && touched.email && styles.inputError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                value={form.email}
                onChangeText={(text) => handleChange("email", text)}
                onBlur={() => handleBlur("email")}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                editable={!loading}
              />
            </View>
            {errors.email && touched.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Mật khẩu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Mật khẩu <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && touched.password && styles.inputError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChangeText={(text) => handleChange("password", text)}
                onBlur={() => handleBlur("password")}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {form.password ? (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Độ mạnh mật khẩu:</Text>
                  <Text
                    style={[styles.strengthText, { color: getStrengthColor() }]}
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
                      color={passwordStrength.length ? "#22c55e" : "#9ca3af"}
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
                      color={passwordStrength.uppercase ? "#22c55e" : "#9ca3af"}
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
                      color={passwordStrength.lowercase ? "#22c55e" : "#9ca3af"}
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
                      color={passwordStrength.number ? "#22c55e" : "#9ca3af"}
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
                        passwordStrength.specialChar ? "#22c55e" : "#9ca3af"
                      }
                      style={styles.requirementIcon}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        passwordStrength.specialChar && styles.requirementMet,
                      ]}
                    >
                      Ký tự đặc biệt (!@#$...)
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.hint}>
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường,
                số và ký tự đặc biệt
              </Text>
            )}

            {errors.password && touched.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Xác nhận mật khẩu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Xác nhận mật khẩu <Text style={styles.required}>*</Text>
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
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChangeText={(text) => handleChange("confirmPassword", text)}
                onBlur={() => handleBlur("confirmPassword")}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9ca3af"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Match indicator */}
            {isPasswordMatch && (
              <View style={styles.matchIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.matchText}>Mật khẩu khớp</Text>
              </View>
            )}

            {errors.confirmPassword &&
              touched.confirmPassword &&
              !isPasswordMatch && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
          </View>

          {/* Nút đăng ký */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          {/* Quay lại đăng nhập */}
          <View style={styles.loginLink}>
            <Text style={{ color: "#6b7280" }}>
              Bạn đã có tài khoản?{" "}
              <Text
                style={{ color: "#2563eb", fontWeight: "bold" }}
                onPress={() => navigation.navigate("Login")}
              >
                Đăng nhập
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#111827",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  roleButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  roleText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
  },
  roleTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  required: {
    color: "#ef4444",
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  inputSuccess: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
  },
  input: {
    flex: 1,
    height: 45,
    paddingLeft: 36,
    paddingRight: 40,
    fontSize: 16,
    color: "#111827",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 16,
  },
  // Password Strength Styles
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
    color: "#22c55e",
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
    color: "#22c55e",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#4b5563",
    opacity: 0.7,
  },
  submitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
});
