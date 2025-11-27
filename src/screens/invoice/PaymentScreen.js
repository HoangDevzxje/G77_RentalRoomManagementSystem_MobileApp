import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ToastAndroid,
  Platform,
} from "react-native";
import { Clipboard } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { payInvoice } from "../../api/invoiceApi";

export default function PaymentScreen({ route, navigation }) {
  const { invoiceId, invoiceCode } = route.params;
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    fetchPaymentInfo();
  }, [invoiceId]);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);
      const res = await payInvoice(invoiceId, { method: "online_gateway" });
      setPaymentData(res);
    } catch (error) {
      console.error("Payment error:", error);
      const msg =
        error.response?.data?.message || "Không thể lấy thông tin thanh toán";
      Alert.alert("Lỗi", msg, [
        { text: "Quay lại", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    Clipboard.setString(text);
    if (Platform.OS === "android") {
      ToastAndroid.show(`Đã sao chép ${label}`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Sao chép", `Đã sao chép ${label} vào bộ nhớ tạm.`);
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
          <Text style={styles.loadingText}>Đang tạo mã QR thanh toán...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!paymentData) return null;

  const { bankInfo, transferNote, amount, message } = paymentData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán hóa đơn</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.invoiceCode}>{invoiceCode}</Text>
          <Text style={styles.instruction}>{message}</Text>

          {/* QR Code Section */}
          {bankInfo?.qrImageUrl ? (
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: bankInfo.qrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          {/* Bank Details */}
          <View style={styles.bankDetailsContainer}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Ngân hàng:</Text>
              <Text style={styles.bankValue}>{bankInfo?.bankName}</Text>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
              <Text style={styles.bankValue}>{bankInfo?.accountName}</Text>
            </View>

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

            <View style={styles.divider} />

            <View style={styles.copyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankLabel}>Nội dung chuyển khoản:</Text>
                <Text style={styles.highlightValue}>{transferNote}</Text>
                <Text style={styles.warningText}>
                  (Vui lòng nhập chính xác nội dung này)
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

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Tôi đã thanh toán</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
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
    padding: 20,
    paddingBottom: 40,
  },
  invoiceCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
    textAlign: "center",
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  instruction: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
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
    marginBottom: 12,
  },
  bankLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },
  bankValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  highlightValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: "#ef4444",
    fontStyle: "italic",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  copyText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  totalAmountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
  },
  doneButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
