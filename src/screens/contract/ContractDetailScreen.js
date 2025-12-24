import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  StatusBar,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import {
  getMyContract,
  updateMyData,
  signByTenant,
  verifyIdentity,
} from "../../api/contractApi";
import ContractTopBar from "../../components/contracts/detail/ContractTopBar";
import ContractInfoSection from "../../components/contracts/detail/ContractInfoSection";
import ContractSignatures from "../../components/contracts/detail/ContractSignatures";
import ContractTerms from "../../components/contracts/detail/ContractTerms";
import { CheckIcon } from "lucide-react-native";

const isWeb = Platform.OS === "web";

const normalizeFileUri = (uri) => {
  if (!uri || typeof uri !== "string") return uri;
  if (uri.startsWith("ph://")) return uri.replace("ph://", "assets-library://");
  if (uri.startsWith("/") && !uri.startsWith("file://")) return `file://${uri}`;
  if (Platform.OS === "android") {
    if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
      return `file://${uri}`;
    }
  }
  return uri;
};

const conditionMap = {
  good: "Tốt",
  damaged: "Hư hỏng",
  under_repair: "Đang sửa chữa",
};
const ContractDetailScreen = ({ navigation, route }) => {
  const routeId = route?.params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);

  const [payload, setPayload] = useState({ B: {}, bikes: [], roommates: [] });
  const [validationErrors, setValidationErrors] = useState({});

  // --- EKYC STATES ---
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [idImages, setIdImages] = useState({
    cccdFront: null,
    cccdBack: null,
    selfie: null,
  });

  // --- SIGNATURE STATES ---
  const [sigModalVisible, setSigModalVisible] = useState(false);
  const [sigLoading, setSigLoading] = useState(false);
  const nativeSigRef = useRef(null);

  let NativeSignature = null;
  try {
    if (!isWeb)
      NativeSignature = require("react-native-signature-canvas")?.default;
  } catch (err) {
    console.log("Signature canvas not available:", err);
  }

  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.max(screenWidth - 48, 300);

  useEffect(() => {
    if (!routeId) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Thiếu ID hợp đồng" });
      navigation.replace("Contracts");
      return;
    }
    fetchDetail(routeId);
  }, [routeId]);

  const formatDateForAPI = (dateStr) => {
    if (!dateStr || !dateStr.trim()) return "";
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return trimmed;
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr || !dateStr.toString().trim()) return "";
    const trimmed = dateStr.toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }
    return trimmed;
  };

  const fmtDate = (d) => {
    if (!d) return "--/--/----";
    if (typeof d === "string" && /^\d{2}-\d{2}-\d{4}$/.test(d))
      return d.replace(/-/g, "/");
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [year, month, day] = d.split("-");
      return `${day}/${month}/${year}`;
    }
    try {
      const date = new Date(d);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {}
    return "--/--/----";
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
  };

  const fetchDetail = async (id) => {
    setLoading(true);
    try {
      const contractRes = await getMyContract(id);
      const data = contractRes?.data || contractRes || null;
      if (!data) throw new Error("Không có dữ liệu hợp đồng");

      // Format B data from backend
      const formattedB = {
        ...data.B,
        name: data.B?.name || "",
        dob: data.B?.dob ? formatDateForDisplay(data.B.dob) : "",
        cccd: data.B?.cccd || "",
        cccdIssuedDate: data.B?.cccdIssuedDate
          ? formatDateForDisplay(data.B.cccdIssuedDate)
          : "",
        cccdIssuedPlace: data.B?.cccdIssuedPlace || "",
        phone: data.B?.phone || "",
        email: data.B?.email || "",
        permanentAddress: data.B?.permanentAddress || "",
      };

      const formattedRoommates = (data.roommates || []).map((rm) => ({
        ...rm,
        dob: formatDateForDisplay(rm.dob || ""),
        cccdIssuedDate: formatDateForDisplay(rm.cccdIssuedDate || ""),
      }));

      setContract(data);
      setPayload({
        B: formattedB,
        bikes: data.bikes || [],
        roommates: formattedRoommates,
      });
      setValidationErrors({});
    } catch (e) {
      Toast.show({ type: "error", text1: "Lỗi tải", text2: e.message });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validatePayload = () => {
    const errors = {};
    let isValid = true;
    const requiredFields = [
      "name",
      "dob",
      "cccd",
      "cccdIssuedDate",
      "cccdIssuedPlace",
      "phone",
      "permanentAddress",
    ];

    // Validate B (Chính chủ)
    requiredFields.forEach((field) => {
      if (!payload.B?.[field]?.toString().trim()) {
        errors[`B.${field}`] = `Vui lòng điền thông tin này`;
        isValid = false;
      }
    });

    // Validate Roommates (Người ở cùng) - Kiểm tra cơ bản
    if (payload.roommates && payload.roommates.length > 0) {
      payload.roommates.forEach((rm, index) => {
        if (!rm.name?.trim()) {
          errors[`roommates[${index}].name`] = "Thiếu tên";
          isValid = false;
        }
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validatePayload()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng điền đủ thông tin bắt buộc",
      });
      return;
    }
    setSaving(true);
    try {
      const cleanStr = (str) => (str ? String(str).trim() : "");

      const apiPayload = {
        ...payload,
        B: {
          ...payload.B,
          name: cleanStr(payload.B.name),
          cccd: cleanStr(payload.B.cccd),
          permanentAddress: cleanStr(payload.B.permanentAddress),
          phone: cleanStr(payload.B.phone),
          email: cleanStr(payload.B.email || contract.B?.email || ""),
          dob: formatDateForAPI(payload.B.dob),
          cccdIssuedDate: formatDateForAPI(payload.B.cccdIssuedDate),
          cccdIssuedPlace: cleanStr(payload.B.cccdIssuedPlace),
        },
        roommates: payload.roommates.map((rm) => ({
          ...rm,
          name: cleanStr(rm.name),
          cccd: cleanStr(rm.cccd),
          phone: cleanStr(rm.phone),
          email: cleanStr(rm.email),
          permanentAddress: cleanStr(rm.permanentAddress),
          dob: formatDateForAPI(rm.dob),
          cccdIssuedDate: formatDateForAPI(rm.cccdIssuedDate),
          cccdIssuedPlace: cleanStr(rm.cccdIssuedPlace),
        })),
        bikes: payload.bikes.map((bike) => ({
          ...bike,
          bikeNumber: cleanStr(bike.bikeNumber),
          brand: cleanStr(bike.brand),
          color: cleanStr(bike.color),
        })),
      };

      await updateMyData(contract._id, apiPayload);
      await fetchDetail(contract._id);

      Toast.show({
        type: "success",
        text1: "Lưu thành công",
        text2: "Thông tin đã được cập nhật.",
      });

      if (contract?.identityVerification?.status !== "verified") {
        setVerifyModalVisible(true);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Lỗi lưu", text2: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleManualAddRoommate = () => {
    setPayload((prev) => ({
      ...prev,
      roommates: [
        ...(prev.roommates || []),
        {
          name: "",
          phone: "",
          cccd: "",
          dob: "",
          permanentAddress: "",
          email: "",
          cccdIssuedDate: "",
          cccdIssuedPlace: "",
        },
      ],
    }));
  };

  const processImageResult = (result, field) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIdImages((prev) => ({ ...prev, [field]: result.assets[0].uri }));
    }
  };

  const takePhoto = async (field) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cấp quyền", "Ứng dụng cần quyền Camera để chụp ảnh.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      processImageResult(result, field);
    } catch (error) {
      console.log("Camera Error:", error);
    }
  };

  const pickFromGallery = async (field) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      processImageResult(result, field);
    } catch (error) {
      console.log("Gallery Error:", error);
    }
  };

  const handleSelectImage = (field) => {
    Alert.alert(
      "Tải ảnh lên",
      "Chọn nguồn ảnh",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Chụp ảnh", onPress: () => takePhoto(field) },
        { text: "Thư viện", onPress: () => pickFromGallery(field) },
      ],
      { cancelable: true }
    );
  };

  const onPressVerify = () => {
    const isNameDirty = payload.B.name !== contract.B.name;
    const isCccdDirty = payload.B.cccd !== contract.B.cccd;

    if (isNameDirty || isCccdDirty) {
      Alert.alert(
        "Chưa lưu thông tin",
        "Vui lòng nhấn 'Lưu thông tin' trước khi xác thực.",
        [{ text: "Đã hiểu" }]
      );
      return;
    }

    if (!validatePayload()) {
      Toast.show({ type: "error", text1: "Thiếu thông tin cá nhân" });
      return;
    }
    setVerifyModalVisible(true);
  };

  const handleVerifyIdentity = async () => {
    if (!idImages.cccdFront || !idImages.cccdBack || !idImages.selfie) {
      Toast.show({
        type: "error",
        text1: "Thiếu ảnh",
        text2: "Vui lòng tải đủ 3 ảnh",
      });
      return;
    }
    setVerifyLoading(true);
    try {
      const formData = new FormData();
      const appendFile = async (key, originalUri) => {
        if (!originalUri) return;
        let uri = normalizeFileUri(originalUri);
        let name = uri.split("/").pop();
        if (!name || !name.includes(".")) name = `photo_${Date.now()}.jpg`;
        if (/\.(heic|heif)$/i.test(name)) {
          try {
            const manipResult = await ImageManipulator.manipulateAsync(
              uri,
              [],
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            uri = manipResult.uri;
            name = name.replace(/\.(heic|heif)$/i, ".jpg");
          } catch (err) {}
        }
        formData.append(key, { uri, name, type: "image/jpeg" });
      };

      await appendFile("cccdFront", idImages.cccdFront);
      await appendFile("cccdBack", idImages.cccdBack);
      await appendFile("selfie", idImages.selfie);

      const response = await verifyIdentity(contract._id, formData);
      const result = response?.identityVerification || {};

      if (result.status === "verified") {
        setVerifyModalVisible(false);
        fetchDetail(contract._id);
        setTimeout(() => {
          Toast.show({
            type: "success",
            text1: "Xác thực thành công!",
            text2: "Thông tin B đã được khóa. Bạn có thể ký hợp đồng.",
            visibilityTime: 4000,
          });
        }, 300);
      } else {
        const reason = result.rejectedReason || "Thông tin không khớp.";
        Alert.alert("Xác thực thất bại", reason);
      }
    } catch (e) {
      Alert.alert("Lỗi", e.message || "Lỗi kết nối");
    } finally {
      setVerifyLoading(false);
    }
  };

  // Các hàm xử lý chữ ký
  const clearSignature = () => {
    if (nativeSigRef.current) {
      nativeSigRef.current.clearSignature();
    }
  };

  const handleSubmitSignature = async () => {
    if (nativeSigRef.current) {
      nativeSigRef.current.readSignature();
    }
  };

  const onSignatureOK = async (signature) => {
    const isVerified = contract?.identityVerification?.status === "verified";
    if (!isVerified) {
      Toast.show({
        type: "error",
        text1: "Chưa xác thực",
        text2: "Vui lòng eKYC trước.",
      });
      return;
    }

    setSigLoading(true);
    try {
      await signByTenant(contract._id, signature);
      Toast.show({ type: "success", text1: "Ký thành công!" });
      setSigModalVisible(false);
      fetchDetail(contract._id);
    } catch (e) {
      Toast.show({ type: "error", text1: "Lỗi ký", text2: e.message });
    } finally {
      setSigLoading(false);
    }
  };

  const onSignatureEmpty = () => {
    Toast.show({ type: "info", text1: "Vui lòng ký tên" });
  };

  const canEdit = contract?.status === "sent_to_tenant";
  const canSign =
    contract &&
    ["sent_to_tenant", "signed_by_landlord"].includes(contract.status) &&
    !contract.tenantSignatureUrl;
  const isVerified = contract?.identityVerification?.status === "verified";
  const showVerifyBtn = canEdit && !isVerified;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  if (!contract)
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy hợp đồng</Text>
      </View>
    );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ContractTopBar navigation={navigation} title="Chi tiết hợp đồng" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.officialHeader}>
            <Text style={styles.nation}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </Text>
            <Text style={styles.motto}>Độc lập - Tự do - Hạnh phúc</Text>
            <Text style={styles.contractTitle}>HỢP ĐỒNG THUÊ PHÒNG</Text>
            <Text style={styles.contractNumber}>
              Số: {contract.contract?.no || contract._id}
            </Text>
          </View>

          {Object.keys(validationErrors).length > 0 && canEdit && (
            <View style={styles.validationAlert}>
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
              <Text style={styles.validationAlertText}>
                Vui lòng kiểm tra lại thông tin nhập thiếu/sai.
              </Text>
            </View>
          )}

          <ContractInfoSection
            contract={contract}
            payload={payload}
            setPayload={setPayload}
            canEdit={canEdit}
            fmtDate={fmtDate}
            onAddRoommate={handleManualAddRoommate}
            validationErrors={validationErrors}
            identityStatus={contract?.identityVerification}
          />

          <ContractTerms contract={contract} contentWidth={contentWidth} />

          {contract.furnitures?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nội thất</Text>
              <View style={styles.furnitureList}>
                {contract.furnitures.map((item, index) => (
                  <View key={index} style={styles.furnitureItem}>
                    <Text style={styles.furnitureName}>{item.name}</Text>
                    <Text style={styles.furnitureDetails}>
                      Số lượng: {item.quantity} • Tình trạng:{" "}
                      {conditionMap[item.condition]}
                    </Text>
                    {item.notes && (
                      <Text style={styles.furnitureNotes}>
                        Ghi chú: {item.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <ContractSignatures
            contract={contract}
            payload={payload}
            canSign={canSign && isVerified}
            onOpenSign={() => setSigModalVisible(true)}
            fmtDate={fmtDate}
          />

          <View style={styles.actionSection}>
            {canEdit && (
              <>
                <TouchableOpacity
                  style={[styles.btnSave, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}>Lưu thông tin</Text>
                </TouchableOpacity>
              </>
            )}

            {showVerifyBtn && (
              <TouchableOpacity
                style={styles.btnVerify}
                onPress={onPressVerify}
              >
                <Ionicons name="scan-circle-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>Xác thực danh tính (eKYC)</Text>
              </TouchableOpacity>
            )}

            {canSign && (
              <TouchableOpacity
                style={[styles.btnSign, !isVerified && styles.btnDisabled]}
                onPress={() => {
                  if (!isVerified) {
                    Toast.show({
                      type: "info",
                      text1: "Yêu cầu",
                      text2: "Vui lòng xác thực danh tính trước khi ký.",
                    });
                    return;
                  }
                  setSigModalVisible(true);
                }}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.btnText}>
                  {!isVerified ? "Ký hợp đồng (Cần eKYC)" : "Ký hợp đồng"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={verifyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setVerifyModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Xác thực danh tính</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.verifyNote}>
              Vui lòng cung cấp ảnh CCCD và ảnh chân dung.
            </Text>
            <Text style={styles.uploadLabel}>1. CCCD Mặt trước</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleSelectImage("cccdFront")}
            >
              {idImages.cccdFront ? (
                <Image
                  source={{ uri: idImages.cccdFront }}
                  style={styles.uploadPreview}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="id-card-outline" size={32} color="#94a3b8" />
                  <Text style={styles.uploadPlaceholderText}>
                    Chụp/Chọn ảnh
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.uploadLabel}>2. CCCD Mặt sau</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleSelectImage("cccdBack")}
            >
              {idImages.cccdBack ? (
                <Image
                  source={{ uri: idImages.cccdBack }}
                  style={styles.uploadPreview}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="id-card-outline" size={32} color="#94a3b8" />
                  <Text style={styles.uploadPlaceholderText}>
                    Chụp/Chọn ảnh
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.uploadLabel}>3. Ảnh chân dung</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleSelectImage("selfie")}
            >
              {idImages.selfie ? (
                <Image
                  source={{ uri: idImages.selfie }}
                  style={styles.uploadPreview}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="#94a3b8" />
                  <Text style={styles.uploadPlaceholderText}>
                    Chụp/Chọn ảnh
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Phần Checkbox và Disclaimer */}
            <TouchableOpacity
              style={styles.disclaimerWrapper}
              activeOpacity={0.7}
              onPress={() => setIsConfirmed(!isConfirmed)}
            >
              <View
                style={[
                  styles.checkboxBase,
                  isConfirmed && styles.checkboxChecked,
                ]}
              >
                {isConfirmed && <CheckIcon size={14} color="#fff" />}
              </View>

              <Text style={styles.disclaimerText}>
                Tôi xác nhận đã cung cấp đầy đủ và chính xác thông tin căn cước
                công dân cho hệ thống. Tôi hiểu rằng thông tin này sẽ được sử
                dụng để xác thực danh tính và quản lý hợp đồng thuê phòng.
              </Text>
            </TouchableOpacity>

            {/* Nút Gửi xác thực */}
            <TouchableOpacity
              style={[
                styles.btnVerifySubmit,
                (verifyLoading || !isConfirmed) && styles.btnDisabled,
              ]}
              onPress={handleVerifyIdentity}
              disabled={verifyLoading || !isConfirmed}
              activeOpacity={0.8}
            >
              {verifyLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Gửi xác thực</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={sigModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        transparent={false}
      >
        <View style={styles.fullScreenModalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSigModalVisible(false)}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ký tên</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Signature Area */}
          <View style={styles.modalContent}>
            {!isWeb && NativeSignature ? (
              <View style={styles.signatureContainer}>
                <NativeSignature
                  ref={nativeSigRef}
                  onOK={onSignatureOK}
                  onEmpty={onSignatureEmpty}
                  clearText="Xóa"
                  confirmText="Xác nhận"
                  style={styles.signaturePad}
                />
              </View>
            ) : (
              <View style={styles.signatureContainer}>
                <View style={styles.signaturePlaceholder}>
                  <Text style={styles.placeholderText}>Vùng ký tên</Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.clearButton]}
                    onPress={clearSignature}
                  >
                    <Text style={styles.clearButtonText}>Xóa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={handleSubmitSignature}
                  >
                    <Text style={styles.confirmButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  signaturePad: {
    flex: 1,
    backgroundColor: "#fff",
  },
  signaturePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 8,
    margin: 20,
    backgroundColor: "#fafafa",
  },
  placeholderText: {
    fontSize: 18,
    color: "#888",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fafafa",
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  officialHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  nation: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#000",
  },
  motto: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#000" },
  contractTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    color: "#000",
  },
  contractNumber: { fontSize: 12, color: "#666", fontStyle: "italic" },
  validationAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  validationAlertText: {
    flex: 1,
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
  },
  actionSection: { marginTop: 20, gap: 12 },
  btnSave: {
    backgroundColor: "#0d9488",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSign: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnVerify: {
    backgroundColor: "#0891b2",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnVerifySubmit: {
    backgroundColor: "#0891b2",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.6, backgroundColor: "#94a3b8" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalContent: { flex: 1, padding: 16 },
  signatureContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#0f172a",
  },
  roomInfoGrid: {
    gap: 12,
  },
  roomInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  roomInfoLabel: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  roomInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
    flex: 1,
  },
  roomInfoSubValue: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 2,
  },
  contractInfoGrid: {
    gap: 12,
  },
  contractInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  contractInfoLabel: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  contractInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
    flex: 1,
  },
  furnitureList: {
    marginTop: 8,
  },
  furnitureItem: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  furnitureName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  furnitureDetails: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  furnitureNotes: {
    fontSize: 12,
    color: "#dc2626",
    fontStyle: "italic",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  verifyNote: { fontSize: 14, color: "#475569", marginBottom: 20 },
  uploadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
    marginTop: 4,
  },
  uploadBox: {
    height: 160,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  disclaimerWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#475569",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    textAlign: "left",
  },
  uploadPlaceholder: { alignItems: "center", justifyContent: "center" },
  uploadPlaceholderText: { marginTop: 8, color: "#64748b", fontSize: 13 },
  uploadPreview: { width: "100%", height: "100%" },
});

export default ContractDetailScreen;
