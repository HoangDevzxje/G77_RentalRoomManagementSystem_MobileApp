import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { ArrowRight } from "lucide-react-native";

const HeroSection = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>
          <Text style={styles.titleNormal}>Quản Lý </Text>
          <Text style={styles.titleGradient}>Phòng Trọ </Text>
          <Text style={styles.titleNormal}>Hiện Đại</Text>
        </Text>

        <Text style={styles.subtitle}>
          Hiệu quả - Chuyên nghiệp - Tránh sai sót... Quản lý chưa bao giờ dễ
          dàng hơn thế!
        </Text>

        <Text style={styles.description}>
          Chúng tôi mang đến một ứng dụng tuyệt vời giúp bạn có thể dễ dàng quản
          lý nhà trọ, nhà cho thuê, chung cư mini, chuỗi căn hộ, ký túc xá, văn
          phòng cho thuê... Dù quy mô nhỏ hay lớn với công nghệ 4.0 không còn
          thời quản lý phòng cho thuê bằng excel, RENTAL ROOM sẽ hỗ trợ bạn giải
          quyết các vấn về như lưu trữ thông tin, hợp đồng, khách hàng, hóa đơn
          tiền thuê nhà tự động...
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Dùng Thử Miễn Phí</Text>
            <ArrowRight size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Xem Demo</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={{
            uri: "https://quanlytro.me/images/banner-home.webp?version=244342",
          }}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: "#f0f9ff",
  },
  content: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 33,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 40,
  },
  titleNormal: {
    color: "#1e293b",
  },
  titleGradient: {
    color: "#2563eb",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 28,
    paddingHorizontal: 5,
  },
  description: {
    fontSize: 17,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1d4ed8",
    fontSize: 15,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 260, // giảm bớt chiều cao
  },
});

export default HeroSection;
