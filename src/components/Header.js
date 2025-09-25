import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import LogoHeader from "./LogoHeader";
import LanguageSelector from "./LanguageSelector";
import { useAuth } from "../context/AuthContext";

const Header = ({ scrollY }) => {
  const navigation = useNavigation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [slideAnim] = useState(
    new Animated.Value(Dimensions.get("window").width)
  );
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );

  const { user, token, logout } = useAuth();

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
      slideAnim.setValue(window.width);
    });

    return () => subscription?.remove();
  }, [slideAnim]);

  useEffect(() => {
    if (!scrollY) return;
    const listener = scrollY.addListener(({ value }) => {
      setIsScrolled(value > 20);
    });
    return () => scrollY?.removeListener(listener);
  }, [scrollY]);

  const navItems = [
    { label: "Trang chủ", route: "Home", icon: "home-outline" },
    {
      label: "Phần mềm chủ nhà",
      route: "HostSoftware",
      icon: "business-outline",
    },
    { label: "Về chúng tôi", route: "AboutUs", icon: "hand-left-outline" },
  ];

  const openMenu = () => {
    setIsMobileMenuOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsMobileMenuOpen(false);
    });
  };

  const handleNavigation = (route) => {
    try {
      navigation.navigate(route);
      closeMenu();
    } catch (error) {
      console.error("Navigation error:", error);
      closeMenu();
    }
  };

  const headerPaddingTop =
    Platform.OS === "android" ? StatusBar.currentHeight + 20 : 40;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: headerPaddingTop,
            backgroundColor: isScrolled
              ? "rgba(255, 255, 255, 0.95)"
              : "transparent",
            borderBottomWidth: isScrolled ? 1 : 0,
            borderBottomColor: isScrolled ? "#ccfbf1" : "transparent",
            shadowColor: isScrolled ? "#000" : "transparent",
            shadowOpacity: isScrolled ? 0.1 : 0,
            shadowRadius: isScrolled ? 4 : 0,
            elevation: isScrolled ? 4 : 0,
          },
        ]}
      >
        {!isScrolled && (
          <LinearGradient
            colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => handleNavigation("Home")}
            activeOpacity={0.7}
          >
            <LogoHeader isScrolled={isScrolled} />
          </TouchableOpacity>

          <View style={styles.right}>
            <TouchableOpacity
              onPress={openMenu}
              activeOpacity={0.7}
              style={styles.menuButton}
            >
              <Ionicons
                name="menu"
                size={24}
                color={isScrolled ? "#374151" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={isMobileMenuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={closeMenu}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.menu,
              {
                transform: [{ translateX: slideAnim }],
                width: screenWidth * 0.8,
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <TouchableOpacity
                onPress={closeMenu}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.menuScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.userSection}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={32} color="#14b8a6" />
                </View>
                {token && user ? (
                  <>
                    <Text style={styles.userGreeting}>
                      Xin chào, {user.name || "Người dùng"}!
                    </Text>
                    <Text style={styles.userHint}>{user.email}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.userGreeting}>Xin chào!</Text>
                    <Text style={styles.userHint}>
                      Đăng nhập để trải nghiệm tốt hơn
                    </Text>
                  </>
                )}
              </View>

              {/* Navigation items */}
              <View style={styles.navSection}>
                {navItems.map((item) => (
                  <TouchableOpacity
                    key={item.route}
                    onPress={() => handleNavigation(item.route)}
                    style={styles.menuItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons name={item.icon} size={20} color="#14b8a6" />
                    </View>
                    <Text style={styles.menuItemText}>{item.label}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ngôn ngữ</Text>
                <LanguageSelector isScrolled={true} />
              </View>

              {token && user ? (
                <TouchableOpacity
                  onPress={logout}
                  style={[styles.loginMenuBtn, { backgroundColor: "#ef4444" }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={styles.loginMenuText}>Đăng xuất</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleNavigation("Login")}
                  style={styles.loginMenuBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.loginMenuText}>Đăng nhập</Text>
                </TouchableOpacity>
              )}

              {/* Additional menu items */}
              <View style={styles.additionalSection}>
                <TouchableOpacity
                  style={styles.additionalItem}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={20} color="#6b7280" />
                  <Text style={styles.additionalItemText}>Cài đặt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.additionalItem}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <Text style={styles.additionalItemText}>Trợ giúp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.additionalItem}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <Text style={styles.additionalItemText}>Về ứng dụng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    minHeight: 72,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 64,
    paddingTop: 10,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
  },
  overlayTouchable: {
    flex: 1,
  },
  menu: {
    backgroundColor: "#fff",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 16 : 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 6,
  },
  menuScrollView: {
    flex: 1,
  },
  userSection: {
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userGreeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userHint: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  navSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuItemIcon: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  section: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  loginMenuBtn: {
    margin: 20,
    backgroundColor: "#14b8a6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  loginMenuText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  additionalSection: {
    paddingVertical: 8,
  },
  additionalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  additionalItemText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },
});

export default Header;
