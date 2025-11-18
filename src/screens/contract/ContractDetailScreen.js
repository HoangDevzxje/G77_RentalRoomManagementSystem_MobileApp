import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  getMyContract,
  updateMyData,
  signByTenant,
  requestExtend,
  searchAccountByEmail,
} from "../../api/contractApi";

const isWeb = Platform.OS === "web";

const ContractDetailScreen = ({ navigation, route }) => {
  const routeId = route?.params?.id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);
  const [payload, setPayload] = useState({ B: {}, bikes: [], roommates: [] });
  const [sigModalVisible, setSigModalVisible] = useState(false);
  const [sigLoading, setSigLoading] = useState(false);

  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [extendMonths, setExtendMonths] = useState("");
  const [extendNote, setExtendNote] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);

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

  const handleBack = () => {
    try {
      if (navigation?.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Contracts");
      }
    } catch {
      navigation.navigate("Contracts");
    }
  };

  useEffect(() => {
    // removed navigation.setOptions to avoid duplicate native header
    if (!routeId) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không tìm thấy ID hợp đồng.",
      });
      return;
    }
    fetchDetail(routeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  const fetchDetail = async (idToFetch) => {
    setLoading(true);
    try {
      const doc = await getMyContract(idToFetch);
      const data = doc?.data ?? doc;
      setContract(data);
      setPayload({
        B: data?.B || {},
        bikes: Array.isArray(data?.bikes) ? data.bikes : [],
        roommates: Array.isArray(data?.roommates) ? data.roommates : [],
      });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi tải chi tiết",
        text2: e?.response?.data?.message || e?.message || "Lỗi",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);
    try {
      const updated = await updateMyData(contract._id, payload);
      const data = updated?.data ?? updated;
      setContract(data);
      Toast.show({ type: "success", text1: "Lưu thành công" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: e?.response?.data?.message || e?.message || "Lưu thất bại",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureOK_native = async (dataURL) => {
    await submitSignatureDataUrl(dataURL);
  };

  const handleSignatureEmpty = () => {
    Toast.show({ type: "info", text1: "Chưa có chữ ký" });
  };

  const submitSignatureDataUrl = async (signatureDataURL) => {
    setSigLoading(true);
    try {
      await signByTenant(contract._id, signatureDataURL);
      Toast.show({ type: "success", text1: "Ký hợp đồng thành công" });
      setSigModalVisible(false);
      await fetchDetail(contract._id);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Ký thất bại",
        text2: e?.response?.data?.message || e?.message || "Lỗi",
      });
    } finally {
      setSigLoading(false);
    }
  };

  const handleWebConfirm = async () => {
    if (!webSigRef.current) {
      Toast.show({ type: "error", text1: "Canvas chưa sẵn sàng" });
      return;
    }
    try {
      setSigLoading(true);
      const dataUrl = webSigRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      await submitSignatureDataUrl(dataUrl);
    } catch (e) {
      Toast.show({ type: "error", text1: "Lỗi lấy chữ ký" });
    } finally {
      setSigLoading(false);
    }
  };

  const clearWebPad = () => {
    webSigRef.current && webSigRef.current.clear();
  };

  const openSignature = () => setSigModalVisible(true);

  const openExtendModal = () => {
    setExtendMonths("");
    setExtendNote("");
    setExtendModalVisible(true);
  };

  const closeExtendModal = () => {
    if (!extendLoading) setExtendModalVisible(false);
  };

  const submitExtend = async () => {
    const months = Number(extendMonths);
    if (!months || months <= 0) {
      Toast.show({ type: "error", text1: "Số tháng không hợp lệ" });
      return;
    }
    setExtendLoading(true);
    try {
      await requestExtend(contract._id, months, extendNote || "");
      Toast.show({ type: "success", text1: "Yêu cầu gia hạn đã được gửi" });
      setExtendModalVisible(false);
      await fetchDetail(contract._id);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Gửi yêu cầu thất bại",
        text2: e?.response?.data?.message || e?.message || "Thất bại",
      });
    } finally {
      setExtendLoading(false);
    }
  };

  const handleRequestExtend = () => {
    openExtendModal();
  };

  const canEdit = contract?.status === "sent_to_tenant";

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  };

  const WebSignatureComponent = WebSignature;

  const promptInput = (title, placeholder, callback) => {
    if (Platform.OS === "ios" && Alert.prompt) {
      Alert.prompt(title, placeholder, callback, "plain-text");
      return;
    }
    if (
      isWeb &&
      typeof window !== "undefined" &&
      typeof window.prompt === "function"
    ) {
      const res = window.prompt(`${title}\n${placeholder}`);
      callback(res);
      return;
    }
    Alert.alert(title, placeholder, [{ text: "Đóng" }]);
  };

  const handleSearchByEmail = async () => {
    promptInput(
      "Tìm tài khoản theo email",
      "Nhập email để tìm",
      async (email) => {
        if (!email) return;
        const normalized = String(email).trim().toLowerCase();
        try {
          const data = await searchAccountByEmail(normalized);
          Alert.alert(
            "Tài khoản tìm thấy",
            `${data.fullName || "(không tên)"}\n${data.email}\n${
              data.phoneNumber || ""
            }`,
            [
              {
                text: "Thêm làm roommate",
                onPress: () => {
                  const newRoommate = {
                    name: data.fullName || "",
                    dob: data.dob || null,
                    cccd: "",
                    cccdIssuedDate: null,
                    cccdIssuedPlace: "",
                    permanentAddress: data.address || "",
                    phone: data.phoneNumber || "",
                    email: data.email || "",
                  };
                  setPayload((prev) => ({
                    ...prev,
                    roommates: [...(prev.roommates || []), newRoommate],
                  }));
                  Toast.show({
                    type: "success",
                    text1: "Đã thêm người ở cùng",
                  });
                },
              },
              { text: "Đóng", style: "cancel" },
            ]
          );
        } catch (err) {
          Toast.show({
            type: "error",
            text1: "Không tìm thấy",
            text2:
              err?.response?.data?.message ||
              err?.message ||
              "Không tìm thấy email",
          });
        }
      }
    );
  };

  // helper: always render a labeled row; if editable -> show TextInput bound to payload
  const renderInfoRow = (label, value, editable = false, onChangeText) => {
    const display = value === null || value === undefined ? "" : String(value);
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        {editable ? (
          <TextInput
            style={styles.textInput}
            value={display}
            onChangeText={onChangeText}
            placeholder=""
          />
        ) : (
          <Text style={styles.infoValue}>{display}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#64748b" }}>Không có chi tiết hợp đồng</Text>
      </View>
    );
  }

  // safe getters to avoid crashes when nested props missing
  const landlordName =
    contract?.landlordId?.userInfo?.fullName ||
    contract?.landlordId?.email ||
    "";
  const landlordEmail = contract?.landlordId?.email || "";
  const landlordAddress = contract?.buildingId?.address || "";

  const tenantName =
    payload?.B?.name || contract?.B?.name || contract?.tenantName || "";
  const tenantPhone = payload?.B?.phone || contract?.B?.phone || "";
  const tenantAddress =
    payload?.B?.permanentAddress || contract?.B?.permanentAddress || "";

  const buildingName = contract?.buildingId?.name || "";
  const roomNumber = contract?.roomId?.roomNumber || "";
  const roomPrice = contract?.roomId?.price || "";
  const deposit = contract?.contract?.deposit || "";

  const roommatesList = payload?.roommates || [];
  const furnituresList = contract?.furnitures || [];

  return (
    <View style={styles.screen}>
      {/* Header changed: match other screens (status bar padding + centered title) */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.topBack}>
          <Ionicons name="arrow-back" size={22} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Chi tiết hợp đồng</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 12 }}
      >
        <View style={styles.card}>
          <View style={styles.officialHeader}>
            <Text style={styles.nation}>
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </Text>
            <Text style={styles.motto}>Độc lập - Tự do - Hạnh phúc</Text>
            <Text style={styles.motto}>--------</Text>
            <Text style={styles.contractTitle}>HỢP ĐỒNG THUÊ PHÒNG TRỌ</Text>
            <Text style={styles.contractNumber}>
              (Số: {contract?.contract?.no || contract?._id})
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Thông tin hợp đồng</Text>

            {renderInfoRow(
              "Ngày ký",
              contract?.contract?.signDate || contract?.createdAt
                ? fmtDate(contract.contract?.signDate || contract.createdAt)
                : ""
            )}

            {renderInfoRow(
              "Hiệu lực",
              contract?.contract?.startDate || contract?.contract?.endDate
                ? `${fmtDate(contract.contract?.startDate)} - ${fmtDate(
                    contract.contract?.endDate
                  )}`
                : ""
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <View
                style={[
                  styles.statusBadge,
                  contract?.status === "completed"
                    ? styles.statusCompleted
                    : styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>
                  {contract?.status === "sent_to_tenant"
                    ? "Chờ ký"
                    : contract?.status === "completed"
                    ? "Đã hoàn tất"
                    : contract?.status || ""}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Bên cho thuê (Bên A)</Text>

            {renderInfoRow("Họ tên", landlordName)}
            {renderInfoRow("Email", landlordEmail)}
            {renderInfoRow("Địa chỉ", landlordAddress)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Bên thuê (Bên B)</Text>

            {/* if canEdit show inputs bound to payload, otherwise show values */}
            {canEdit
              ? renderInfoRow("Họ tên", payload.B?.name || "", true, (text) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, name: text },
                  }))
                )
              : renderInfoRow("Họ tên", tenantName)}

            {canEdit
              ? renderInfoRow(
                  "Số điện thoại",
                  payload.B?.phone || "",
                  true,
                  (text) =>
                    setPayload((prev) => ({
                      ...prev,
                      B: { ...prev.B, phone: text },
                    }))
                )
              : renderInfoRow("Số điện thoại", tenantPhone)}

            {canEdit ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ thường trú</Text>
                <TextInput
                  style={styles.textInput}
                  value={payload.B?.permanentAddress || ""}
                  onChangeText={(text) =>
                    setPayload((prev) => ({
                      ...prev,
                      B: { ...prev.B, permanentAddress: text },
                    }))
                  }
                  placeholder=""
                  multiline
                />
              </View>
            ) : (
              renderInfoRow("Địa chỉ thường trú", tenantAddress)
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Thông tin phòng</Text>
            {renderInfoRow("Tòa nhà", buildingName)}
            {renderInfoRow("Phòng", roomNumber ? `P. ${roomNumber}` : "")}
            {renderInfoRow(
              "Giá thuê",
              roomPrice
                ? `${Number(roomPrice).toLocaleString("vi-VN")} đ/tháng`
                : ""
            )}
            {renderInfoRow(
              "Tiền đặt cọc",
              deposit ? `${Number(deposit).toLocaleString("vi-VN")} đ` : ""
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Người ở cùng</Text>

            {(roommatesList || []).length > 0
              ? roommatesList.map((r, idx) => (
                  <View key={idx} style={styles.furnitureRow}>
                    <Text style={styles.furnitureName}>{r.name || "—"}</Text>
                    <Text style={styles.furnitureQty}>
                      {r.phone || r.email || "—"}
                    </Text>
                  </View>
                ))
              : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Nội thất trong phòng</Text>

            {(furnituresList || []).length > 0
              ? (furnituresList || []).map((f) => (
                  <View
                    key={f.id ?? f._id ?? `${f.name}`}
                    style={styles.furnitureRow}
                  >
                    <Text style={styles.furnitureName}>{f.name || "—"}</Text>
                    <Text style={styles.furnitureQty}>x{f.quantity || 0}</Text>
                  </View>
                ))
              : null}
          </View>

          {/* ===== UPDATED: signatures for both sides ===== */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Ký kết</Text>

            <View style={styles.signRow}>
              {/* Bên A (landlord) */}
              <View style={styles.signBlock}>
                <Text style={styles.signLabel}>Bên A</Text>
                <View style={styles.signatureImageWrap}>
                  {contract?.landlordSignatureUrl ? (
                    <Image
                      source={{ uri: contract.landlordSignatureUrl }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>

              {/* Bên B (tenant) */}
              <View style={styles.signBlock}>
                <Text style={styles.signLabel}>Bên B</Text>
                <View style={styles.signatureImageWrap}>
                  {contract?.tenantSignatureUrl ? (
                    <Image
                      source={{ uri: contract.tenantSignatureUrl }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
          {/* ===== end signatures ===== */}

          <View style={{ height: 12 }} />

          <View style={styles.actionRow}>
            {canEdit ? (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.btnPrimaryText}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </Text>
              </TouchableOpacity>
            ) : null}

            {canEdit ? (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={openSignature}
              >
                <Text style={styles.btnSecondaryText}>Ký hợp đồng</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.btnExtend}
              onPress={handleRequestExtend}
            >
              <Text style={styles.btnExtendText}>Yêu cầu gia hạn</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={sigModalVisible}
        animationType="slide"
        onRequestClose={() => setSigModalVisible(false)}
      >
        <View style={styles.sigModal}>
          <View style={styles.sigHeader}>
            <TouchableOpacity
              onPress={() => setSigModalVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.sigTitle}>Ký hợp đồng</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.sigContainer}>
            {isWeb ? (
              WebSignatureComponent ? (
                <>
                  <WebSignatureComponent
                    ref={webSigRef}
                    canvasProps={{
                      style: {
                        width: "100%",
                        height: 220,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                      },
                    }}
                  />
                  <View style={styles.sigFooter}>
                    <TouchableOpacity
                      onPress={clearWebPad}
                      style={styles.sigFooterBtn}
                    >
                      <Text style={styles.sigFooterBtnText}>Xóa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleWebConfirm}
                      style={[styles.sigFooterBtn, styles.sigConfirmBtn]}
                      disabled={sigLoading}
                    >
                      {sigLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.sigConfirmBtnText}>
                          Xác nhận ký
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : null
            ) : NativeSignature ? (
              <NativeSignature
                ref={nativeSigRef}
                onOK={handleSignatureOK_native}
                onEmpty={handleSignatureEmpty}
                descriptionText=""
                clearText="Xóa"
                confirmText="Xác nhận"
                webStyle={signaturePadWebStyle()}
                autoClear={false}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <Toast />

      <Modal
        visible={extendModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeExtendModal}
      >
        <View style={styles.extendOverlay}>
          <View style={styles.extendModal}>
            <Text style={styles.extendTitle}>Yêu cầu gia hạn hợp đồng</Text>
            <Text style={styles.extendLabel}>Số tháng</Text>
            <TextInput
              style={styles.extendInput}
              value={extendMonths}
              onChangeText={setExtendMonths}
              keyboardType="number-pad"
              placeholder="Nhập số tháng"
            />
            <Text style={[styles.extendLabel, { marginTop: 12 }]}>Ghi chú</Text>
            <TextInput
              style={[styles.extendInput, { height: 80 }]}
              value={extendNote}
              onChangeText={setExtendNote}
              placeholder="Ghi chú (không bắt buộc)"
              multiline
            />
            <View style={styles.extendActions}>
              <TouchableOpacity
                style={styles.extendCancel}
                onPress={closeExtendModal}
                disabled={extendLoading}
              >
                <Text style={styles.extendCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.extendSubmit}
                onPress={submitExtend}
                disabled={extendLoading}
              >
                {extendLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.extendSubmitText}>Gửi yêu cầu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const signaturePadWebStyle = () => {
  return `
    .m-signature-pad { 
      box-shadow: none; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      margin: 0 auto;
      width: 100%;
    }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body,html { height: 100%; background-color: #fff; }
  `;
};

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },

  /* Header like other screens */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: STATUS_BAR_HEIGHT,
    paddingBottom: 12,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  topBack: { padding: 6 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 18,
    color: "#0f172a",
  },

  container: { flex: 1 },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e6eef1",
  },

  officialHeader: {
    alignItems: "center",
    paddingBottom: 10,
  },
  nation: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  motto: { fontSize: 12, color: "#000", marginBottom: 5 },

  contractTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  contractNumber: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    fontStyle: "italic",
  },

  section: {
    marginTop: 14,
  },

  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    width: 120,
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  infoValue: { flex: 1, color: "#0f172a", fontSize: 13 },

  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#eef3f6",
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    backgroundColor: "#fff",
  },

  termRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  termLabel: {
    width: 120,
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  termValue: { flex: 1, color: "#0f172a", fontSize: 13, fontWeight: "500" },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPending: { backgroundColor: "#fef3c7" },
  statusCompleted: { backgroundColor: "#d1fae5" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#475569" },

  furnitureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f4f6",
  },
  furnitureName: { color: "#0f172a", fontSize: 13 },
  furnitureQty: { color: "#64748b", fontSize: 13 },

  /* signature layout */
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  signBlock: {
    flex: 1,
    alignItems: "center",
  },
  signLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    marginBottom: 8,
  },

  signaturePreview: { marginTop: 8 },
  signatureImageWrap: {
    height: 120,
    borderWidth: 1,
    borderColor: "#eef3f6",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    width: "100%",
  },
  signatureImage: { width: "100%", height: "100%", borderRadius: 6 },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 8,
  },

  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0d9488",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 140,
    justifyContent: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0066ff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 140,
    justifyContent: "center",
  },
  btnSecondaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  btnExtend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0d6380",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnExtendText: { color: "#fff", fontWeight: "700" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  sigModal: { flex: 1, backgroundColor: "#fff" },
  sigHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e6edf0",
    backgroundColor: "#f8fafc",
  },
  backButton: { padding: 4 },
  sigTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    flex: 1,
  },
  sigContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  sigFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 12,
  },
  sigFooterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  sigFooterBtnText: { color: "#0f172a", fontWeight: "600", fontSize: 14 },
  sigConfirmBtn: { backgroundColor: "#0d9488", borderColor: "#0d9488" },
  sigConfirmBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  extendOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  extendModal: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6eef1",
  },
  extendTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  extendLabel: { fontSize: 13, color: "#475569", marginBottom: 6 },
  extendInput: {
    borderWidth: 1,
    borderColor: "#eef3f6",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  extendActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 14,
  },
  extendCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  extendCancelText: { color: "#475569", fontWeight: "600" },
  extendSubmit: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#0d9488",
  },
  extendSubmitText: { color: "#fff", fontWeight: "700" },

  centerFallback: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  fallbackText: { color: "#64748b", textAlign: "center", fontSize: 16 },
});

export default ContractDetailScreen;
