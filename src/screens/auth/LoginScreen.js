import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/authApi";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        await login({
          accessToken: result.accessToken,
          role: result.role,
          user: result.user,
        });

        Alert.alert("Thành công", "Đăng nhập thành công!");
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        Alert.alert("Lỗi", "Token không tồn tại trong phản hồi");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Lỗi đăng nhập",
        error.response?.data?.message || error.message || "Đăng nhập thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
        marginTop: 100,
        backgroundColor: "#f3f4f6",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "white",
          borderRadius: 16,
          padding: 20,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 24,
            color: "#111",
          }}
        >
          Đăng nhập
        </Text>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginBottom: 6, fontWeight: "500", color: "#111" }}>
            Email
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
            }}
          >
            <Ionicons name="mail-outline" size={20} color="#666" />
            <TextInput
              style={{
                flex: 1,
                height: 48,
                marginLeft: 8,
                color: "#111",
              }}
              placeholder="Nhập email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Password */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 6, fontWeight: "500", color: "#111" }}>
            Mật khẩu
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              paddingHorizontal: 10,
              backgroundColor: "#fff",
            }}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#666" />
            <TextInput
              style={{
                flex: 1,
                height: 48,
                marginLeft: 8,
                color: "#111",
              }}
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => Alert.alert("Chức năng quên mật khẩu chưa làm")}
        >
          <Text
            style={{
              textAlign: "right",
              color: "#2563eb",
              fontSize: 14,
              marginBottom: 18,
            }}
          >
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={{
            backgroundColor: "black",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 16,
          }}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
              Đăng nhập
            </Text>
          )}
        </TouchableOpacity>

        {/* Google login */}
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 18,
          }}
          onPress={() => Alert.alert("Google login")}
        >
          <Ionicons name="logo-google" size={20} color="red" />
          <Text style={{ marginLeft: 8, color: "#111", fontSize: 15 }}>
            Đăng nhập với Google
          </Text>
        </TouchableOpacity>

        {/* Register link */}
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <Text style={{ color: "#444" }}>
            Chưa có tài khoản?{" "}
            <Text
              style={{ color: "#2563eb", fontWeight: "bold" }}
              onPress={() => navigation.navigate("Register")}
            >
              Đăng ký ngay
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
