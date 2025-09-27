import React, { useState, useEffect } from "react";
import { View, StyleSheet, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import LogoHeader from "./LogoHeader";

const Header = ({ scrollY }) => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!scrollY) return;
    const listener = scrollY.addListener(({ value }) => {
      setIsScrolled(value > 20);
    });
    return () => scrollY?.removeListener(listener);
  }, [scrollY]);

  const headerPaddingTop =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

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
        {/* Logo */}
        <LogoHeader isScrolled={isScrolled} />
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
    minHeight: 72,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    minHeight: 64,
  },
});

export default Header;
