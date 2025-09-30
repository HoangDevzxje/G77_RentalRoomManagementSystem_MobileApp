import React, { useEffect, useState } from "react";
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

const CountUp = ({ from, to, duration, suffix }) => {
  const [count, setCount] = useState(from);
  const animatedValue = new Animated.Value(from);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: to,
      duration: duration * 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setCount(Math.floor(value * 10) / 10);
    });

    return () => animatedValue.removeListener(listener);
  }, [to]);

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <Text style={styles.numberText}>
      {formatNumber(count)}
      {suffix}
    </Text>
  );
};

const StatCard = ({ stat, index }) => {
  const scaleAnim = new Animated.Value(0.8);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        <IconComponent size={32} color="#2563eb" strokeWidth={2} />
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
    paddingVertical: 40,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  numberText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});

export default StatsSection;
