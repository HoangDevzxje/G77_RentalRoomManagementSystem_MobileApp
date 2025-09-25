import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { registerApi, sendOtpApi, verifyOtpApi } from "../../api/authApi";
import { Picker } from "@react-native-picker/picker";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    provinceName: "",
    districtName: "",
    wardName: "",
    address: "",
    role: "resident",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    console.log(`Field: ${field}, Value: ${value}`); // Debug để kiểm tra giá trị
  };

  const handleSendOtp = async () => {
    if (!form.email) return Alert.alert("Lỗi", "Vui lòng nhập email");
    try {
      setLoading(true);
      await sendOtpApi(form.email, "register");
      Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (error) {
      Alert.alert("Lỗi", error.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    if (!otp) return Alert.alert("Lỗi", "Vui lòng nhập mã OTP");
    try {
      setLoading(true);
      await verifyOtpApi(form.email, "register", otp);
      await registerApi(form);
      Alert.alert("Thành công", "Đăng ký thành công!", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          paddingBottom: 300,
          paddingTop: 80,
          alignItems: "center",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 20,
            marginTop: 0,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
            minHeight: "auto",
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Text
            style={{
              fontSize: 25,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Đăng Ký
          </Text>

          {step === 1 ? (
            <>
              {/* Họ */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Họ</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Nhập họ"
                  value={form.lastName}
                  onChangeText={(text) => handleChange("lastName", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb" // Màu con trỏ khi chọn text
                />
              </View>

              {/* Tên */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tên</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Nhập tên"
                  value={form.firstName}
                  onChangeText={(text) => handleChange("firstName", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Email */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { color: "#4973b7ff" }]}
                  placeholder="Nhập email"
                  value={form.email}
                  onChangeText={(text) => handleChange("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Số điện thoại */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Nhập số điện thoại"
                  value={form.phoneNumber}
                  onChangeText={(text) => handleChange("phoneNumber", text)}
                  keyboardType="phone-pad"
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Ngày sinh */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="1990-01-01"
                  value={form.dob}
                  onChangeText={(text) => handleChange("dob", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Giới tính */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Giới tính</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Nam/Nữ/Khác"
                  value={form.gender}
                  onChangeText={(text) => handleChange("gender", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Địa chỉ */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Địa chỉ</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Địa chỉ đường"
                  value={form.address}
                  onChangeText={(text) => handleChange("address", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Tỉnh */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tỉnh</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Tỉnh"
                  value={form.provinceName}
                  onChangeText={(text) => handleChange("provinceName", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Huyện */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Huyện</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Huyện"
                  value={form.districtName}
                  onChangeText={(text) => handleChange("districtName", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Xã */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Xã</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Xã"
                  value={form.wardName}
                  onChangeText={(text) => handleChange("wardName", text)}
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Mật khẩu */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={{
                      flex: 1,
                      height: 45,
                      paddingLeft: 10,
                      color: "#374151",
                    }}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChangeText={(text) => handleChange("password", text)}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#6b7280"
                    selectionColor="#2563eb"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingRight: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Xác nhận mật khẩu */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={{
                      flex: 1,
                      height: 45,
                      paddingLeft: 10,
                      color: "#374151",
                    }}
                    placeholder="Xác nhận mật khẩu"
                    value={form.confirmPassword}
                    onChangeText={(text) =>
                      handleChange("confirmPassword", text)
                    }
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#6b7280"
                    selectionColor="#2563eb"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ paddingRight: 10 }}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Gửi OTP */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Gửi OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* OTP */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Nhập mã OTP</Text>
                <TextInput
                  style={[styles.input, { color: "#374151" }]}
                  placeholder="Mã OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  placeholderTextColor="#6b7280"
                  selectionColor="#2563eb"
                />
              </View>

              {/* Xác minh & Đăng ký */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyOtpAndRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Xác minh & Đăng ký</Text>
                )}
              </TouchableOpacity>

              {/* Quay lại bước 1 */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: "#6b7280", marginTop: 10 },
                ]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.buttonText}>Quay lại Form</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Quay lại đăng nhập */}
          <View
            style={{ marginTop: 20, alignItems: "center", paddingBottom: 10 }}
          >
            <Text>
              Đã có tài khoản?{" "}
              <Text
                style={{ color: "#2563eb", fontWeight: "bold" }}
                onPress={() => navigation.navigate("Login")}
              >
                Đăng nhập ngay
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#374151",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
};
