import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { createContact } from "../../api/contactApi";
import Toast from "react-native-toast-message";

export default function ContactDetailScreen({ route, navigation }) {
  const { roomId, postId, buildingId, roomInfo, landlord } = route.params;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    tenantNote: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.contactName.trim()) {
      newErrors.contactName = "Vui lòng nhập họ tên";
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Vui lòng nhập số điện thoại";
    } else {
      const cleanedPhone = formData.contactPhone.replace(/\D/g, "");
      if (!/^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/.test(cleanedPhone)) {
        newErrors.contactPhone = "Số điện thoại không hợp lệ (10 số)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Kiểm tra form có đầy đủ thông tin không
    if (!formData.contactName.trim() || !formData.contactPhone.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đầy đủ thông tin bắt buộc",
        visibilityTime: 3000,
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2:
          errors.contactPhone ||
          errors.contactName ||
          "Vui lòng kiểm tra lại thông tin",
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = formData.contactPhone.replace(/\D/g, "");

      const contactData = {
        buildingId,
        postId,
        roomId,
        contactName: formData.contactName.trim(),
        contactPhone: cleanedPhone,
        tenantNote: formData.tenantNote.trim(),
      };

      const response = await createContact(contactData);

      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Gửi yêu cầu hợp đồng thành công!",
        visibilityTime: 2500,
      });

      setTimeout(() => {
        navigation.navigate("BottomTabs");
      }, 2500);
    } catch (error) {
      console.error("Lỗi tạo hợp đồng:", error);

      let errorMessage = "Không thể gửi yêu cầu hợp đồng";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error khi user nhập lại
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo yêu cầu hợp đồng</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Thông tin phòng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin phòng</Text>
          <View style={styles.roomCard}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>
                {roomInfo?.name || `Phòng ${roomInfo?.roomNumber}`}
              </Text>
              <Text style={styles.roomPrice}>
                {roomInfo?.price
                  ? `${Number(roomInfo.price).toLocaleString("vi-VN")}đ`
                  : "Liên hệ"}
              </Text>
            </View>
            {roomInfo?.area ? (
              <Text style={styles.roomArea}>Diện tích: {roomInfo.area}m²</Text>
            ) : null}
            {landlord?.fullName ? (
              <Text style={styles.landlordInfo}>
                Chủ trọ: {landlord.fullName}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Form thông tin liên hệ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <View style={styles.formCard}>
            {/* Họ tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Họ và tên <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.contactName ? styles.inputError : null,
                ]}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor="#9ca3af"
                value={formData.contactName}
                onChangeText={(value) =>
                  handleInputChange("contactName", value)
                }
                editable={!loading}
              />
              {errors.contactName ? (
                <Text style={styles.errorText}>{errors.contactName}</Text>
              ) : null}
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Số điện thoại <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.contactPhone ? styles.inputError : null,
                ]}
                placeholder="Nhập số điện thoại của bạn"
                placeholderTextColor="#9ca3af"
                value={formData.contactPhone}
                onChangeText={(value) =>
                  handleInputChange("contactPhone", value)
                }
                keyboardType="phone-pad"
                editable={!loading}
              />
              {errors.contactPhone ? (
                <Text style={styles.errorText}>{errors.contactPhone}</Text>
              ) : null}
            </View>

            {/* Ghi chú */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ghi chú (tuỳ chọn)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Thêm ghi chú cho chủ trọ (thời gian liên hệ, yêu cầu đặc biệt...)"
                placeholderTextColor="#9ca3af"
                value={formData.tenantNote}
                onChangeText={(value) => handleInputChange("tenantNote", value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        {/* Thông báo */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#0d9488" />
            <Text style={styles.infoText}>
              Sau khi gửi yêu cầu, chủ trọ sẽ liên hệ với bạn trong thời gian
              sớm nhất để xác nhận và hoàn tất thủ tục hợp đồng.
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.submitBtn, loading ? styles.submitBtnDisabled : null]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Gửi yêu cầu tạo hợp đồng</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  roomCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  roomPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
    marginLeft: 12,
  },
  roomArea: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  landlordInfo: {
    fontSize: 14,
    color: "#64748b",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#dc2626",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#99f6e4",
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#0d9488",
    lineHeight: 18,
  },
  spacer: {
    height: 100,
  },
  actionBar: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 8,
  },
  submitBtn: {
    backgroundColor: "#0d9488",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: "#94a3b8",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
