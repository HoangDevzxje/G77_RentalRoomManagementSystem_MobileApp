import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { changePasswordApi } from "../../api/authApi";
import { getAccessToken } from "../../utils/storage";

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const handleChangePassword = async () => {
    const token = await getAccessToken();
    if (!token) {
      Alert.alert("Lỗi", "Bạn chưa đăng nhập hoặc token đã hết hạn.");
      return;
    }

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
      navigation.navigate("Home");
    } catch (error) {
      console.log("Error response:", error.response?.data);
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Đổi mật khẩu thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("BottomTabs")}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        {/* Mật khẩu cũ */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Mật khẩu cũ"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry={!showOldPassword}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowOldPassword(!showOldPassword)}
          >
            <Ionicons
              name={showOldPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Mật khẩu mới */}
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons
              name={showNewPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <Button
          title={loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          onPress={handleChangePassword}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#14b8a6",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    paddingRight: 40,
    backgroundColor: "#fff",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
});
