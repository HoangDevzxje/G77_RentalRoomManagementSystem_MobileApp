import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ContractInfoSection = ({
  contract,
  payload,
  setPayload,
  canEdit,
  fmtDate,
  onAddRoommate,
}) => {
  return (
    <>
      {/* A */}
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
              ? `Cấp ngày: ${fmtDate(contract.A.cccdIssuedDate)}, Nơi cấp: ${
                  contract.A.cccdIssuedPlace
                }`
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

      {/* B */}
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
              ? `${Number(contract.contract.deposit).toLocaleString("vi")} đ`
              : "—"}
          </Text>

          <Text style={styles.infoLabel}>Số tối đa người ở:</Text>
          <Text style={styles.infoValue}>
            {contract.roomId?.maxTenants ?? "—"}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default ContractInfoSection;
