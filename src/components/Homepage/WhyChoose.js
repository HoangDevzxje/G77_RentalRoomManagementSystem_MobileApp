import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import {
  Building2,
  CheckCircle,
  Globe,
  MessageCircle,
  Smartphone,
  Users,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const reasons = [
  {
    icon: CheckCircle,
    title: "Tiết kiệm thời gian, chi phí",
    description:
      "Với thiết kế thông minh, giao diện dễ sử dụng, bám sát vào nghiệp vụ quản lý. Bạn có thể quản lý nhiều nhà trọ cùng một lúc! Giúp tiết kiệm thời gian và chi phí.",
  },
  {
    icon: Building2,
    title: "Nền tảng ổn định",
    description:
      "Chúng tôi luôn đảm bảo hệ thống có tính ổn định, luôn sẵn sàng phục vụ khách hàng. Mọi dữ liệu được sao lưu định kỳ.",
  },
  {
    icon: Smartphone,
    title: "Quản lý mọi lúc, mọi nơi",
    description:
      "Chỉ với thiết bị di động trên tay bạn có thể quản lý nhà trọ, phòng trọ bất cứ nơi đâu. Dù là ở nhà, đi công tác hay có thể là đi du lịch.",
  },
  {
    icon: Globe,
    title: "Không giới hạn",
    description:
      "Bạn có nhiều nhà trọ, có vài trăm phòng hoặc nhiều hơn. Ứng dụng được thiết kế hướng đến nhiều loại hình và quy mô có thể đáp ứng hầu hết nhu cầu.",
  },
  {
    icon: Users,
    title: "Tiếp cận tối người thuê phòng",
    description:
      "Trong công việc quản lý chúng ta cần trọng là sự thoải mái tài chính. Chúng tôi có nhiều nền tảng trợ giúp kết nối giữa người thuê và bạn.",
  },
  {
    icon: MessageCircle,
    title: "Tận tình, phục vụ chuyên nghiệp",
    description:
      "Luôn cố gắng tạo ra môi trường làm việc chuyên nghiệp, sáng tạo và kỷ luật cao. Với đội ngũ trẻ đầy nhiệt huyết, hỗ trợ tận tình luôn luôn sẵn sàng cùng bạn.",
  },
];

const ReasonCard = ({ item }) => {
  const IconComponent = item.icon;

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.iconCircle}>
        <IconComponent size={32} color="#fff" strokeWidth={2} />
      </View>

      <View style={styles.backgroundEffect} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
    </View>
  );
};

const WhyChoose = () => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>
        VÌ SAO NÊN CHỌN{" "}
        <Text style={styles.titleHighlight}>PHẦN MỀM QUẢN LÝ NHÀ TRỌ</Text> MIỄN
        PHÍ{" "}
        <Text style={styles.titleHighlight}>
          RENTAL ROOM - QUẢN LÝ NHÀ CHO THUÊ ?
        </Text>
      </Text>
      <Text style={styles.description}>
        Với xu hướng ứng dụng công nghệ vào thực tiễn chúng tôi nhận ra sự khó
        khăn và bất cập trong khâu quản lý nhà trọ, phòng trọ. Phần mềm ra đời
        nhằm giải quyết các vấn đề này.
      </Text>
    </View>

    <View style={styles.grid}>
      {reasons.map((item, index) => (
        <ReasonCard key={index} item={item} />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: "#f0f9ff",
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 28,
  },
  titleHighlight: {
    color: "#0891b2",
  },
  description: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
  },
  grid: {
    gap: 32,
  },
  cardWrapper: {
    position: "relative",
    paddingTop: 40,
    marginBottom: 16,
  },
  iconCircle: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -40,
    width: 80,
    height: 80,
    backgroundColor: "#06b6d4",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  backgroundEffect: {
    position: "absolute",
    top: 30,
    left: "5%",
    right: "5%",
    height: "90%",
    backgroundColor: "rgba(34, 211, 238, 0.3)",
    borderRadius: 16,
    transform: [{ rotate: "3deg" }],
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default WhyChoose;
