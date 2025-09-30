import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Globe,
  ShieldCheck,
  Car,
  Wallet,
  UserCog,
} from "lucide-react-native";
import HeroSection from "../../components/Homepage/HeroSection";
import StatsSection from "../../components/Homepage/StatsSection";
import WhyChoose from "../../components/Homepage/WhyChoose";
import Testimonials from "../../components/Homepage/Testimonials";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);

  const features = [
    {
      icon: Building2,
      title: "Quản lý nhiều nhà trọ - chung cư - ktx, sleepbox, homestay",
      description:
        "Có thể cùng một lúc quản lý nhiều nhà trọ - tòa nhà chung cư - ktx, đồng thời cũng có thể theo dõi tổng quan, chi tiết thông tin nhà cho thuê của mình với tính năng này.",
      gradient: ["#60a5fa", "#2563eb"],
    },
    {
      icon: Users,
      title: "Quản lý phòng trọ, căn hộ, giường - sleepbox",
      description:
        "Các thông tin về phòng trọ như khách thuê phòng, số điện thoại, trạng thái phòng,... sẽ được cung cấp bởi tính năng này. Việc quản lý phòng trọ sẽ đơn giản hơn nhiều.",
      gradient: ["#38bdf8", "#3b82f6"],
    },
    {
      icon: DollarSign,
      title: "Hóa đơn tiền phòng, thu tiền",
      description:
        "Chúng tôi giúp bạn theo dõi và tính toán tiền điện, nước, dịch vụ,... chốt tiền phòng hàng tháng một cách tự động, in hóa đơn cho khách thuê. Theo dõi thu tiền phòng hàng tháng cho bạn.",
      gradient: ["#22d3ee", "#2563eb"],
    },
    {
      icon: FileText,
      title: "Quản lý cọc giữ chỗ và hợp đồng thuê nhà",
      description:
        "Lưu giữ tất cả thông tin khách thuê, tiền cọc, ngày cọc,... với chức năng này bạn sẽ không cần phải ghi nhớ bất cứ thông tin đặt cọc nào.",
      gradient: ["#3b82f6", "#4f46e5"],
    },
    {
      icon: ShieldCheck,
      title: "Quản lý khách thuê",
      description:
        "Quản lý các thông tin về khách thuê phòng, tình trạng giấy tờ tùy thân, tình trạng đăng ký tạm trú. Ngoài ra phần mềm còn hỗ trợ đăng ký tạm trú online trên dịch vụ công.",
      gradient: ["#0ea5e9", "#1d4ed8"],
    },
    {
      icon: BarChart3,
      title: "Thống kê báo cáo",
      description:
        "Bạn sẽ theo dõi tổng quan hoạt động của nhà trọ, phòng trọ để sắp xếp công việc hợp lý, đồng thời nắm bắt nhanh doanh thu, chi phí và tỉ lệ phòng trống.",
      gradient: ["#0ea5e9", "#1d4ed8"],
    },
    {
      icon: Car,
      title: "Quản lý xe, tài sản",
      description:
        "Quản lý thông tin xe của khách & tài sản khách sử dụng trong quá trình thuê nhà, kiểm kệ tình trạng của tài sản.",
      gradient: ["#0ea5e9", "#1d4ed8"],
    },
    {
      icon: Wallet,
      title: "Quản lý tài chính",
      description:
        "Mọi thu, chi tổng kết kinh doanh sẽ được lưu trữ và tính toán tự động bạn sẽ không còn đau đầu với những con số.",
      gradient: ["#2563eb", "#4338ca"],
    },
    {
      icon: UserCog,
      title: "Quản lý nhân viên",
      description:
        "Phần mềm cung cấp tính năng phân quyền để bạn có thể tổ chức công ty hoặc đội nhóm cùng tham gia quản lý.",
      gradient: ["#0ea5e9", "#1d4ed8"],
    },
  ];

  const platforms = [
    {
      image: "https://quanlytro.me/images/banner_ipad_flatform.webp",
      title: "Quản lý trên điện thoại",
      description:
        "Quản lý ngay trên chiếc điện thoại. Nhẹ nhàng, thuận tiện, linh hoạt với đầy đủ tính năng và được đồng bộ với các nền tảng khác.",
      gradient: ["#a78bfa", "#6366f1"],
    },
    {
      image: "https://quanlytro.me/images/banner_mobile_flatform.webp",
      title: "Quản lý trên máy tính bảng",
      description:
        "Nếu bạn đang có chiếc máy tính bảng là một lợi thế. Bạn có thể kết hợp được sự linh hoạt giữa điện thoại và máy tính.",
      gradient: ["#34d399", "#059669"],
    },
    {
      image: "https://quanlytro.me/images/banner_desktop_flatform.webp",
      title: "Quản lý trên máy tính",
      description:
        "Quản lý ngay trên website mà không cần cài đặt app. Tất cả các tính năng sẽ rất chi tiết, sẽ giúp bạn quản lý thuận tiện đầy đủ.",
      gradient: ["#38bdf8", "#3b82f6"],
    },
  ];

  return (
    <ScrollView style={styles.container} ref={scrollViewRef}>
      {/* Hero Section */}
      <HeroSection navigation={navigation} />

      {/* Stats Section */}
      <StatsSection />

      {/* Multi-Platform Section */}
      <View style={styles.platformSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUẢN LÝ TRÊN ĐA NỀN TẢNG</Text>
          <Text style={styles.sectionSubtitle}>
            ĐIỆN THOẠI - IPAD - MÁY TÍNH - WEBSITE
          </Text>
          <Text style={styles.sectionDescription}>
            Với sự đa dạng về nền tảng sẽ giúp bạn quản lý nhà trọ linh động
            hơn, thay vì mẫu excel phức tạp hay sổ sách rờm rà. Thật tuyệt vời
            khi nay bạn đã có thể quản lý nhà trọ của mình trên mọi thiết bị bạn
            có.
          </Text>
        </View>

        <View style={styles.platformGrid}>
          {platforms.map((platform, index) => (
            <View key={index} style={styles.platformCard}>
              <Image
                source={{ uri: platform.image }}
                style={styles.platformImage}
                resizeMode="cover"
              />
              <View style={styles.platformContent}>
                <View
                  style={[
                    styles.platformButton,
                    { backgroundColor: platform.gradient[0] },
                  ]}
                >
                  <Text style={styles.platformButtonText}>
                    {platform.title}
                  </Text>
                </View>
                <Text style={styles.platformDescription}>
                  {platform.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.featureTitle}>Tính Năng Nổi Bật</Text>
          <Text style={styles.sectionDescription}>
            Giải pháp toàn diện từ A-Z cho việc quản lý phòng trọ hiện đại
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIcon,
                    { backgroundColor: feature.gradient[0] },
                  ]}
                >
                  <IconComponent size={32} color="#fff" strokeWidth={2} />
                </View>
                <Text style={styles.featureCardTitle}>{feature.title}</Text>
                <Text style={styles.featureCardDescription}>
                  {feature.description}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Why Choose Section */}
      <WhyChoose />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <View style={styles.ctaCard}>
          <Globe size={64} color="#2563eb" strokeWidth={2} />
          <Text style={styles.ctaTitle}>Sẵn Sàng Bắt Đầu?</Text>
          <Text style={styles.ctaDescription}>
            Đăng ký ngay để trải nghiệm 30 ngày miễn phí và nhận hỗ trợ setup từ
            đội ngũ chuyên gia
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Đăng Ký Ngay</Text>
            <ArrowRight size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.ctaNote}>
            <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            <Text style={styles.ctaNoteText}>Không cần thẻ tín dụng</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  platformSection: {
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#0891b2",
    textAlign: "center",
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 17,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  platformGrid: {
    gap: 16,
  },
  platformCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  platformImage: {
    width: "100%",
    height: 200,
  },
  platformContent: {
    padding: 16,
    alignItems: "center",
  },
  platformButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  platformButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  platformDescription: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  featuresSection: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  featureTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    alignItems: "center",
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
  },
  featureCardDescription: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  ctaCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  ctaDescription: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  ctaNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaNoteText: {
    fontSize: 14,
    color: "#475569",
  },
});

export default HomeScreen;
