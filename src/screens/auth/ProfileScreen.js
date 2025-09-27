import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color="#fff" />
        <Text style={styles.email}>
          {user
            ? user.user?.email || user.email || "Email không có"
            : "Chưa đăng nhập"}
        </Text>
        {user?.user?.phone && (
          <Text style={styles.phone}>{user.user.phone}</Text>
        )}
      </View>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        {/* Đổi mật khẩu */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("ChangePassword")}
        >
          <Ionicons name="key-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Đổi mật khẩu</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Cài đặt</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Hỗ trợ</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Về ứng dụng</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {user ? (
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Đăng xuất</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={handleLogin}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Đăng nhập</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#14b8a6",
    paddingVertical: 40,
    alignItems: "center",
  },
  email: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  phone: {
    color: "#fff",
    fontSize: 16,
    marginTop: 4,
    opacity: 0.9,
  },
  menuSection: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  actionBtn: {
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: "#14b8a6",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
