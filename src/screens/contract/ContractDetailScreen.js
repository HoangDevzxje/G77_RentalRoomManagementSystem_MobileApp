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

  const fetchDetail = async (id) => {
    setLoading(true);
    try {
      const doc = await getMyContract(id);
      const data = doc?.data || doc || null;
      if (!data) throw new Error("Không có dữ liệu hợp đồng");
      const bikes = Array.isArray(data.bikes) ? data.bikes : [];
      const roommates = Array.isArray(data.roommates) ? data.roommates : [];
      const B = data.B || {};
      setContract(data);
      setPayload({
        B: { ...(B || {}) },
        bikes: [...bikes],
        roommates: [...roommates],
      });
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

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);
    try {
      const updated = await updateMyData(contract._id, payload);
      const newDoc = updated?.data || updated || {};
      setContract(newDoc);
      Toast.show({ type: "success", text1: "Đã lưu thông tin" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lưu thất bại",
        text2: e?.response?.data?.message || e.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const submitSignature = async (dataURL) => {
    if (!contract) return;
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
        text2: e?.response?.data?.message || e.message,
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
        "plain-text"
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
                dob: data.dob || null,
                cccd: "",
                cccdIssuedDate: null,
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

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "--/--/----";

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

      <ScrollView contentContainerStyle={styles.container}>
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

          {/* Sections split into components */}
          <ContractInfoSection
            contract={contract}
            payload={payload}
            setPayload={setPayload}
            canEdit={canEdit}
            fmtDate={fmtDate}
            onAddRoommate={handleSearchByEmail}
          />

          <ContractTerms contract={contract} contentWidth={contentWidth} />

          <ContractSignatures
            contract={contract}
            payload={payload}
            canSign={canSign}
            onOpenSign={() => setSigModalVisible(true)}
            fmtDate={fmtDate}
          />

          {/* Action buttons (save/add/sign) */}
          <View style={styles.actionSection}>
            {canEdit && (
              <>
                <TouchableOpacity
                  style={styles.btnSave}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.btnText}>
                    {saving ? "Đang lưu..." : "Lưu thông tin"}
                  </Text>
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
                onPress={() => setSigModalVisible(true)}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.btnText}>Ký hợp đồng</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Signature Modal */}
      <Modal visible={sigModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSigModalVisible(false)}>
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
                      <WebSignature
                        ref={webSigRef}
                        canvasProps={{
                          style: {
                            width: "100%",
                            height: 300,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                          },
                        }}
                      />
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalBtnSecondary}
                          onPress={clearWebPad}
                        >
                          <Text>Xóa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.modalBtnPrimary}
                          onPress={handleWebConfirm}
                          disabled={sigLoading}
                        >
                          <Text style={{ color: "#fff" }}>
                            {sigLoading ? "Đang gửi..." : "Xác nhận ký"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                } catch (err) {
                  return (
                    <Text style={styles.notSupportedText}>
                      Không hỗ trợ ký trên nền Web này
                    </Text>
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
                    <NativeSignature
                      ref={nativeSigRef}
                      onOK={submitSignature}
                      onEmpty={() =>
                        Toast.show({ type: "info", text1: "Vui lòng ký tên" })
                      }
                      clearText="Xóa"
                      confirmText="Xác nhận"
                      autoClear={false}
                    />
                  ) : null;
                } catch (err) {
                  return (
                    <Text style={styles.notSupportedText}>
                      Không hỗ trợ ký trên thiết bị này
                    </Text>
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

const getStatusColor = (status) => {
  switch (status) {
    case "draft":
      return { color: "#6b7280", text: "Bản nháp", bgColor: "#f3f4f6" };
    case "sent_to_tenant":
      return { color: "#f59e0b", text: "Chờ ký", bgColor: "#fef3c7" };
    case "signed_by_tenant":
      return { color: "#3b82f6", text: "Đã ký - Chờ chủ", bgColor: "#dbeafe" };
    case "signed_by_landlord":
      return { color: "#3b82f6", text: "Đã ký - Chờ bạn", bgColor: "#dbeafe" };
    case "completed":
      return { color: "#10b981", text: "Hoàn thành", bgColor: "#d1fae5" };
    case "voided":
      return { color: "#ef4444", text: "Đã huỷ", bgColor: "#fee2e2" };
    case "terminated":
      return { color: "#dc2626", text: "Đã chấm dứt", bgColor: "#fef2f2" };
    default:
      return {
        color: "#6b7280",
        text: status || "Không xác định",
        bgColor: "#f3f4f6",
      };
  }
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: 16, paddingBottom: 32 },
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
  motto: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: "#000" },
  contractTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    color: "#000",
    textAlign: "center",
  },
  contractNumber: { fontSize: 12, color: "#666", fontStyle: "italic" },
  statusSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginRight: 10,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontWeight: "700", fontSize: 13 },
  dateRow: { flexDirection: "row", alignItems: "center" },
  dateText: { marginLeft: 8, color: "#64748b", fontSize: 14 },
  actionSection: { marginTop: 20, gap: 12 },
  btnSave: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
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
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  modalContent: { flex: 1, padding: 16 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: "#0d9488",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notSupportedText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    marginTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});

export default ContractDetailScreen;
