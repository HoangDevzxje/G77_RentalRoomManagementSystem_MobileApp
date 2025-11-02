import React, { useRef, useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HeroSection from "../../components/Homepage/HeroSection";
import StatsSection from "../../components/Homepage/StatsSection";
import WhyChoose from "../../components/Homepage/WhyChoose";
import Testimonials from "../../components/Homepage/Testimonials";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation, route }) => {
  const scrollViewRef = useRef(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    checkLoginSuccess();
  }, []);

  // Kiểm tra xem có phải vừa đăng nhập thành công không
  const checkLoginSuccess = async () => {
    try {
      const justLoggedIn = await AsyncStorage.getItem("justLoggedIn");

      if (justLoggedIn === "true") {
        // Hiển thị thông báo thành công
        setShowSuccessAlert(true);

        // Xóa flag sau khi hiển thị
        await AsyncStorage.removeItem("justLoggedIn");

        // Tự động ẩn thông báo sau 2 giây
        const timer = setTimeout(() => {
          setShowSuccessAlert(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.log("Error checking login status:", error);
    }
  };

  // Kiểm tra nếu có param từ navigation
  useEffect(() => {
    if (route.params?.fromLogin) {
      setShowSuccessAlert(true);
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [route.params]);

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

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <View style={styles.container}>
      {/* Thông báo thành công khi đăng nhập - CHỈ HIỆN KHI VỪA ĐĂNG NHẬP */}
      {showSuccessAlert && (
        <View style={[styles.topAlert, styles.successAlert]}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="white"
            style={styles.alertIcon}
          />
          <Text style={styles.alertMessage}>Đăng nhập thành công</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} ref={scrollViewRef}>
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
              khi nay bạn đã có thể quản lý nhà trọ của mình trên mọi thiết bị
              bạn có.
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
              Đăng ký ngay để trải nghiệm 30 ngày miễn phí và nhận hỗ trợ setup
              từ đội ngũ chuyên gia
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleRegister}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  scrollView: {
    flex: 1,
  },
  // Top Alert Styles
  topAlert: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  successAlert: {
    backgroundColor: "#10B981",
  },
  alertIcon: {
    marginRight: 8,
  },
  alertMessage: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  platformSection: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0891b2",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  platformGrid: {
    gap: 20,
  },
  platformCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#0891b2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  platformImage: {
    width: "100%",
    height: 220,
  },
  platformContent: {
    padding: 20,
    alignItems: "center",
  },
  platformButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  platformDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21,
  },
  featuresSection: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  featureTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  featureCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 24,
  },
  featureCardDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21,
  },
  ctaSection: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  ctaCard: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 28,
    padding: 36,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.2)",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  ctaDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  ctaButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ctaNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaNoteText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
});

export default HomeScreen;
