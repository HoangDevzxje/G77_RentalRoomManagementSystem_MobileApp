import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendOtpApi, verifyOtpApi } from "../../api/authApi";

export default function SendOtpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRef = useRef(null);

  const validateEmail = (email) => {
    if (!email) {
      return "Vui lòng nhập email!";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Email không hợp lệ!";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await sendOtpApi(email, "reset-password");
      if (res.status === true) {
        setIsModalOpen(true);
        setOtpValue("");
        setOtpError("");
        Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn!");
      }
    } catch (error) {
      if (error?.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Vui lòng nhập đầy đủ 6 số OTP!");
      return;
    }

    setOtpError("");
    setIsVerifying(true);

    try {
      const res = await verifyOtpApi(email, "reset-password", otpValue);
      if (res.status === true) {
        setIsModalOpen(false);
        // Truyền thêm thông tin xác thực
        navigation.navigate("ResetPassword", {
          email: email,
          isOtpVerified: true, // Thêm flag xác thực
        });
        Alert.alert("Thành công", "Xác thực thành công!");
      }
    } catch (error) {
      setOtpError("Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại!");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await sendOtpApi(email, "reset-password");
      setOtpValue("");
      setOtpError("");
      Alert.alert("Thành công", "Đã gửi lại mã OTP!");
    } catch (error) {
      setOtpError("Có lỗi khi gửi lại mã OTP!");
      Alert.alert("Lỗi", "Không thể gửi lại mã OTP. Vui lòng thử lại sau!");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOtpValue("");
    setOtpError("");
  };

  const focusOTPInput = () => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Card Container */}
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerIcon}>
              <Ionicons name="lock-closed" size={32} color="#fff" />
            </View>

            <Text style={styles.title}>Quên Mật Khẩu</Text>
            <Text style={styles.subtitle}>Nhập email để nhận mã xác thực</Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#1d4ed8" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                Hướng dẫn khôi phục mật khẩu:
              </Text>
              <Text style={styles.infoText}>
                • Nhập email đã đăng ký tài khoản
              </Text>
              <Text style={styles.infoText}>
                • Nhận mã OTP gồm 6 số qua email
              </Text>
              <Text style={styles.infoText}>
                • Xác thực và tạo mật khẩu mới
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Địa chỉ Email đã đăng ký</Text>

            <View
              style={[styles.inputContainer, error ? styles.inputError : null]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={error ? "#dc2626" : "#6b7280"}
              />
              <TextInput
                placeholder="example@gmail.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError("");
                }}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (isLoading || !email) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Gửi mã xác thực</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Bạn sẽ nhận được mã OTP qua email trong vòng 2-3 phút
            </Text>

            <View style={styles.loginLink}>
              <Text style={styles.footerText}>Đã nhớ mật khẩu? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLinkText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* OTP Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="shield-checkmark" size={32} color="#2563eb" />
              </View>
              <Text style={styles.modalTitle}>Xác thực mã OTP</Text>
              <Text style={styles.modalDescription}>
                Nhập mã OTP gồm 6 số đã được gửi đến
              </Text>
              <Text style={styles.modalEmail}>{email}</Text>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              <TouchableOpacity
                style={styles.otpDisplayContainer}
                onPress={focusOTPInput}
                activeOpacity={1}
              >
                <View style={styles.otpInputs}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.otpBox,
                        otpValue.length === index && styles.otpBoxActive,
                        otpValue[index] && styles.otpBoxFilled,
                      ]}
                    >
                      <Text style={styles.otpBoxText}>
                        {otpValue[index] || ""}
                      </Text>
                      {otpValue.length === index && (
                        <View style={styles.cursor} />
                      )}
                    </View>
                  ))}
                </View>
              </TouchableOpacity>

              <TextInput
                ref={otpInputRef}
                style={styles.hiddenInput}
                value={otpValue}
                onChangeText={(text) => {
                  // Chỉ cho phép nhập số
                  const numericText = text.replace(/[^0-9]/g, "");
                  if (numericText.length <= 6) {
                    setOtpValue(numericText);
                    if (otpError) setOtpError("");
                  }
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
                caretHidden={true}
              />

              {otpError ? (
                <View style={styles.otpErrorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.otpErrorText}>{otpError}</Text>
                </View>
              ) : null}
            </View>

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Mã OTP có hiệu lực trong 10 phút
              </Text>
              <Text style={styles.resendText}>Không nhận được mã?</Text>
              <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                <Text style={styles.resendLink}>Gửi lại mã OTP</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
                disabled={isVerifying}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (isVerifying || otpValue.length !== 6) &&
                    styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={isVerifying || otpValue.length !== 6}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    Xác thực và tiếp tục
                  </Text>
                )}
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
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 24,
    alignItems: "center",
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
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#e0f2fe",
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 0,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#374151",
    lineHeight: 16,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  errorText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#dc2626",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginLinkText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  modalEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
    marginTop: 4,
  },
  otpContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  otpDisplayContainer: {
    width: "100%",
    marginBottom: 16,
  },
  otpInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  otpBox: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    position: "relative",
  },
  otpBoxActive: {
    borderColor: "#2563eb",
    backgroundColor: "#fff",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  otpBoxFilled: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  otpBoxText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  cursor: {
    width: 2,
    height: 24,
    backgroundColor: "#2563eb",
    position: "absolute",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  otpErrorText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#dc2626",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  resendText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  resendLink: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  verifyButton: {
    flex: 2,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  verifyButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
