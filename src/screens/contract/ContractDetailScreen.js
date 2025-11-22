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
import RenderHtml from "react-native-render-html";

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
              Toast.show({
                type: "success",
                text1: "Đã thêm người ở cùng",
              });
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

  const getStatusInfo = (status) => {
    switch (status) {
      case "draft":
        return { color: "#6b7280", text: "Bản nháp", bgColor: "#f3f4f6" };
      case "sent_to_tenant":
        return { color: "#f59e0b", text: "Chờ ký", bgColor: "#fef3c7" };
      case "signed_by_tenant":
        return {
          color: "#3b82f6",
          text: "Đã ký - Chờ chủ",
          bgColor: "#dbeafe",
        };
      case "signed_by_landlord":
        return {
          color: "#3b82f6",
          text: "Đã ký - Chờ bạn",
          bgColor: "#dbeafe",
        };
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

  const statusInfo = getStatusInfo(contract.status);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.replace("Contracts")
          }
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Chi tiết hợp đồng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {/* Official header */}
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

          {/* status and dates */}
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Trạng thái:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusInfo.bgColor },
                ]}
              >
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>

            {contract.contract?.startDate && (
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                <Text style={styles.dateText}>
                  {fmtDate(contract.contract.startDate)} →{" "}
                  {fmtDate(contract.contract.endDate)}
                </Text>
              </View>
            )}
          </View>

          {/* A - landlord */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bên cho thuê (Bên A)</Text>
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>
                {contract.A?.name ||
                  contract.landlordId?.userInfo?.fullName ||
                  contract.landlordId?.email ||
                  "—"}
              </Text>

              <Text style={styles.infoLabel}>Ngày sinh:</Text>
              <Text style={styles.infoValue}>
                {contract.A?.dob ? fmtDate(contract.A.dob) : "—"}
              </Text>

              <Text style={styles.infoLabel}>CCCD:</Text>
              <Text style={styles.infoValue}>
                {contract.A?.cccd || "—"}{" "}
                {contract.A?.cccdIssuedDate && contract.A?.cccdIssuedPlace
                  ? `Cấp ngày: ${fmtDate(
                      contract.A.cccdIssuedDate
                    )}, Nơi cấp: ${contract.A.cccdIssuedPlace}`
                  : ""}
              </Text>

              <Text style={styles.infoLabel}>Hộ khẩu:</Text>
              <Text style={styles.infoValue}>
                {contract.A?.permanentAddress ||
                  contract.buildingId?.address ||
                  "—"}
              </Text>

              <Text style={styles.infoLabel}>Điện thoại:</Text>
              <Text style={styles.infoValue}>
                {contract.A?.phone ||
                  contract.landlordId?.userInfo?.phoneNumber ||
                  "—"}
              </Text>

              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {contract.A?.email || contract.landlordId?.email || "—"}
              </Text>
            </View>
          </View>

          {/* B - tenant (editable if allowed) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Bên thuê (Bên B) - Thông tin của bạn
            </Text>
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={payload.B.name || ""}
                  onChangeText={(text) =>
                    setPayload((prev) => ({
                      ...prev,
                      B: { ...prev.B, name: text },
                    }))
                  }
                  placeholder="Nhập họ tên"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {payload.B.name || contract.B?.name || "—"}
                </Text>
              )}

              <Text style={styles.infoLabel}>CCCD:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={payload.B.cccd || ""}
                  onChangeText={(text) =>
                    setPayload((prev) => ({
                      ...prev,
                      B: { ...prev.B, cccd: text },
                    }))
                  }
                  placeholder="Nhập số CCCD"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {payload.B.cccd || contract.B?.cccd || "—"}
                </Text>
              )}

              <Text style={styles.infoLabel}>Điện thoại:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={payload.B.phone || ""}
                  onChangeText={(text) =>
                    setPayload((prev) => ({
                      ...prev,
                      B: { ...prev.B, phone: text },
                    }))
                  }
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {payload.B.phone || contract.B?.phone || "—"}
                </Text>
              )}

              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              {canEdit ? (
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  value={payload.B.permanentAddress || ""}
                  onChangeText={(text) =>
                    setPayload((prev) => ({
                      ...prev,
                      B: { ...prev.B, permanentAddress: text },
                    }))
                  }
                  placeholder="Nhập địa chỉ thường trú"
                  multiline
                />
              ) : (
                <Text style={styles.infoValue}>
                  {payload.B.permanentAddress ||
                    contract.B?.permanentAddress ||
                    "—"}
                </Text>
              )}

              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {contract.B?.email || contract.tenantId?.email || "—"}
              </Text>
            </View>
          </View>

          {/* Room info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin phòng thuê</Text>
            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Tòa nhà:</Text>
              <Text style={styles.infoValue}>
                {contract.buildingId?.name || "—"}
              </Text>

              <Text style={styles.infoLabel}>Phòng:</Text>
              <Text style={styles.infoValue}>
                {contract.roomId?.roomNumber
                  ? `P. ${contract.roomId.roomNumber}`
                  : "—"}
              </Text>

              <Text style={styles.infoLabel}>Giá thuê:</Text>
              <Text style={styles.infoValue}>
                {contract.contract?.price || contract.roomId?.price
                  ? `${Number(
                      contract.contract?.price || contract.roomId?.price
                    ).toLocaleString("vi")} đ/tháng`
                  : "—"}
              </Text>

              <Text style={styles.infoLabel}>Tiền cọc:</Text>
              <Text style={styles.infoValue}>
                {contract.contract?.deposit
                  ? `${Number(contract.contract.deposit).toLocaleString(
                      "vi"
                    )} đ`
                  : "—"}
              </Text>

              <Text style={styles.infoLabel}>Số tối đa người ở:</Text>
              <Text style={styles.infoValue}>
                {contract.roomId?.maxTenants ?? "—"}
              </Text>
            </View>
          </View>

          {/* Occupants / Roommates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Người ở:{" "}
              {contract.occupants ? `(${contract.occupants.length})` : ""}
            </Text>

            {Array.isArray(contract.occupants) &&
            contract.occupants.length > 0 ? (
              contract.occupants.map((p, idx) => (
                <View key={`occ-${idx}`} style={styles.roommateCard}>
                  <Text style={styles.roommateName}>{p.name || "—"}</Text>
                  <Text style={styles.roommateInfo}>
                    {[p.phone, p.email].filter(Boolean).join(" • ")}
                  </Text>
                  {p.permanentAddress ? (
                    <Text style={styles.roommateAddress}>
                      {p.permanentAddress}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : payload.roommates && payload.roommates.length > 0 ? (
              payload.roommates.map((r, i) => (
                <View key={`rm-${i}`} style={styles.roommateCard}>
                  <Text style={styles.roommateName}>{r.name || "—"}</Text>
                  <Text style={styles.roommateInfo}>
                    {[r.phone, r.email].filter(Boolean).join(" • ")}
                  </Text>
                  {r.permanentAddress ? (
                    <Text style={styles.roommateAddress}>
                      {r.permanentAddress}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={{ color: "#64748b" }}>Không có người ở cùng</Text>
            )}
          </View>

          {/* Bikes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương tiện: </Text>
            {Array.isArray(contract.bikes) && contract.bikes.length > 0 ? (
              contract.bikes.map((b, i) => (
                <View key={`bike-${i}`} style={styles.furnitureRow}>
                  <Text style={styles.furnitureName}>
                    {b.bikeNumber || "—"}
                  </Text>
                  <Text style={styles.furnitureQty}>
                    {[b.brand || "", b.color || ""].filter(Boolean).join(" • ")}
                  </Text>
                </View>
              ))
            ) : payload.bikes && payload.bikes.length > 0 ? (
              payload.bikes.map((b, i) => (
                <View key={`bikep-${i}`} style={styles.furnitureRow}>
                  <Text style={styles.furnitureName}>
                    {b.bikeNumber || "—"}
                  </Text>
                  <Text style={styles.furnitureQty}>
                    {[b.brand || "", b.color || ""].filter(Boolean).join(" • ")}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: "#64748b" }}>
                Không có phương tiện đăng ký
              </Text>
            )}
          </View>

          {/* Furnitures */}
          {Array.isArray(contract.furnitures) &&
            contract.furnitures.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nội thất trong phòng</Text>
                {contract.furnitures.map((f, i) => (
                  <View key={`furn-${i}`} style={styles.furnitureRow}>
                    <Text style={styles.furnitureName}>{f.name || "—"}</Text>
                    <Text style={styles.furnitureQty}>x{f.quantity || 0}</Text>
                  </View>
                ))}
              </View>
            )}

          {Array.isArray(contract.terms) && contract.terms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Điều khoản hợp đồng</Text>

              {contract.terms.slice(0, 50).map((t, i) => {
                const cleanedHtml = (t.description || "")
                  .replace(/<br\s*\/?>/gi, "") // remove <br>
                  .replace(/\r\n|\r/g, "\n") // normalize CRLF -> LF
                  .replace(/\n\s*\n/g, "\n") // remove consecutive empty lines
                  .replace(/<p>\s*<\/p>/gi, "") // remove empty <p>
                  .replace(/style=(["'])[^"']*margin[^"']*\1/gi, "") // remove inline margin styles
                  .replace(/^\s+|\s+$/g, ""); // trim

                return (
                  <View key={`term-${i}`} style={styles.termBlockNoCard}>
                    <Text style={styles.termHeadingNoCard}>
                      <Text style={styles.termNumber}>{i + 1}. </Text>
                      <Text style={styles.termTitleNoCard}>
                        {t.name || "Điều khoản"}
                      </Text>
                    </Text>

                    <RenderHtml
                      contentWidth={contentWidth}
                      source={{ html: cleanedHtml || "<p></p>" }}
                      baseStyle={{ color: "#475569", lineHeight: 20 }}
                      tagsStyles={{
                        p: { marginTop: 4, marginBottom: 8, lineHeight: 20 },
                        li: { marginTop: 2, marginBottom: 6, lineHeight: 20 },
                        ul: { marginTop: 6, marginBottom: 8, paddingLeft: 16 },
                        ol: { marginTop: 6, marginBottom: 8, paddingLeft: 16 },
                        strong: { fontWeight: "700" },
                      }}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Regulations */}
          {Array.isArray(contract.regulations) &&
            contract.regulations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nội quy / Quy định</Text>

                {contract.regulations.slice(0, 50).map((r, i) => {
                  const cleanedHtml = (r.description || "")
                    .replace(/<br\s*\/?>/gi, "")
                    .replace(/\r\n|\r/g, "\n")
                    .replace(/\n\s*\n/g, "\n")
                    .replace(/<p>\s*<\/p>/gi, "")
                    .replace(/^\s+|\s+$/g, "");

                  return (
                    <View key={`reg-${i}`} style={styles.termBlockNoCard}>
                      <Text style={styles.termHeadingNoCard}>
                        <Text style={styles.termNumber}>{i + 1}. </Text>
                        <Text style={styles.termTitleNoCard}>
                          {r.title || "Quy định"}
                        </Text>
                      </Text>

                      <RenderHtml
                        contentWidth={contentWidth}
                        source={{ html: cleanedHtml || "<p></p>" }}
                        baseStyle={{ color: "#475569", lineHeight: 20 }}
                        tagsStyles={{
                          p: { marginTop: 4, marginBottom: 8, lineHeight: 20 },
                          li: { marginTop: 2, marginBottom: 6, lineHeight: 20 },
                          ul: {
                            marginTop: 6,
                            marginBottom: 8,
                            paddingLeft: 16,
                          },
                          ol: {
                            marginTop: 6,
                            marginBottom: 8,
                            paddingLeft: 16,
                          },
                          strong: { fontWeight: "700" },
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chữ ký các bên</Text>
            <View style={styles.signRow}>
              <View style={styles.signBlock}>
                <Text style={styles.signLabel}>Bên A</Text>
                <View style={styles.signatureContainer}>
                  {contract.landlordSignatureUrl ? (
                    <Image
                      source={{ uri: contract.landlordSignatureUrl }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.noSignature}>Chưa ký</Text>
                  )}
                </View>
                <Text style={styles.signerName}>
                  {contract.A?.name ||
                    contract.landlordId?.userInfo?.fullName ||
                    "—"}
                </Text>
                {contract.landlordSignedAt ? (
                  <Text style={{ color: "#64748b", fontSize: 12 }}>
                    {`Ký: ${fmtDate(contract.landlordSignedAt)}`}
                  </Text>
                ) : null}
              </View>

              <View style={styles.signBlock}>
                <Text style={styles.signLabel}>Bên B (Bạn)</Text>
                <View style={styles.signatureContainer}>
                  {contract.tenantSignatureUrl ? (
                    <Image
                      source={{ uri: contract.tenantSignatureUrl }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.noSignature}>Chưa ký</Text>
                  )}
                </View>
                <Text style={styles.signerName}>
                  {payload.B.name || contract.B?.name || "—"}
                </Text>
                {contract.tenantSignedAt ? (
                  <Text style={{ color: "#64748b", fontSize: 12 }}>
                    {`Ký: ${fmtDate(contract.tenantSignedAt)}`}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Action buttons */}
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
            {isWeb && WebSignature ? (
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
            ) : NativeSignature ? (
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
            ) : (
              <Text style={styles.notSupportedText}>
                Không hỗ trợ ký trên thiết bị này
              </Text>
            )}
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: { padding: 4 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
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
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0f172a",
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoLabel: {
    width: "30%",
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
    marginBottom: 8,
  },
  infoValue: { width: "70%", fontSize: 14, color: "#0f172a", marginBottom: 8 },
  textInput: {
    width: "70%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
    fontSize: 14,
  },
  roommateCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roommateName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  roommateInfo: { fontSize: 13, color: "#64748b", marginBottom: 4 },
  roommateAddress: { fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  furnitureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  furnitureName: { fontSize: 14, color: "#0f172a" },
  furnitureQty: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  signRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  signBlock: { flex: 1, alignItems: "center" },
  signLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  signatureContainer: {
    height: 100,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  signatureImage: { width: "90%", height: "90%", borderRadius: 6 },
  noSignature: { color: "#94a3b8", fontStyle: "italic" },
  signerName: { fontSize: 13, color: "#0f172a", fontWeight: "600" },
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

  termBlockNoCard: {
    marginBottom: 8,
    paddingBottom: 4,
  },
  termHeadingNoCard: {
    marginBottom: 6,
    fontSize: 15,
    lineHeight: 20,
  },
  termNumber: {
    fontWeight: "400",
    color: "#475569",
  },
  termTitleNoCard: {
    fontWeight: "700",
    color: "#0f172a",
  },
});

export default ContractDetailScreen;
