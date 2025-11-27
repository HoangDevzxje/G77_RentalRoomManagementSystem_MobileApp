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
  onAddRoommate, // Hàm thêm người ở cùng từ màn hình cha
}) => {
  // Helper để update mảng (roommates hoặc bikes)
  const updateArrayItem = (key, index, field, value) => {
    const newArray = [...payload[key]];
    newArray[index] = { ...newArray[index], [field]: value };
    setPayload((prev) => ({ ...prev, [key]: newArray }));
  };

  const removeArrayItem = (key, index) => {
    const newArray = payload[key].filter((_, i) => i !== index);
    setPayload((prev) => ({ ...prev, [key]: newArray }));
  };

  const addBike = () => {
    setPayload((prev) => ({
      ...prev,
      bikes: [...(prev.bikes || []), { bikeNumber: "", brand: "", color: "" }],
    }));
  };

  return (
    <>
      {/* --- BÊN A (CHỦ NHÀ) --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bên cho thuê (Bên A)</Text>
        <View style={styles.infoGrid}>
          <Text style={styles.infoLabel}>Họ tên:</Text>
          <Text style={styles.infoValue}>
            {contract.A?.name || contract.landlordId?.userInfo?.fullName || "—"}
          </Text>

          <Text style={styles.infoLabel}>CCCD:</Text>
          <Text style={styles.infoValue}>{contract.A?.cccd || "—"}</Text>

          <Text style={styles.infoLabel}>Điện thoại:</Text>
          <Text style={styles.infoValue}>
            {contract.A?.phone ||
              contract.landlordId?.userInfo?.phoneNumber ||
              "—"}
          </Text>
        </View>
      </View>

      {/* --- BÊN B (NGƯỜI THUÊ) --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Bên thuê (Bên B) - Thông tin của bạn
        </Text>
        <View style={styles.infoGrid}>
          {/* Họ tên */}
          <Text style={styles.infoLabel}>Họ tên:</Text>
          {canEdit ? (
            <TextInput
              style={styles.textInput}
              value={payload.B?.name || ""}
              onChangeText={(t) =>
                setPayload((prev) => ({ ...prev, B: { ...prev.B, name: t } }))
              }
              placeholder="Nguyễn Văn A"
            />
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.name || contract.B?.name || "—"}
            </Text>
          )}

          {/* Ngày sinh */}
          <Text style={styles.infoLabel}>Ngày sinh:</Text>
          {canEdit ? (
            <TextInput
              style={styles.textInput}
              value={payload.B?.dob ? String(payload.B.dob).split("T")[0] : ""}
              onChangeText={(t) =>
                setPayload((prev) => ({ ...prev, B: { ...prev.B, dob: t } }))
              }
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <Text style={styles.infoValue}>
              {fmtDate(payload.B?.dob || contract.B?.dob)}
            </Text>
          )}

          {/* CCCD */}
          <Text style={styles.infoLabel}>CCCD:</Text>
          {canEdit ? (
            <TextInput
              style={styles.textInput}
              value={payload.B?.cccd || ""}
              onChangeText={(t) =>
                setPayload((prev) => ({ ...prev, B: { ...prev.B, cccd: t } }))
              }
              placeholder="Số CCCD"
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.cccd || contract.B?.cccd || "—"}
            </Text>
          )}

          {/* Ngày cấp CCCD */}
          <Text style={styles.infoLabel}>Ngày cấp:</Text>
          {canEdit ? (
            <TextInput
              style={styles.textInput}
              value={
                payload.B?.cccdIssuedDate
                  ? String(payload.B.cccdIssuedDate).split("T")[0]
                  : ""
              }
              onChangeText={(t) =>
                setPayload((prev) => ({
                  ...prev,
                  B: { ...prev.B, cccdIssuedDate: t },
                }))
              }
              placeholder="YYYY-MM-DD"
            />
          ) : (
            <Text style={styles.infoValue}>
              {fmtDate(payload.B?.cccdIssuedDate || contract.B?.cccdIssuedDate)}
            </Text>
          )}

          <Text style={styles.infoLabel}>Nơi cấp:</Text>
          {canEdit ? (
            <TextInput
              style={styles.textInput}
              value={payload.B?.cccdIssuedPlace || ""}
              onChangeText={(t) =>
                setPayload((prev) => ({
                  ...prev,
                  B: { ...prev.B, cccdIssuedPlace: t },
                }))
              }
              placeholder="Cục CS QLHC..."
            />
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.cccdIssuedPlace || contract.B?.cccdIssuedPlace || "—"}
            </Text>
          )}

          {/* Điện thoại */}
          <Text style={styles.infoLabel}>Điện thoại:</Text>
          {canEdit ? (
            <TextInput
              style={styles.textInput}
              value={payload.B?.phone || ""}
              onChangeText={(t) =>
                setPayload((prev) => ({ ...prev, B: { ...prev.B, phone: t } }))
              }
              placeholder="SĐT liên hệ"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.phone || contract.B?.phone || "—"}
            </Text>
          )}

          {/* Địa chỉ */}
          <Text style={styles.infoLabel}>Hộ khẩu:</Text>
          {canEdit ? (
            <TextInput
              style={[styles.textInput, { height: 50 }]}
              value={payload.B?.permanentAddress || ""}
              onChangeText={(t) =>
                setPayload((prev) => ({
                  ...prev,
                  B: { ...prev.B, permanentAddress: t },
                }))
              }
              placeholder="Địa chỉ thường trú"
              multiline
            />
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.permanentAddress ||
                contract.B?.permanentAddress ||
                "—"}
            </Text>
          )}

          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>
            {payload.B?.email || contract.B?.email || "—"}
          </Text>
        </View>
      </View>

      {/* --- DANH SÁCH XE (BIKES) --- */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Danh sách xe</Text>
          {canEdit && (
            <TouchableOpacity onPress={addBike}>
              <Ionicons name="add-circle" size={24} color="#0d9488" />
            </TouchableOpacity>
          )}
        </View>

        {(payload.bikes && payload.bikes.length > 0
          ? payload.bikes
          : contract.bikes || []
        ).map((bike, index) => (
          <View key={index} style={styles.subItemContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subItemTitle}>Xe {index + 1}</Text>
              {canEdit && (
                <TouchableOpacity
                  onPress={() => removeArrayItem("bikes", index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Biển số:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={bike.bikeNumber || ""}
                  onChangeText={(t) =>
                    updateArrayItem("bikes", index, "bikeNumber", t)
                  }
                  placeholder="29A1-12345"
                />
              ) : (
                <Text style={styles.infoValue}>{bike.bikeNumber || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>Loại xe:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={bike.brand || ""}
                  onChangeText={(t) =>
                    updateArrayItem("bikes", index, "brand", t)
                  }
                  placeholder="Vision, Wave..."
                />
              ) : (
                <Text style={styles.infoValue}>{bike.brand || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>Màu xe:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={bike.color || ""}
                  onChangeText={(t) =>
                    updateArrayItem("bikes", index, "color", t)
                  }
                  placeholder="Đỏ, Đen..."
                />
              ) : (
                <Text style={styles.infoValue}>{bike.color || "—"}</Text>
              )}
            </View>
          </View>
        ))}
        {payload.bikes?.length === 0 && (
          <Text style={styles.emptyText}>Chưa đăng ký xe nào.</Text>
        )}
      </View>
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Người ở cùng</Text>
        </View>

        {(payload.roommates && payload.roommates.length > 0
          ? payload.roommates
          : contract.roommates || []
        ).map((rm, index) => (
          <View key={index} style={styles.subItemContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subItemTitle}>Người {index + 1}</Text>
              {canEdit && (
                <TouchableOpacity
                  onPress={() => removeArrayItem("roommates", index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={rm.name || ""}
                  onChangeText={(t) =>
                    updateArrayItem("roommates", index, "name", t)
                  }
                  placeholder="Họ tên"
                />
              ) : (
                <Text style={styles.infoValue}>{rm.name || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>SĐT:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={rm.phone || ""}
                  onChangeText={(t) =>
                    updateArrayItem("roommates", index, "phone", t)
                  }
                  keyboardType="phone-pad"
                  placeholder="09..."
                />
              ) : (
                <Text style={styles.infoValue}>{rm.phone || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>CCCD:</Text>
              {canEdit ? (
                <TextInput
                  style={styles.textInput}
                  value={rm.cccd || ""}
                  onChangeText={(t) =>
                    updateArrayItem("roommates", index, "cccd", t)
                  }
                  keyboardType="numeric"
                  placeholder="Số CCCD"
                />
              ) : (
                <Text style={styles.infoValue}>{rm.cccd || "—"}</Text>
              )}
            </View>
          </View>
        ))}
        {payload.roommates?.length === 0 && (
          <Text style={styles.emptyText}>Chưa có người ở cùng.</Text>
        )}
      </View>

      {/* --- THÔNG TIN PHÒNG --- */}
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
            {contract.contract?.price
              ? `${Number(contract.contract.price).toLocaleString(
                  "vi"
                )} đ/tháng`
              : "—"}
          </Text>

          <Text style={styles.infoLabel}>Tiền cọc:</Text>
          <Text style={styles.infoValue}>
            {contract.contract?.deposit
              ? `${Number(contract.contract.deposit).toLocaleString("vi")} đ`
              : "—"}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  infoLabel: {
    width: "30%",
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 12,
  },
  infoValue: {
    width: "70%",
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 12,
    fontWeight: "500",
  },
  textInput: {
    width: "70%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
    fontSize: 14,
    color: "#0f172a",
  },
  subItemContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subItemTitle: {
    fontWeight: "700",
    color: "#475569",
    fontSize: 13,
  },
  emptyText: {
    fontStyle: "italic",
    color: "#94a3b8",
    fontSize: 13,
  },
});

export default ContractInfoSection;
