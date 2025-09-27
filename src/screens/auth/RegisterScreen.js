import React, { useState } from "react";
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

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("resident");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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

  const passwordStrength = getPasswordStrength(form.password);
  const strengthColors = [
    "#ef4444",
    "#f97316",
    "#facc15",
    "#3b82f6",
    "#22c55e",
  ];

  const handleRegister = async () => {
    if (
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      return alert("Vui lòng điền đầy đủ thông tin!");
    }
    if (form.password !== form.confirmPassword) {
      return alert("Mật khẩu và xác nhận mật khẩu không khớp!");
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        role,
      };

      await registerApi(payload);
      alert("Đăng ký thành công!");
      navigation.navigate("VerifyOtp", {
        emailVerify: form.email,
      });
    } catch (error) {
      alert(error.response?.data?.message || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.label}>Tên đầy đủ</Text>
            <View style={styles.inputWrapper}>
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
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
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
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Mật khẩu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
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
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Thanh đo độ mạnh mật khẩu */}
            {form.password.length > 0 && (
              <View style={styles.strengthBarContainer}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          level <= passwordStrength
                            ? strengthColors[passwordStrength - 1]
                            : "#e5e7eb",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Xác nhận mật khẩu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.inputWrapper}>
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
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nút đăng ký */}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
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
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  inputIcon: {
    position: "absolute",
    left: 10,
  },
  input: {
    flex: 1,
    height: 45,
    paddingLeft: 36,
    fontSize: 16,
    color: "#111827",
  },
  eyeButton: {
    position: "absolute",
    right: 10,
    padding: 4,
  },
  strengthBarContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  submitButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
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
