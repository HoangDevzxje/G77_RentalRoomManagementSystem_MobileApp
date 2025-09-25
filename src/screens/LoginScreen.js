import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../api/authApi";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập email và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const result = await loginApi(email, password);

      if (result && result.accessToken) {
        await login(result.accessToken);
      } else {
        Alert.alert("Lỗi", "Token không tồn tại trong phản hồi");
      }
    } catch (error) {
      // Show user-friendly error message
      Alert.alert(
        "Lỗi đăng nhập",
        error.response?.data?.message || error.message || "Đăng nhập thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, textAlign: "center", marginBottom: 30 }}>
        Đăng nhập
      </Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          padding: 15,
          marginVertical: 10,
          borderRadius: 5,
          borderColor: "#ddd",
        }}
      />
      <TextInput
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 15,
          marginVertical: 10,
          borderRadius: 5,
          borderColor: "#ddd",
        }}
      />
      <Button
        title={loading ? "Đang đăng nhập..." : "Đăng nhập"}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
