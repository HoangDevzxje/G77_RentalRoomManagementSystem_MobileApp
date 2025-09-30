import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.9;

const TestimonialCard = ({ testimonial }) => (
  <View style={styles.card}>
    <View style={styles.cardTopBorder} />
    <Text style={styles.quote}>{testimonial.quote}</Text>
    <Text style={styles.author}>{testimonial.author}</Text>
    <Text style={styles.role}>{testimonial.role}</Text>
  </View>
);

const Testimonials = () => {
  const scrollRef = useRef(null);
  const currentIndex = useRef(0);

  const testimonials = [
    {
      quote:
        "Hệ thống giúp tôi quản lý hiệu quả hơn 300%. Không còn lo lắng về việc quên thu tiền phòng hay theo dõi hợp đồng.",
      author: "Sarah J.",
      role: "Chủ trọ - 15 phòng",
    },
    {
      quote:
        "Tính năng báo cáo rất chi tiết, giúp tôi nắm được tình hình kinh doanh một cách chính xác và kịp thời.",
      author: "Michael T.",
      role: "Chủ trọ - 25 phòng",
    },
    {
      quote:
        "Giao diện đơn giản, dễ sử dụng. Khách thuê của tôi cũng rất hài lòng với tính năng thanh toán online.",
      author: "Elena R.",
      role: "Chủ trọ - 8 phòng",
    },
    {
      quote:
        "Phần mềm giúp tôi tiết kiệm rất nhiều thời gian trong việc quản lý hợp đồng và nhắc nhở thanh toán.",
      author: "David P.",
      role: "Chủ trọ - 12 phòng",
    },
    {
      quote:
        "Dịch vụ hỗ trợ khách hàng rất nhanh chóng và tận tình. Tôi cảm thấy yên tâm khi sử dụng lâu dài.",
      author: "Ngọc A.",
      role: "Chủ trọ - 20 phòng",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        currentIndex.current = (currentIndex.current + 1) % testimonials.length;

        scrollRef.current.scrollTo({
          x: currentIndex.current * width,
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LÝ DO CHỦ NHÀ CHỌN CHÚNG TÔI</Text>
        <Text style={styles.subtitle}>CẢM NHẬN TỪ KHÁCH HÀNG</Text>
        <Text style={styles.description}>
          Sự hài lòng của khách hàng là động lực giúp chúng tôi hoàn thiện ứng
          dụng, đồng thời mở ra cơ hội có thêm nhiều khách hàng mới trong tương
          lai. Chúng tôi chân thành cảm ơn khách hàng đã tin dùng cũng như đóng
          góp giúp phần mềm ngày càng hoàn thiện hơn!
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {testimonials.map((testimonial, index) => (
          <View key={index} style={{ width, alignItems: "center" }}>
            <TestimonialCard testimonial={testimonial} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    backgroundColor: "#f0f9ff",
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b82f6",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
  },
  scrollContent: {},
  card: {
    width: cardWidth,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTopBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#3b82f6",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  quote: {
    fontSize: 15,
    color: "#374151",
    fontStyle: "italic",
    marginBottom: 16,
    lineHeight: 22,
  },
  author: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "#6b7280",
  },
});

export default Testimonials;
