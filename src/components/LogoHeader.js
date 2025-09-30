import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const LogoHeader = ({ isScrolled, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.container}>
        <View style={styles.logoWrapper}>
          <View
            style={[
              styles.logoContainer,
              isScrolled
                ? styles.logoContainerScrolled
                : styles.logoContainerNormal,
            ]}
          >
            <Ionicons
              name="home"
              size={24}
              color={isScrolled ? "#fff" : "#fff"}
              style={styles.mainIcon}
            />

            <MaterialIcons
              name="key"
              size={12}
              color={isScrolled ? "#67e8f9" : "#a5f3fc"}
              style={styles.keyIcon}
            />

            <Ionicons
              name="person"
              size={10}
              color={isScrolled ? "#5eead4" : "#99f6e4"}
              style={styles.userIcon}
            />
          </View>

          <View
            style={[
              styles.dot1,
              isScrolled ? styles.dot1Scrolled : styles.dot1Normal,
            ]}
          />
          <View
            style={[
              styles.dot2,
              isScrolled ? styles.dot2Scrolled : styles.dot2Normal,
            ]}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.mainText,
              isScrolled ? styles.mainTextScrolled : styles.mainTextNormal,
            ]}
          >
            Rental Room
          </Text>
          <Text
            style={[
              styles.subText,
              isScrolled ? styles.subTextScrolled : styles.subTextNormal,
            ]}
          >
            Quản lý phòng trọ
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  logoWrapper: {
    position: "relative",
    marginRight: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainerNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  logoContainerScrolled: {
    backgroundColor: "#0d9488", // Fallback color thay vì gradient
  },
  mainIcon: {
    zIndex: 10,
  },
  keyIcon: {
    position: "absolute",
    top: -2,
    right: -2,
    zIndex: 20,
  },
  userIcon: {
    position: "absolute",
    bottom: -2,
    left: -2,
    zIndex: 20,
  },
  dot1: {
    position: "absolute",
    top: -4,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot1Normal: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  dot1Scrolled: {
    backgroundColor: "#5eead4",
  },
  dot2: {
    position: "absolute",
    bottom: -8,
    left: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dot2Normal: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dot2Scrolled: {
    backgroundColor: "#67e8f9",
  },
  textContainer: {
    marginLeft: 8,
  },
  mainText: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  mainTextNormal: {
    color: "#fff",
  },
  mainTextScrolled: {
    color: "#0d9488", // Thay vì gradient text (không hỗ trợ trong RN)
  },
  subText: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: -2,
  },
  subTextNormal: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  subTextScrolled: {
    color: "#0d9488",
  },
});

export default LogoHeader;
