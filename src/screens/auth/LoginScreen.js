import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Logo";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      Alert.alert("Lỗi", "Vui lòng nhập email hoặc tên đăng nhập");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail.includes("@") && !emailRegex.test(trimmedEmail)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    if (!trimmedPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, trimmedPassword);

      if (rememberMe) {
        await AsyncStorage.setItem("rememberedEmail", trimmedEmail);
        await AsyncStorage.setItem("rememberedPassword", trimmedPassword);
      } else {
        await AsyncStorage.removeItem("rememberedEmail");
        await AsyncStorage.removeItem("rememberedPassword");
      }

      navigation.navigate("BottomTabs");
    } catch (error) {
      console.log("Login error:", error.message);
      Alert.alert("Lỗi đăng nhập", error.message || "Vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoPress = () => {
    navigation.navigate("BottomTabs");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Sử dụng component Logo */}
        <Logo isScrolled={false} onPress={handleLogoPress} size={55} />

        {/* Title */}
        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.description}>Đăng nhập để tiếp tục</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" style={styles.inputIcon} />
          <TextInput
            placeholder="Nhập email hoặc tên đăng nhập"
            placeholderTextColor="#999"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" style={styles.inputIcon} />
          <TextInput
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#999"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Remember me + Forgot password */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.rememberMe}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("SendOtp")}>
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="log-in-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.loginText}>Đăng nhập</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separator} />
          <Text style={styles.separatorText}>Hoặc</Text>
          <View style={styles.separator} />
        </View>

        {/* Google Login */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => Alert.alert("Google login")}
        >
          <Image
            source={require("../../../assets/images/Google__G__logo.svg.webp")}
            style={styles.googleLogo}
          />
          <Text style={styles.googleText}>Đăng nhập với Google</Text>
        </TouchableOpacity>

        {/* Register */}
        <View style={styles.registerContainer}>
          <Text style={{ color: "#555" }}>
            Chưa có tài khoản?{" "}
            <Text
              style={styles.registerLink}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    alignItems: "center", // Thêm để căn giữa logo
  },
  // Đã xóa phần styles logo cũ
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111",
    marginTop: 20, // Thêm margin top để tách biệt với logo
    marginBottom: 8,
  },
  description: {
    textAlign: "center",
    color: "#555",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 16,
    paddingHorizontal: 10,
    height: 48,
    width: "100%", // Đảm bảo input chiếm full width
  },
  inputIcon: {
    fontSize: 20,
    color: "#666",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: "#111",
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    width: "100%", // Đảm bảo row chiếm full width
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  rememberText: {
    fontSize: 14,
    color: "#333",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 18,
    width: "100%", // Đảm bảo button chiếm full width
  },
  loginText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    width: "100%", // Đảm bảo separator chiếm full width
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  separatorText: {
    marginHorizontal: 8,
    color: "#999",
    fontSize: 13,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "#fff",
    width: "100%", // Đảm bảo button chiếm full width
  },
  googleLogo: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  googleText: {
    marginLeft: 8,
    color: "#333",
    fontSize: 15,
  },
  registerContainer: {
    alignItems: "center",
  },
  registerLink: {
    color: "#2563eb",
    fontWeight: "bold",
  },
});
