import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { verifyOtpApi } from "../../api/authApi";

export default function VerifyOtpScreen({ route }) {
  const navigation = useNavigation();
  const { emailVerify } = route.params || {};

  const [otpValue, setOtpValue] = useState(Array(6).fill(""));
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);

  const handleChangeOtp = (text, index) => {
    if (/^\d*$/.test(text)) {
      const updatedOtp = [...otpValue];
      updatedOtp[index] = text;
      setOtpValue(updatedOtp);

      if (text && index < 5) {
        inputsRef.current[index + 1].focus();
      }

      if (otpError) setOtpError("");
    }
  };

  const handleBackspace = (e, index) => {
    if (
      e.nativeEvent.key === "Backspace" &&
      otpValue[index] === "" &&
      index > 0
    ) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const otp = otpValue.join("");

      if (!otp || otp.length !== 6) {
        alert("Vui lòng nhập đầy đủ 6 số OTP");
        return;
      }

      setLoading(true);
      const res = await verifyOtpApi(emailVerify, "register", otp);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={["#dbeafe", "#e0e7ff", "#ede9fe"]}
          style={styles.container}
        >
          <View style={styles.card}>
            {/* Header */}
            <LinearGradient
              colors={["#2563eb", "#4f46e5", "#7c3aed"]}
              style={styles.header}
            >
              <View style={styles.headerIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={36}
                  color="#fff"
                />
              </View>
              <Text style={styles.headerTitle}>Xác thực mã OTP</Text>
              <Text style={styles.headerSubtitle}>
                Nhập mã OTP gồm 6 số đã được gửi đến email của bạn
              </Text>
            </LinearGradient>

            {/* Main Content */}
            <View style={styles.content}>
              <Text style={styles.label}>Nhập mã xác thực</Text>
              <View style={styles.otpContainer}>
                {otpValue.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputsRef.current[index] = ref)}
                    value={digit}
                    onChangeText={(text) => handleChangeOtp(text, index)}
                    onKeyPress={(e) => handleBackspace(e, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    style={[
                      styles.otpInput,
                      otpError ? { borderColor: "#ef4444" } : {},
                    ]}
                  />
                ))}
              </View>

              {otpError ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#ef4444"
                  />
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              ) : null}

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  loading || otpValue.join("").length !== 6
                    ? { backgroundColor: "#d1d5db" }
                    : {},
                ]}
                disabled={loading || otpValue.join("").length !== 6}
                onPress={handleVerifyOtp}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.verifyText}> Xác thực mã OTP</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Info Section */}
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#2563eb"
                />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.infoTitle}>Lưu ý:</Text>
                  <Text style={styles.infoText}>
                    • Mã OTP có hiệu lực trong 5 phút
                  </Text>
                  <Text style={styles.infoText}>
                    • Kiểm tra hộp thư spam nếu không thấy email
                  </Text>
                  <Text style={styles.infoText}>
                    • Không chia sẻ mã OTP cho bất kỳ ai
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.securityBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#16a34a"
            />
            <Text style={styles.securityText}>Xác thực an toàn & bảo mật</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerIcon: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#dbeafe",
    textAlign: "center",
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 10,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  verifyText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a8a",
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  securityText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
});
