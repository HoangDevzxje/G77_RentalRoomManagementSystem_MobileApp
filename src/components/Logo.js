import React, { useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const Logo = ({ isScrolled = false, onPress, navigation, size = 48 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation) {
      navigation.navigate("Home");
    }
  };

  // pulse effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // bounce effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "5deg"],
  });

  const iconSize = size * 0.6;
  const keySize = size * 0.3;
  const userSize = size * 0.25;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.logoWrapper}>
        <Animated.View
          style={[
            styles.logoAnimated,
            {
              transform: [{ scale: scaleAnim }, { rotate }],
            },
          ]}
        >
          {isScrolled ? (
            <LinearGradient
              colors={["#14b8a6", "#06b6d4", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.logoContainer,
                { width: size, height: size, borderRadius: size / 4 },
              ]}
            >
              <Ionicons
                name="home"
                size={iconSize}
                color="#fff"
                style={styles.mainIcon}
              />
              <MaterialIcons
                name="key"
                size={keySize}
                color="#67e8f9"
                style={styles.keyIcon}
              />
              <Ionicons
                name="person"
                size={userSize}
                color="#5eead4"
                style={styles.userIcon}
              />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.logoContainer,
                styles.logoContainerNormal,
                { width: size, height: size, borderRadius: size / 4 },
              ]}
            >
              <Ionicons
                name="home"
                size={iconSize}
                color="#fff"
                style={styles.mainIcon}
              />
              <MaterialIcons
                name="key"
                size={keySize}
                color="#a5f3fc"
                style={styles.keyIcon}
              />
              <Ionicons
                name="person"
                size={userSize}
                color="#99f6e4"
                style={styles.userIcon}
              />
            </View>
          )}
        </Animated.View>

        {/* Decorative dots */}
        <Animated.View
          style={[
            styles.dot1,
            isScrolled ? styles.dot1Scrolled : styles.dot1Normal,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot2,
            isScrolled ? styles.dot2Scrolled : styles.dot2Normal,
            { transform: [{ translateY: bounceAnim }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  logoWrapper: {
    position: "relative",
  },
  logoAnimated: {
    position: "relative",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainerNormal: {
    backgroundColor: "rgba(20, 184, 166, 0.9)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  mainIcon: {
    zIndex: 10,
  },
  keyIcon: {
    position: "absolute",
    top: -4,
    right: -4,
    zIndex: 20,
  },
  userIcon: {
    position: "absolute",
    bottom: -4,
    left: -4,
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
});

export default Logo;
