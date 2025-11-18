import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Building2, Clock, Users, Zap } from "lucide-react-native";

const { width } = Dimensions.get("window");

const CountUp = ({ from = 0, to = 0, duration = 1.5, suffix = "" }) => {
  const [count, setCount] = useState(from);
  const animatedValueRef = useRef(new Animated.Value(from));

  useEffect(() => {
    const animatedValue = animatedValueRef.current;

    Animated.timing(animatedValue, {
      toValue: to,
      duration: Math.max(0, duration) * 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    const listenerId = animatedValue.addListener(({ value }) => {
      const displayVal =
        Math.abs(value - Math.round(value)) < 0.0001
          ? Math.round(value)
          : Math.floor(value * 10) / 10;
      setCount(displayVal);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [to, duration]);

  const formatNumber = (num) => {
    try {
      if (typeof num !== "number") return String(num);
      const parts = String(num).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    } catch {
      return String(num);
    }
  };

  return (
    <Text style={styles.numberText}>
      {formatNumber(count)}
      {suffix}
    </Text>
  );
};

const StatCard = ({ stat, index }) => {
  // useRef so Animated.Values persist across re-renders
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, index]);

  const IconComponent = stat.icon;

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.iconContainer}>
        {IconComponent ? (
          <IconComponent size={32} color="#2563eb" strokeWidth={2} />
        ) : (
          <Text style={{ fontSize: 18 }}>🏢</Text>
        )}
      </View>

      <CountUp from={0} to={stat.number} duration={1.5} suffix={stat.suffix} />
      <Text style={styles.labelText}>{stat.label}</Text>
    </Animated.View>
  );
};

const StatsSection = () => {
  const stats = [
    { number: 1000, suffix: "+", label: "Phòng Trọ Quản Lý", icon: Building2 },
    { number: 500, suffix: "+", label: "Chủ Trọ Tin Dùng", icon: Users },
    { number: 99.9, suffix: "%", label: "Thời Gian Hoạt Động", icon: Clock },
    { number: 24, suffix: "/7", label: "Hỗ Trợ Khách Hàng", icon: Zap },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#f0f9ff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.12)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12,
  },
  numberText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  labelText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
});

export default StatsSection;
