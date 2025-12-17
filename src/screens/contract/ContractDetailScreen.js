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
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  getMyContract,
  updateMyData,
  signByTenant,
  searchAccountByEmail,
} from "../../api/contractApi";

import ContractTopBar from "../../components/contracts/detail/ContractTopBar";
import ContractInfoSection from "../../components/contracts/detail/ContractInfoSection";
import ContractSignatures from "../../components/contracts/detail/ContractSignatures";
import ContractTerms from "../../components/contracts/detail/ContractTerms";

const isWeb = Platform.OS === "web";

const ContractDetailScreen = ({ navigation, route }) => {
  const routeId = route?.params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);
  const [payload, setPayload] = useState({ B: {}, bikes: [], roommates: [] });
  const [validationErrors, setValidationErrors] = useState({});

  // Signature
  const [sigModalVisible, setSigModalVisible] = useState(false);
  const [sigLoading, setSigLoading] = useState(false);
  const nativeSigRef = useRef(null);
  const webSigRef = useRef(null);

  let NativeSignature = null;
  let WebSignature = null;
  try {
    if (!isWeb) {
      NativeSignature = require("react-native-signature-canvas")?.default;
    } else {
      WebSignature = require("react-signature-canvas")?.default;
    }
  } catch (err) {}

  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.max(screenWidth - 48, 300);

  useEffect(() => {
    if (!routeId) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không có ID hợp đồng",
      });
      navigation.replace("Contracts");
      return;
    }
    fetchDetail(routeId);
  }, [routeId]);

  const formatDateForAPI = (dateStr) => {
    if (!dateStr || !dateStr.trim()) return "";

    const trimmed = dateStr.trim();

    // Nếu đã là YYYY-MM-DD thì giữ nguyên
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Nếu là DD-MM-YYYY thì chuyển đổi
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("-");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Nếu có dấu / thì chuyển đổi từ DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    } catch (e) {}

    return trimmed;
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr || !dateStr.toString().trim()) return "";

    const trimmed = dateStr.toString().trim();

    // Nếu là YYYY-MM-DD thì chuyển đổi
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split("-");
      return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }

    // Nếu đã là DD-MM-YYYY thì giữ nguyên
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Nếu là DD/MM/YYYY thì đổi thành DD-MM-YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed.replace(/\//g, "-");
    }

    // Try to parse Date object
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (e) {}

    return trimmed;
  };

  // Hàm format date cho hiển thị (DD/MM/YYYY)
  const fmtDate = (d) => {
    if (!d) return "--/--/----";

    // Nếu là string DD-MM-YYYY
    if (typeof d === "string" && /^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [day, month, year] = d.split("-");
      return `${day}/${month}/${year}`;
    }

    // Nếu là string YYYY-MM-DD
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

  const fetchDetail = async (id) => {
    setLoading(true);
    try {
      const doc = await getMyContract(id);
      const data = doc?.data || doc || null;
      if (!data) throw new Error("Không có dữ liệu hợp đồng");
      const bikes = Array.isArray(data.bikes) ? data.bikes : [];
      const roommates = Array.isArray(data.roommates) ? data.roommates : [];
      const B = data.B || {};

      const formattedB = { ...B };
      if (formattedB.dob) {
        formattedB.dob = formatDateForDisplay(formattedB.dob);
      }
      if (formattedB.cccdIssuedDate) {
        formattedB.cccdIssuedDate = formatDateForDisplay(
          formattedB.cccdIssuedDate
        );
      }

      const formattedRoommates = roommates.map((rm) => ({
        ...rm,
        dob: formatDateForDisplay(rm.dob),
        cccdIssuedDate: formatDateForDisplay(rm.cccdIssuedDate),
      }));

      setContract(data);
      setPayload({
        B: formattedB,
        bikes: [...bikes],
        roommates: [...formattedRoommates],
      });
      setValidationErrors({});
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải hợp đồng",
        text2: e?.response?.data?.message || e.message || "Không thể tải",
      });
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

    requiredFields.forEach((field) => {
      if (!payload.B?.[field]?.toString().trim()) {
        errors[`B.${field}`] = `Vui lòng điền ${getFieldLabel(field)}`;
        isValid = false;
      }
    });

    if (payload.B?.dob && payload.B.dob.trim()) {
      const dateRegex = /^(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})$/;
      if (!dateRegex.test(payload.B.dob.trim())) {
        errors["B.dob"] =
          "Định dạng ngày không hợp lệ (DD-MM-YYYY hoặc YYYY-MM-DD)";
        isValid = false;
      }
    }

    if (payload.B?.cccdIssuedDate && payload.B.cccdIssuedDate.trim()) {
      const dateRegex = /^(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})$/;
      if (!dateRegex.test(payload.B.cccdIssuedDate.trim())) {
        errors["B.cccdIssuedDate"] =
          "Định dạng ngày không hợp lệ (DD-MM-YYYY hoặc YYYY-MM-DD)";
        isValid = false;
      }
    }

    if (payload.B?.cccd && payload.B.cccd.trim()) {
      const cccdValue = payload.B.cccd.trim();
      if (!/^\d{12}$/.test(cccdValue)) {
        errors["B.cccd"] = "CCCD phải có 12 số";
        isValid = false;
      }
    }

    if (payload.B?.phone && payload.B.phone.trim()) {
      const phoneValue = payload.B.phone.trim();
      if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(phoneValue)) {
        errors["B.phone"] =
          "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
        isValid = false;
      }
    }

    // Validate từng xe trong danh sách
    if (payload.bikes && payload.bikes.length > 0) {
      payload.bikes.forEach((bike, index) => {
        if (!bike.bikeNumber?.trim()) {
          errors[`bikes[${index}].bikeNumber`] = "Vui lòng nhập biển số";
          isValid = false;
        }
        if (!bike.brand?.trim()) {
          errors[`bikes[${index}].brand`] = "Vui lòng nhập loại xe";
          isValid = false;
        }
        if (!bike.color?.trim()) {
          errors[`bikes[${index}].color`] = "Vui lòng nhập màu xe";
          isValid = false;
        }
      });
    }

    // Validate từng người ở cùng
    if (payload.roommates && payload.roommates.length > 0) {
      payload.roommates.forEach((rm, index) => {
        if (!rm.name?.trim()) {
          errors[`roommates[${index}].name`] = "Vui lòng nhập họ tên";
          isValid = false;
        }
        if (!rm.phone?.trim()) {
          errors[`roommates[${index}].phone`] = "Vui lòng nhập số điện thoại";
          isValid = false;
        } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(rm.phone.trim())) {
          errors[`roommates[${index}].phone`] =
            "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
          isValid = false;
        }
        if (!rm.cccd?.trim()) {
          errors[`roommates[${index}].cccd`] = "Vui lòng nhập CCCD";
          isValid = false;
        } else if (!/^\d{12}$/.test(rm.cccd.trim())) {
          errors[`roommates[${index}].cccd`] = "CCCD phải có 12 số";
          isValid = false;
        }
        if (rm.dob && rm.dob.trim()) {
          const dateRegex =
            /^(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})$/;
          if (!dateRegex.test(rm.dob.trim())) {
            errors[`roommates[${index}].dob`] =
              "Định dạng ngày sinh không hợp lệ";
            isValid = false;
          }
        }
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Helper để lấy label cho field
  const getFieldLabel = (field) => {
    const labels = {
      name: "họ tên",
      dob: "ngày sinh",
      cccd: "số CCCD",
      cccdIssuedDate: "ngày cấp CCCD",
      cccdIssuedPlace: "nơi cấp CCCD",
      phone: "số điện thoại",
      permanentAddress: "địa chỉ thường trú",
      email: "email",
    };
    return labels[field] || field;
  };

  const getFurnitureCondition = (condition) => {
    const conditions = {
      new: "Mới",
      good: "Tốt",
      normal: "Bình thường",
      damaged: "Hư hỏng",
      broken: "Hỏng nặng",
    };
    return conditions[condition] || condition;
  };

  const handleSave = async () => {
    if (!contract) return;

    if (!validatePayload()) {
      Toast.show({
        type: "error",
        text1: "Vui lòng điền đầy đủ thông tin",
        text2: "Có trường bắt buộc chưa được điền hoặc sai định dạng",
      });
      return;
    }

    setSaving(true);
    try {
      const apiPayload = {
        ...payload,
        B: {
          ...payload.B,
          dob: formatDateForAPI(payload.B.dob),
          cccdIssuedDate: formatDateForAPI(payload.B.cccdIssuedDate),
          email: payload.B.email || contract.B?.email || "",
        },
        roommates: payload.roommates.map((rm) => ({
          ...rm,
          dob: formatDateForAPI(rm.dob),
          cccdIssuedDate: formatDateForAPI(rm.cccdIssuedDate),
        })),
      };

      const updated = await updateMyData(contract._id, apiPayload);
      const newDoc = updated?.data || updated || {};

      const formattedB = { ...newDoc.B };
      if (formattedB.dob) {
        formattedB.dob = formatDateForDisplay(formattedB.dob);
      }
      if (formattedB.cccdIssuedDate) {
        formattedB.cccdIssuedDate = formatDateForDisplay(
          formattedB.cccdIssuedDate
        );
      }

      const formattedRoommates = (newDoc.roommates || []).map((rm) => ({
        ...rm,
        dob: formatDateForDisplay(rm.dob),
        cccdIssuedDate: formatDateForDisplay(rm.cccdIssuedDate),
      }));

      setContract({ ...newDoc, B: formattedB, roommates: formattedRoommates });
      setPayload((prev) => ({
        ...prev,
        B: formattedB,
        roommates: formattedRoommates,
      }));
      setValidationErrors({});
      Toast.show({ type: "success", text1: "Đã lưu thông tin" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lưu thất bại",
        text2: e?.response?.data?.message || e.message || "Đã xảy ra lỗi",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitSignature = async (dataURL) => {
    if (!contract) return;

    if (!validatePayload()) {
      Toast.show({
        type: "error",
        text1: "Không thể ký",
        text2: "Vui lòng điền đầy đủ thông tin bắt buộc trước khi ký",
      });
      return;
    }
    try {
      const apiPayload = {
        ...payload,
        B: {
          ...payload.B,
          dob: formatDateForAPI(payload.B.dob),
          cccdIssuedDate: formatDateForAPI(payload.B.cccdIssuedDate),
          email: payload.B.email || contract.B?.email || "",
        },
        roommates: payload.roommates.map((rm) => ({
          ...rm,
          dob: formatDateForAPI(rm.dob),
          cccdIssuedDate: formatDateForAPI(rm.cccdIssuedDate),
        })),
      };

      await updateMyData(contract._id, apiPayload);
      const newDoc = await getMyContract(contract._id);
      const data = newDoc?.data || newDoc;

      const formattedB = { ...data.B };
      if (formattedB.dob) {
        formattedB.dob = formatDateForDisplay(formattedB.dob);
      }
      if (formattedB.cccdIssuedDate) {
        formattedB.cccdIssuedDate = formatDateForDisplay(
          formattedB.cccdIssuedDate
        );
      }

      const formattedRoommates = (data.roommates || []).map((rm) => ({
        ...rm,
        dob: formatDateForDisplay(rm.dob),
        cccdIssuedDate: formatDateForDisplay(rm.cccdIssuedDate),
      }));

      setContract({ ...data, B: formattedB, roommates: formattedRoommates });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lưu thông tin thất bại",
        text2:
          e?.response?.data?.message ||
          e.message ||
          "Không thể ký khi thông tin chưa được lưu",
      });
      return;
    }

    setSigLoading(true);
    try {
      await signByTenant(contract._id, dataURL);
      Toast.show({ type: "success", text1: "Ký thành công!" });
      setSigModalVisible(false);
      fetchDetail(contract._id);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Ký thất bại",
        text2: e?.response?.data?.message || e.message || "Đã xảy ra lỗi",
      });
    } finally {
      setSigLoading(false);
    }
  };

  const handleWebConfirm = () => {
    if (!webSigRef.current?.getTrimmedCanvas) return;
    const dataURL = webSigRef.current.getTrimmedCanvas().toDataURL("image/png");
    submitSignature(dataURL);
  };
  const clearWebPad = () => webSigRef.current?.clear();

  const handleSearchByEmail = () => {
    if (Platform.OS === "ios" && Alert.prompt) {
      Alert.prompt(
        "Tìm người ở cùng theo email",
        "Nhập email tài khoản người thuê khác",
        async (email) => {
          if (!email?.trim()) return;
          await searchAndAddRoommate(email.trim());
        },
        "plain-text",
        "",
        "email-address"
      );
    } else {
      if (isWeb && typeof window !== "undefined" && window.prompt) {
        const email = window.prompt("Nhập email tài khoản người thuê khác");
        if (email) searchAndAddRoommate(email.trim());
      } else {
        Toast.show({
          type: "info",
          text1: "Chức năng chỉ hỗ trợ trên iOS/Web",
          text2: "Trên Android, vui lòng thêm người ở cùng thủ công.",
        });
      }
    }
  };

  const searchAndAddRoommate = async (email) => {
    try {
      const data = await searchAccountByEmail(email.toLowerCase());
      Alert.alert(
        "Tìm thấy tài khoản",
        `${data.fullName}\n${data.email}\n${data.phoneNumber || ""}`,
        [
          {
            text: "Thêm làm roommate",
            onPress: () => {
              const newRm = {
                name: data.fullName || "",
                phone: data.phoneNumber || "",
                email: data.email || "",
                permanentAddress: data.address || "",
                dob: data.dob ? formatDateForDisplay(data.dob) : "",
                cccd: "",
                cccdIssuedDate: "",
                cccdIssuedPlace: "",
              };
              setPayload((prev) => ({
                ...prev,
                roommates: [...(prev.roommates || []), newRm],
              }));
              Toast.show({ type: "success", text1: "Đã thêm người ở cùng" });
            },
          },
          { text: "Hủy", style: "cancel" },
        ]
      );
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Không tìm thấy",
        text2: err?.response?.data?.message || "Email không tồn tại",
      });
    }
  };

  const canEdit = contract?.status === "sent_to_tenant";
  const canSign =
    contract &&
    ["sent_to_tenant", "signed_by_landlord"].includes(contract.status) &&
    !contract.tenantSignatureUrl;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={{ marginTop: 12, color: "#64748b" }}>
          Đang tải hợp đồng...
        </Text>
      </View>
    );

  if (!contract)
    return (
      <View style={styles.center}>
        <Ionicons name="document-outline" size={48} color="#94a3b8" />
        <Text style={{ marginTop: 12, color: "#64748b" }}>
          Không tìm thấy hợp đồng
        </Text>
        <TouchableOpacity
          style={[styles.btnSave, { marginTop: 20 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Quay lại</Text>
        </TouchableOpacity>
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
          {/* header info */}
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
                Vui lòng điền đầy đủ tất cả thông tin bắt buộc trước khi lưu
                hoặc ký
              </Text>
            </View>
          )}

          {/* Sections split into components */}
          <ContractInfoSection
            contract={contract}
            payload={payload}
            setPayload={setPayload}
            canEdit={canEdit}
            fmtDate={fmtDate}
            onAddRoommate={handleSearchByEmail}
            validationErrors={validationErrors}
          />

          <ContractTerms contract={contract} contentWidth={contentWidth} />

          {contract.furnitures && contract.furnitures.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đồ nội thất đi kèm</Text>
              <View style={styles.furnitureContainer}>
                {contract.furnitures.map((furniture, index) => (
                  <View key={index} style={styles.furnitureItem}>
                    <View style={styles.furnitureHeader}>
                      <Text style={styles.furnitureName}>
                        {furniture.name || "Nội thất không tên"}
                      </Text>
                      <View
                        style={[
                          styles.conditionBadge,
                          furniture.condition === "new" && styles.conditionNew,
                          furniture.condition === "good" &&
                            styles.conditionGood,
                          furniture.condition === "normal" &&
                            styles.conditionNormal,
                          furniture.condition === "damaged" &&
                            styles.conditionDamaged,
                          furniture.condition === "broken" &&
                            styles.conditionBroken,
                        ]}
                      >
                        <Text style={styles.conditionText}>
                          {getFurnitureCondition(furniture.condition)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.furnitureDetails}>
                      <Text style={styles.furnitureDetail}>
                        <Text style={styles.detailLabel}>Số lượng: </Text>
                        {furniture.quantity || 1}
                      </Text>
                      {furniture.damageCount > 0 && (
                        <Text
                          style={[styles.furnitureDetail, styles.damageText]}
                        >
                          <Text style={styles.detailLabel}>Số chỗ hư: </Text>
                          {furniture.damageCount}
                        </Text>
                      )}
                      {furniture.notes && (
                        <Text style={styles.furnitureDetail}>
                          <Text style={styles.detailLabel}>Ghi chú: </Text>
                          {furniture.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <ContractSignatures
            contract={contract}
            payload={payload}
            canSign={canSign}
            onOpenSign={() => {
              if (!validatePayload()) {
                Toast.show({
                  type: "error",
                  text1: "Không thể ký",
                  text2: "Vui lòng điền đầy đủ thông tin bắt buộc trước",
                });
                return;
              }
              setSigModalVisible(true);
            }}
            fmtDate={fmtDate}
          />

          {/* Action buttons (save/add/sign) */}
          <View style={styles.actionSection}>
            {canEdit && (
              <>
                <TouchableOpacity
                  style={[styles.btnSave, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#fff" />
                      <Text style={styles.btnText}>Lưu thông tin</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnAddRoommate}
                  onPress={handleSearchByEmail}
                >
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.btnText}>Thêm người ở cùng</Text>
                </TouchableOpacity>
              </>
            )}

            {canSign && (
              <TouchableOpacity
                style={styles.btnSign}
                onPress={() => {
                  if (!validatePayload()) {
                    Toast.show({
                      type: "error",
                      text1: "Không thể ký",
                      text2: "Vui lòng điền đầy đủ thông tin bắt buộc trước",
                    });
                    return;
                  }
                  setSigModalVisible(true);
                }}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.btnText}>Ký hợp đồng</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Signature Modal */}
      <Modal
        visible={sigModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setSigModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ký tên của bạn</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.modalContent}>
            {isWeb &&
              typeof require !== "undefined" &&
              (() => {
                try {
                  const WebSignature =
                    require("react-signature-canvas")?.default;
                  return (
                    <>
                      <View style={styles.signatureContainer}>
                        <WebSignature
                          ref={webSigRef}
                          canvasProps={{
                            style: {
                              width: "100%",
                              height: 300,
                              border: "1px solid #ddd",
                              borderRadius: 8,
                              backgroundColor: "#f9fafb",
                            },
                          }}
                        />
                      </View>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalBtnSecondary}
                          onPress={clearWebPad}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#64748b"
                          />
                          <Text style={styles.modalBtnSecondaryText}>Xóa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modalBtnPrimary,
                            sigLoading && styles.btnDisabled,
                          ]}
                          onPress={handleWebConfirm}
                          disabled={sigLoading}
                        >
                          {sigLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color="#fff"
                              />
                              <Text style={styles.modalBtnPrimaryText}>
                                Xác nhận ký
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                } catch (err) {
                  return (
                    <View style={styles.notSupportedContainer}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#94a3b8"
                      />
                      <Text style={styles.notSupportedText}>
                        Không hỗ trợ ký trên nền Web này
                      </Text>
                    </View>
                  );
                }
              })()}

            {!isWeb &&
              typeof require !== "undefined" &&
              (() => {
                try {
                  const NativeSignature =
                    require("react-native-signature-canvas")?.default;
                  return NativeSignature ? (
                    <View style={styles.nativeSignatureContainer}>
                      <NativeSignature
                        ref={nativeSigRef}
                        onOK={submitSignature}
                        onEmpty={() =>
                          Toast.show({ type: "info", text1: "Vui lòng ký tên" })
                        }
                        clearText="Xóa"
                        confirmText="Xác nhận ký"
                        autoClear={false}
                        descriptionText=""
                        webStyle={`
                          .m-signature-pad {
                            box-shadow: none;
                            border: 1px solid #e2e8f0;
                            border-radius: 8px;
                            background-color: #f9fafb;
                          }
                          .m-signature-pad--body {
                            border: none;
                          }
                        `}
                      />
                    </View>
                  ) : null;
                } catch (err) {
                  return (
                    <View style={styles.notSupportedContainer}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#94a3b8"
                      />
                      <Text style={styles.notSupportedText}>
                        Không hỗ trợ ký trên thiết bị này
                      </Text>
                    </View>
                  );
                }
              })()}
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    marginBottom: 4,
  },
  motto: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    color: "#000",
    textAlign: "center",
  },
  contractNumber: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 13,
  },
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
  actionSection: {
    marginTop: 20,
    gap: 12,
  },
  btnSave: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnAddRoommate: {
    backgroundColor: "#7c2d12",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSign: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDownload: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  signatureContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },
  nativeSignatureContainer: {
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: "#0d9488",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalBtnPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalBtnSecondaryText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 14,
  },
  notSupportedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notSupportedText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    marginTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
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
  furnitureContainer: {
    marginTop: 8,
  },
  furnitureItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  furnitureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  furnitureName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
  },
  conditionNew: {
    backgroundColor: "#dcfce7",
  },
  conditionGood: {
    backgroundColor: "#dbeafe",
  },
  conditionNormal: {
    backgroundColor: "#fef3c7",
  },
  conditionDamaged: {
    backgroundColor: "#fee2e2",
  },
  conditionBroken: {
    backgroundColor: "#fca5a5",
  },
  conditionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1f2937",
  },
  furnitureDetails: {
    marginTop: 4,
  },
  furnitureDetail: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#64748b",
  },
  damageText: {
    color: "#dc2626",
  },
});

export default ContractDetailScreen;
