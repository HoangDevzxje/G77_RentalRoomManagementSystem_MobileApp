import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import Logo from "../logo/Logo";

const Header = ({ scrollY }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!scrollY) return;
    const listener = scrollY.addListener(({ value }) => {
      setIsScrolled(value > 20);
    });
    return () => scrollY?.removeListener(listener);
  }, [scrollY]);

  const headerPaddingTop =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 30;

  const handleLogoPress = () => {
    navigation.navigate("BottomTabs");
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: headerPaddingTop,
          backgroundColor: isScrolled ? "white" : "transparent",
          borderBottomWidth: isScrolled ? 1 : 0,
          borderBottomColor: isScrolled ? "#e5e7eb" : "transparent",
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
        <View style={styles.logoContainer}>
          <Logo isScrolled={isScrolled} onPress={handleLogoPress} size={45} />

          <View style={styles.textContainer}>
            {isScrolled ? (
              <LinearGradient
                colors={["#0d9488", "#0891b2", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientText}
              >
                <Text style={[styles.mainText, styles.gradientTextStyle]}>
                  Rental Room
                </Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.mainText, styles.mainTextNormal]}>
                Rental Room
              </Text>
            )}

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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    minHeight: 100,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 64,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
  },
  mainText: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  gradientText: {
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  gradientTextStyle: {
    color: "transparent",
  },
  mainTextNormal: {
    color: "#fff",
  },
  subText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  subTextNormal: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  subTextScrolled: {
    color: "#0d9488",
  },
});

export default Header;
