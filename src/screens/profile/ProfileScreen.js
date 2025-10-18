import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const getInitials = (email) => {
    if (!email) return "??";
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header với gradient */}
      <LinearGradient
        colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user ? getInitials(user.user?.email || user.email) : "??"}
          </Text>
        </View>
        <Text style={styles.email}>
          {user
            ? user.user?.email || user.email || "Email không có"
            : "Chưa đăng nhập"}
        </Text>
        {user && (
          <View style={styles.statusBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#10b981" />
            <Text style={styles.statusText}>Đã kích hoạt</Text>
          </View>
        )}
      </LinearGradient>

      {user ? (
        <>
          {/* Menu Options */}
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Account")}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="person-outline" size={22} color="#14b8a6" />
              </View>
              <Text style={styles.menuText}>Tài khoản</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="key-outline" size={22} color="#06b6d4" />
              </View>
              <Text style={styles.menuText}>Đổi mật khẩu</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.iconWrapper}>
                <Ionicons name="settings-outline" size={22} color="#3b82f6" />
              </View>
              <Text style={styles.menuText}>Cài đặt</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color="#14b8a6"
                />
              </View>
              <Text style={styles.menuText}>Hỗ trợ</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#06b6d4"
                />
              </View>
              <Text style={styles.menuText}>Về ứng dụng</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.logoutBtn]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Đăng xuất</Text>
          </TouchableOpacity>
        </>
      ) : (
        <LinearGradient
          colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.actionBtn, styles.primaryBtn]}
        >
          <TouchableOpacity
            style={styles.gradientBtnContent}
            onPress={handleLogin}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>Đăng nhập</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    paddingTop: 35,
    paddingBottom: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  email: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "#fff",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  actionBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtn: {
    overflow: "hidden",
  },
  gradientBtnContent: {
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
