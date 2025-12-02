import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import { payInvoice, confirmTransfer } from "../../api/invoiceApi";

export default function PaymentScreen({ route, navigation }) {
  const { invoiceId, invoiceCode } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [proofImage, setProofImage] = useState(null);

  useEffect(() => {
    fetchPaymentInfo();
  }, [invoiceId]);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);
      const res = await payInvoice(invoiceId, { method: "online_gateway" });
      setPaymentData(res);
    } catch (error) {
      console.error("Payment info error:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể lấy thông tin thanh toán",
      });
      setTimeout(() => navigation.goBack(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: "success",
      text1: "Đã sao chép",
      text2: `${label} đã được lưu vào bộ nhớ tạm`,
      visibilityTime: 2000,
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show({
        type: "info",
        text1: "Cần quyền truy cập",
        text2: "Vui lòng cấp quyền thư viện ảnh để tải lên biên lai.",
      });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [9, 16],
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0]);
    }
  };

  const handleConfirmPayment = async () => {
    if (!proofImage) {
      Toast.show({
        type: "error",
        text1: "Thiếu ảnh",
        text2: "Vui lòng tải minh chứng chuyển khoản.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      if (Platform.OS === "web") {
        const response = await fetch(proofImage.uri);
        const blob = await response.blob();
        formData.append("proofImage", blob, "proof.jpg");
      } else {
        formData.append("proofImage", {
          uri: proofImage.uri,
          name: proofImage.fileName || `proof_${Date.now()}.jpg`,
          type: proofImage.mimeType || "image/jpeg",
        });
      }

      formData.append("amount", String(paymentData.amount));
      formData.append("note", "Xác nhận chuyển khoản");

      await confirmTransfer(invoiceId, formData);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã gửi xác nhận chuyển khoản!",
        visibilityTime: 2000,
        onHide: () => {
          navigation.navigate("InvoiceDetailScreen", { invoiceId });
        },
      });

      setTimeout(() => {
        navigation.navigate("InvoiceDetailScreen", { invoiceId });
      }, 1000);
    } catch (error) {
      console.error("Confirm error:", error);
      Toast.show({
        type: "error",
        text1: "Thất bại",
        text2: error.response?.data?.message || "Không gửi được xác nhận",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!paymentData) return null;
  const { bankInfo, transferNote, amount, message } = paymentData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán & Xác nhận</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.invoiceCode}>{invoiceCode}</Text>
          <Text style={styles.instruction}>{message}</Text>

          {bankInfo?.qrImageUrl ? (
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: bankInfo.qrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          <View style={styles.bankDetailsContainer}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Ngân hàng:</Text>
              <Text style={styles.bankValue}>{bankInfo?.bankName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
              <Text style={styles.bankValue}>{bankInfo?.accountName}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.copyRow}>
              <View>
                <Text style={styles.bankLabel}>Số tài khoản:</Text>
                <Text style={styles.highlightValue}>
                  {bankInfo?.accountNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() =>
                  copyToClipboard(bankInfo?.accountNumber, "Số tài khoản")
                }
              >
                <Ionicons name="copy-outline" size={18} color="#3b82f6" />
                <Text style={styles.copyText}>Sao chép</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.copyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankLabel}>Nội dung chuyển khoản:</Text>
                <Text style={styles.highlightValue}>{transferNote}</Text>
                <Text style={styles.warningText}>
                  (Bắt buộc ghi đúng nội dung)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(transferNote, "Nội dung")}
              >
                <Ionicons name="copy-outline" size={18} color="#3b82f6" />
                <Text style={styles.copyText}>Sao chép</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tiền:</Text>
              <Text style={styles.totalAmountText}>
                {formatCurrency(amount)}
              </Text>
            </View>
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Xác nhận thanh toán</Text>
            <Text style={styles.uploadDesc}>
              Vui lòng tải lên ảnh chụp màn hình giao dịch chuyển khoản thành
              công để chủ trọ xác nhận.
            </Text>

            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {proofImage ? (
                <Image
                  source={{ uri: proofImage.uri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={40}
                    color="#94a3b8"
                  />
                  <Text style={styles.uploadPlaceholderText}>
                    Chạm để tải ảnh lên
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {proofImage && (
              <TouchableOpacity style={styles.reselectBtn} onPress={pickImage}>
                <Text style={styles.reselectText}>Chọn ảnh khác</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.doneButton,
              (!proofImage || submitting) && styles.disabledButton,
            ]}
            onPress={handleConfirmPayment}
            disabled={!proofImage || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.doneButtonText}>
                Gửi xác nhận chuyển khoản
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  content: { padding: 20 },
  invoiceCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
    textAlign: "center",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignSelf: "center",
  },
  qrImage: { width: 200, height: 200 },
  bankDetailsContainer: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  copyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  bankLabel: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  bankValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
    flex: 1,
  },
  highlightValue: { fontSize: 16, fontWeight: "bold", color: "#3b82f6" },
  warningText: {
    fontSize: 12,
    color: "#ef4444",
    fontStyle: "italic",
    marginTop: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  copyText: { fontSize: 12, color: "#3b82f6", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 12 },
  totalAmountText: { fontSize: 20, fontWeight: "bold", color: "#ef4444" },
  uploadSection: { marginBottom: 30 },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  uploadDesc: { fontSize: 14, color: "#64748b", marginBottom: 12 },
  uploadBox: {
    height: 200,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadPlaceholder: { alignItems: "center" },
  uploadPlaceholderText: {
    marginTop: 8,
    color: "#64748b",
    fontWeight: "500",
  },
  previewImage: { width: "100%", height: "100%" },
  reselectBtn: { alignItems: "center", marginTop: 8 },
  reselectText: { color: "#3b82f6", fontWeight: "600" },
  footer: { padding: 16, borderTopWidth: 1, borderColor: "#f1f5f9" },
  doneButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#94a3b8" },
  doneButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingText: { marginTop: 12, color: "#64748b" },
});
