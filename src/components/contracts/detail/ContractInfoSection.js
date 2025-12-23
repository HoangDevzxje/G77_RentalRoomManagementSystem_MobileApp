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
  validationErrors,
  identityStatus,
}) => {
  const isVerified = identityStatus?.status === "verified";
  const isFailed = identityStatus?.status === "failed";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const canEditCoreInfo = canEdit && !isVerified;
  const canEditSubItems = canEdit;

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

  const getFieldError = (fieldName, index = null, subField = null) => {
    if (!validationErrors) return null;
    if (index !== null) {
      const arrayKey = subField
        ? `${fieldName}[${index}].${subField}`
        : `${fieldName}[${index}]`;
      return validationErrors[arrayKey];
    }
    return validationErrors[fieldName];
  };

  const getLandlordInfo = () => {
    if (contract.A && (contract.A.name || contract.A.email)) {
      return contract.A;
    }
    if (contract.landlordId?.userInfo) {
      const ui = contract.landlordId.userInfo;
      return {
        name: ui.fullName || "",
        phone: ui.phoneNumber || "",
        permanentAddress: ui.address || "",
        email: contract.landlordId.email || "",
        dob: ui.dob || null,
        cccd: contract.A?.cccd || "",
        cccdIssuedDate: contract.A?.cccdIssuedDate || null,
        cccdIssuedPlace: contract.A?.cccdIssuedPlace || "",
      };
    }
    return {};
  };

  const landlordInfo = getLandlordInfo();

  return (
    <>
      {/* --- BÊN A (CHỦ NHÀ) --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bên cho thuê (Bên A)</Text>
        <View style={styles.infoGrid}>
          <Text style={styles.infoLabel}>Họ tên:</Text>
          <Text style={styles.infoValue}>{landlordInfo.name || "—"}</Text>

          <Text style={styles.infoLabel}>Ngày sinh:</Text>
          <Text style={styles.infoValue}>{fmtDate(landlordInfo.dob)}</Text>

          <Text style={styles.infoLabel}>CCCD:</Text>
          <Text style={styles.infoValue}>{landlordInfo.cccd || "—"}</Text>

          <Text style={styles.infoLabel}>Ngày cấp:</Text>
          <Text style={styles.infoValue}>
            {fmtDate(landlordInfo.cccdIssuedDate)}
          </Text>

          <Text style={styles.infoLabel}>Nơi cấp:</Text>
          <Text style={styles.infoValue}>
            {landlordInfo.cccdIssuedPlace || "—"}
          </Text>

          <Text style={styles.infoLabel}>Điện thoại:</Text>
          <Text style={styles.infoValue}>{landlordInfo.phone || "—"}</Text>

          <Text style={styles.infoLabel}>Hộ khẩu:</Text>
          <Text style={styles.infoValue}>
            {landlordInfo.permanentAddress || "—"}
          </Text>

          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{landlordInfo.email || "—"}</Text>
        </View>
      </View>

      {/* --- BÊN B (NGƯỜI THUÊ) --- */}
      <View style={styles.section}>
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>
            Bên thuê (Bên B) - Thông tin của bạn
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
            {isVerified && (
              <View style={styles.badgeSuccess}>
                <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                <Text style={styles.badgeTextSuccess}>
                  Đã xác thực thông tin
                </Text>
              </View>
            )}
            {isFailed && (
              <View style={styles.badgeError}>
                <Ionicons name="alert-circle" size={14} color="#b91c1c" />
                <Text style={styles.badgeTextError}>
                  Chưa xác thực thông tin
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoGrid}>
          {/* 1. HỌ TÊN */}
          <Text style={styles.infoLabel}>Họ tên:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.name") && styles.textInputError,
                ]}
                value={payload.B?.name || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, name: t },
                  }))
                }
                placeholder="Nhập họ tên"
                placeholderTextColor="#94a3b8"
              />
              {getFieldError("B.name") && (
                <Text style={styles.errorText}>{getFieldError("B.name")}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.name || contract.B?.name || "—"}
            </Text>
          )}

          {/* 2. NGÀY SINH */}
          <Text style={styles.infoLabel}>Ngày sinh:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.dob") && styles.textInputError,
                ]}
                value={payload.B?.dob || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({ ...prev, B: { ...prev.B, dob: t } }))
                }
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#94a3b8"
              />
              {getFieldError("B.dob") && (
                <Text style={styles.errorText}>{getFieldError("B.dob")}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {fmtDate(payload.B?.dob || contract.B?.dob)}
            </Text>
          )}

          {/* 3. CCCD */}
          <Text style={styles.infoLabel}>CCCD:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.cccd") && styles.textInputError,
                ]}
                value={payload.B?.cccd || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({ ...prev, B: { ...prev.B, cccd: t } }))
                }
                placeholder="12 số CCCD"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={12}
              />
              {getFieldError("B.cccd") && (
                <Text style={styles.errorText}>{getFieldError("B.cccd")}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.cccd || contract.B?.cccd || "—"}
            </Text>
          )}

          {/* 4. NGÀY CẤP */}
          <Text style={styles.infoLabel}>Ngày cấp:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.cccdIssuedDate") && styles.textInputError,
                ]}
                value={payload.B?.cccdIssuedDate || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, cccdIssuedDate: t },
                  }))
                }
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#94a3b8"
              />
              {getFieldError("B.cccdIssuedDate") && (
                <Text style={styles.errorText}>
                  {getFieldError("B.cccdIssuedDate")}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {fmtDate(payload.B?.cccdIssuedDate || contract.B?.cccdIssuedDate)}
            </Text>
          )}

          {/* 5. NƠI CẤP */}
          <Text style={styles.infoLabel}>Nơi cấp:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.cccdIssuedPlace") && styles.textInputError,
                ]}
                value={payload.B?.cccdIssuedPlace || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, cccdIssuedPlace: t },
                  }))
                }
                placeholder="Nhập nơi cấp"
                placeholderTextColor="#94a3b8"
              />
              {getFieldError("B.cccdIssuedPlace") && (
                <Text style={styles.errorText}>
                  {getFieldError("B.cccdIssuedPlace")}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.cccdIssuedPlace || contract.B?.cccdIssuedPlace || "—"}
            </Text>
          )}

          {/* 6. ĐIỆN THOẠI */}
          <Text style={styles.infoLabel}>Điện thoại:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.phone") && styles.textInputError,
                ]}
                value={payload.B?.phone || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, phone: t },
                  }))
                }
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
              />
              {getFieldError("B.phone") && (
                <Text style={styles.errorText}>{getFieldError("B.phone")}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.phone || contract.B?.phone || "—"}
            </Text>
          )}

          {/* 7. HỘ KHẨU */}
          <Text style={styles.infoLabel}>Hộ khẩu:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  { height: 50 },
                  getFieldError("B.permanentAddress") && styles.textInputError,
                ]}
                value={payload.B?.permanentAddress || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, permanentAddress: t },
                  }))
                }
                placeholder="Nhập địa chỉ thường trú"
                placeholderTextColor="#94a3b8"
                multiline
              />
              {getFieldError("B.permanentAddress") && (
                <Text style={styles.errorText}>
                  {getFieldError("B.permanentAddress")}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.permanentAddress ||
                contract.B?.permanentAddress ||
                "—"}
            </Text>
          )}

          {/* 8. EMAIL */}
          <Text style={styles.infoLabel}>Email:</Text>
          {canEditCoreInfo ? (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  getFieldError("B.email") && styles.textInputError,
                ]}
                value={payload.B?.email || ""}
                onChangeText={(t) =>
                  setPayload((prev) => ({
                    ...prev,
                    B: { ...prev.B, email: t },
                  }))
                }
                placeholder="Nhập email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {getFieldError("B.email") && (
                <Text style={styles.errorText}>{getFieldError("B.email")}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {payload.B?.email || contract.B?.email || "—"}
            </Text>
          )}
        </View>

        {isVerified && canEdit && (
          <Text style={styles.noteText}>
            * Thông tin định danh đã được xác thực nên không thể chỉnh sửa.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin phòng và tòa nhà</Text>

        <View style={styles.infoGrid}>
          {/* Tên tòa nhà */}
          <Text style={styles.infoLabel}>Tên tòa nhà:</Text>
          <Text style={styles.infoValue}>
            {contract.buildingId?.name || "Không có thông tin"}
          </Text>

          {/* Số phòng */}
          <Text style={styles.infoLabel}>Số phòng:</Text>
          <Text style={styles.infoValue}>
            {contract.roomId?.roomNumber || "Không có thông tin"}
          </Text>

          {/* Địa chỉ */}
          <Text style={styles.infoLabel}>Địa chỉ:</Text>
          <Text style={styles.infoValue}>
            {contract.buildingId?.address || "Không có thông tin"}
          </Text>

          {/* Số người tối đa */}
          <Text style={styles.infoLabel}>Số người tối đa:</Text>
          <Text style={styles.infoValue}>
            {contract.roomId?.maxTenants || 0} người
          </Text>
          {/* Tiền điện */}
          <Text style={styles.infoLabel}>Tiền điện:</Text>
          <View style={styles.complexValueContainer}>
            <Text
              style={[styles.infoValue, { width: "100%", marginBottom: 0 }]}
            >
              {formatCurrency(contract.buildingId?.ePrice || 0)}
            </Text>
            <Text style={styles.subValueText}>
              {contract.buildingId?.eIndexType === "byNumber"
                ? "Tính theo chỉ số (kWh)"
                : "Chưa xác định"}
            </Text>
          </View>

          {/* Tiền nước */}
          <Text style={styles.infoLabel}>Tiền nước:</Text>
          <View style={styles.complexValueContainer}>
            <Text
              style={[styles.infoValue, { width: "100%", marginBottom: 0 }]}
            >
              {formatCurrency(contract.buildingId?.wPrice || 0)}
            </Text>
            <Text style={styles.subValueText}>
              {contract.buildingId?.wIndexType === "byNumber"
                ? "Tính theo khối (m³)"
                : contract.buildingId?.wIndexType === "byPerson"
                ? "Tính theo đầu người"
                : "Chưa xác định"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>

        <View style={styles.infoGrid}>
          {/* Tiền phòng */}
          <Text style={styles.infoLabel}>Tiền phòng:</Text>
          <Text style={styles.infoValue}>
            {formatCurrency(
              contract.roomId?.price || contract.contract?.price || 0
            )}
          </Text>

          {/* Tiền cọc */}
          <Text style={styles.infoLabel}>Tiền cọc:</Text>
          <Text style={styles.infoValue}>
            {formatCurrency(contract.contract?.deposit || 0)}
          </Text>

          {/* Ngày bắt đầu */}
          <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
          <Text style={styles.infoValue}>
            {fmtDate(contract.contract?.startDate)}
          </Text>

          {/* Ngày kết thúc */}
          <Text style={styles.infoLabel}>Ngày kết thúc:</Text>
          <Text style={styles.infoValue}>
            {fmtDate(contract.contract?.endDate)}
          </Text>
        </View>
      </View>

      {/* --- DANH SÁCH XE (BIKES) --- */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Danh sách xe</Text>
          {canEditSubItems && (
            <TouchableOpacity onPress={addBike} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#0d9488" />
            </TouchableOpacity>
          )}
        </View>

        {payload.bikes?.length === 0 && contract.bikes?.length === 0 && (
          <Text style={styles.emptyText}>Chưa đăng ký xe nào.</Text>
        )}

        {(payload.bikes && payload.bikes.length > 0
          ? payload.bikes
          : contract.bikes || []
        ).map((bike, index) => (
          <View key={index} style={styles.subItemContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subItemTitle}>Xe {index + 1}</Text>
              {canEditSubItems && (
                <TouchableOpacity
                  onPress={() => removeArrayItem("bikes", index)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Biển số:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("bikes", index, "bikeNumber") &&
                        styles.textInputError,
                    ]}
                    value={bike.bikeNumber || ""}
                    onChangeText={(t) =>
                      updateArrayItem("bikes", index, "bikeNumber", t)
                    }
                    placeholder="Nhập biển số"
                    placeholderTextColor="#94a3b8"
                  />
                  {getFieldError("bikes", index, "bikeNumber") && (
                    <Text style={styles.errorText}>
                      {getFieldError("bikes", index, "bikeNumber")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{bike.bikeNumber || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>Loại xe:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("bikes", index, "brand") &&
                        styles.textInputError,
                    ]}
                    value={bike.brand || ""}
                    onChangeText={(t) =>
                      updateArrayItem("bikes", index, "brand", t)
                    }
                    placeholder="Nhập loại xe"
                    placeholderTextColor="#94a3b8"
                  />
                  {getFieldError("bikes", index, "brand") && (
                    <Text style={styles.errorText}>
                      {getFieldError("bikes", index, "brand")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{bike.brand || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>Màu xe:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("bikes", index, "color") &&
                        styles.textInputError,
                    ]}
                    value={bike.color || ""}
                    onChangeText={(t) =>
                      updateArrayItem("bikes", index, "color", t)
                    }
                    placeholder="Nhập màu xe"
                    placeholderTextColor="#94a3b8"
                  />
                  {getFieldError("bikes", index, "color") && (
                    <Text style={styles.errorText}>
                      {getFieldError("bikes", index, "color")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{bike.color || "—"}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* --- NGƯỜI Ở CÙNG (ROOMMATES) --- */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Người ở cùng</Text>
          {canEditSubItems && (
            <TouchableOpacity onPress={onAddRoommate} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#0d9488" />
            </TouchableOpacity>
          )}
        </View>

        {payload.roommates?.length === 0 &&
          contract.roommates?.length === 0 && (
            <Text style={styles.emptyText}>Chưa có người ở cùng.</Text>
          )}

        {(payload.roommates && payload.roommates.length > 0
          ? payload.roommates
          : contract.roommates || []
        ).map((rm, index) => (
          <View key={index} style={styles.subItemContainer}>
            <View style={styles.subHeader}>
              <Text style={styles.subItemTitle}>Người {index + 1}</Text>
              {canEditSubItems && (
                <TouchableOpacity
                  onPress={() => removeArrayItem("roommates", index)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.infoGrid}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("roommates", index, "name") &&
                        styles.textInputError,
                    ]}
                    value={rm.name || ""}
                    onChangeText={(t) =>
                      updateArrayItem("roommates", index, "name", t)
                    }
                    placeholder="Nhập họ tên"
                    placeholderTextColor="#94a3b8"
                  />
                  {getFieldError("roommates", index, "name") && (
                    <Text style={styles.errorText}>
                      {getFieldError("roommates", index, "name")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{rm.name || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>SĐT:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("roommates", index, "phone") &&
                        styles.textInputError,
                    ]}
                    value={rm.phone || ""}
                    onChangeText={(t) =>
                      updateArrayItem("roommates", index, "phone", t)
                    }
                    keyboardType="phone-pad"
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor="#94a3b8"
                    maxLength={10}
                  />
                  {getFieldError("roommates", index, "phone") && (
                    <Text style={styles.errorText}>
                      {getFieldError("roommates", index, "phone")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{rm.phone || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>CCCD:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("roommates", index, "cccd") &&
                        styles.textInputError,
                    ]}
                    value={rm.cccd || ""}
                    onChangeText={(t) =>
                      updateArrayItem("roommates", index, "cccd", t)
                    }
                    keyboardType="numeric"
                    placeholder="12 số CCCD"
                    placeholderTextColor="#94a3b8"
                    maxLength={12}
                  />
                  {getFieldError("roommates", index, "cccd") && (
                    <Text style={styles.errorText}>
                      {getFieldError("roommates", index, "cccd")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{rm.cccd || "—"}</Text>
              )}

              <Text style={styles.infoLabel}>Ngày sinh:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("roommates", index, "dob") &&
                        styles.textInputError,
                    ]}
                    value={rm.dob || ""}
                    onChangeText={(t) =>
                      updateArrayItem("roommates", index, "dob", t)
                    }
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor="#94a3b8"
                  />
                  {getFieldError("roommates", index, "dob") && (
                    <Text style={styles.errorText}>
                      {getFieldError("roommates", index, "dob")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{fmtDate(rm.dob)}</Text>
              )}

              <Text style={styles.infoLabel}>Hộ khẩu:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      { height: 40 },
                      getFieldError("roommates", index, "permanentAddress") &&
                        styles.textInputError,
                    ]}
                    value={rm.permanentAddress || ""}
                    onChangeText={(t) =>
                      updateArrayItem("roommates", index, "permanentAddress", t)
                    }
                    placeholder="Nhập địa chỉ"
                    placeholderTextColor="#94a3b8"
                  />
                  {getFieldError("roommates", index, "permanentAddress") && (
                    <Text style={styles.errorText}>
                      {getFieldError("roommates", index, "permanentAddress")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>
                  {rm.permanentAddress || "—"}
                </Text>
              )}

              <Text style={styles.infoLabel}>Email:</Text>
              {canEditSubItems ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.textInput,
                      getFieldError("roommates", index, "email") &&
                        styles.textInputError,
                    ]}
                    value={rm.email || ""}
                    onChangeText={(t) =>
                      updateArrayItem("roommates", index, "email", t)
                    }
                    placeholder="Nhập email"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {getFieldError("roommates", index, "email") && (
                    <Text style={styles.errorText}>
                      {getFieldError("roommates", index, "email")}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.infoValue}>{rm.email || "—"}</Text>
              )}
            </View>
          </View>
        ))}
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
  addButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  infoLabel: {
    width: "30%",
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 12,
    paddingRight: 8,
  },
  infoValue: {
    width: "70%",
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 12,
    fontWeight: "500",
  },
  // Style hỗ trợ cho phần complex value (điện, nước)
  complexValueContainer: {
    width: "70%",
    marginBottom: 12,
  },
  subValueText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginTop: 2,
  },
  inputContainer: {
    width: "70%",
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f8fafc",
    fontSize: 14,
    color: "#0f172a",
    minHeight: 40,
  },
  textInputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
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
    alignItems: "center",
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
    textAlign: "center",
    paddingVertical: 12,
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeTextSuccess: { fontSize: 12, color: "#15803d", fontWeight: "600" },
  badgeError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeTextError: { fontSize: 12, color: "#b91c1c", fontWeight: "600" },
  noteText: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 8,
  },
});

export default ContractInfoSection;
