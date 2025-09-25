import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { changePasswordApi } from "../../api/authApi";

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      await changePasswordApi(oldPassword, newPassword);
      Alert.alert("Thành công", "Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Đổi mật khẩu thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Đổi mật khẩu</Text>
      <TextInput
        placeholder="Mật khẩu cũ"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <TextInput
        placeholder="Mật khẩu mới"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />
      <Button
        title={loading ? "Đang xử lý..." : "Đổi mật khẩu"}
        onPress={handleChangePassword}
        disabled={loading}
      />
    </View>
  );
}
