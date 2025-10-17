import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  Home,
  Heart,
  Shield,
  Users,
  Search,
  MapPin,
  Phone,
  Mail,
  Building,
  CreditCard,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";

const quickLinks = [
  { name: "Trang chủ", href: "/Home", icon: Home },
  { name: "Tìm phòng trọ", href: "/rooms", icon: Search },
  { name: "Đăng tin phòng", href: "/post-room", icon: Building },
  { name: "Liên hệ", href: "/contact", icon: Phone },
];

const supportLinks = [
  { name: "Trung tâm trợ giúp", href: "/help" },
  { name: "Hướng dẫn thuê phòng", href: "/rental-guide" },
  { name: "Hướng dẫn cho chủ nhà", href: "/landlord-guide" },
  { name: "Liên hệ hỗ trợ", href: "/support" },
];

const legalLinks = [
  { name: "Chính sách bảo mật", href: "/privacy" },
  { name: "Điều khoản dịch vụ", href: "/terms" },
  { name: "Chính sách thanh toán", href: "/payment-policy" },
  { name: "Quy định đăng tin", href: "/posting-policy" },
];

const features = [
  {
    icon: Search,
    title: "Tìm phòng dễ dàng",
    desc: "Hệ thống tìm kiếm thông minh",
  },
  {
    icon: Shield,
    title: "An toàn & Bảo mật",
    desc: "Thông tin được xác minh và bảo mật tuyệt đối",
  },
  {
    icon: Users,
    title: "Kết nối trực tiếp",
    desc: "Liên hệ trực tiếp với chủ nhà",
  },
  {
    icon: CreditCard,
    title: "Thanh toán linh hoạt",
    desc: "Hỗ trợ nhiều hình thức thanh toán tiện lợi",
  },
];

const socialLinks = [
  { icon: "facebook", href: "#" },
  { icon: "twitter", href: "#" },
  { icon: "instagram", href: "#" },
  { icon: "linkedin", href: "#" },
];

const contactInfo = [
  { icon: Phone, text: "024 3456 7890", href: "tel:02434567890" },
  {
    icon: Mail,
    text: "support@rentalroom.vn",
    href: "mailto:support@rentalroom.vn",
  },
  { icon: MapPin, text: "Hà Nội, Việt Nam", href: "#" },
];

// 👉 Hàm xử lý mở link
const handleLinkPress = (href, navigation) => {
  if (href.startsWith("/")) {
    // Link nội bộ → map route
    switch (href) {
      case "/Home":
        navigation.navigate("Trang chủ");
        break;
      case "/rooms":
        navigation.navigate("Tìm phòng");
        break;
      case "/post-room":
        navigation.navigate("Đăng tin phòng");
        break;
      case "/contact":
        navigation.navigate("Tài khoản"); // Hoặc màn Liên hệ riêng nếu có
        break;
      default:
        console.warn("Chưa map route:", href);
    }
  } else {
    // Link ngoài → mở bằng Linking
    Linking.openURL(href);
  }
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigation = useNavigation();

  return (
    <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Features */}
        <View style={styles.featuresRow}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureBox}>
              <View style={styles.featureIconBox}>
                <f.icon color="#fff" size={28} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Main Footer Content */}
        <View style={styles.companyBigBox}>
          <View style={styles.logoRowBig}>
            <LinearGradient
              colors={["#14b8a6", "#06b6d4"]}
              style={styles.logoBoxBig}
            >
              <Home color="white" size={38} />
            </LinearGradient>
            <View>
              <Text style={styles.logoTextBig}>Rental Room</Text>
              <Text style={styles.logoSubBig}>Quản lý phòng trọ</Text>
            </View>
          </View>
          <Text style={styles.descriptionBig}>
            Nền tảng quản lý phòng trọ hiện đại, kết nối người thuê và chủ nhà.
            Tìm kiếm phòng trọ phù hợp, đăng tin miễn phí và quản lý hiệu quả.
          </Text>
          {/* Contact Info */}
          {contactInfo.map((c, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleLinkPress(c.href, navigation)}
              style={styles.contactRowBig}
            >
              <c.icon color="#94a3b8" size={24} />
              <Text style={styles.contactTextBig}>{c.text}</Text>
            </TouchableOpacity>
          ))}
          {/* Social */}
          <View style={styles.socialRowBig}>
            {socialLinks.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.socialIconBig}
                onPress={() => handleLinkPress(s.href, navigation)}
              >
                <FontAwesome name={s.icon} size={24} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Links */}
        <View style={styles.columnsRow}>
          {/* Quick Links */}
          <View style={styles.column}>
            <Text style={styles.linksTitle}>Liên kết nhanh</Text>
            {quickLinks.map((l, i) => (
              <TouchableOpacity
                key={i}
                style={styles.linkRow}
                onPress={() => handleLinkPress(l.href, navigation)}
              >
                <l.icon size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={styles.linkText}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Support */}
          <View style={styles.column}>
            <Text style={styles.linksTitle}>Hỗ trợ</Text>
            {supportLinks.map((l, i) => (
              <TouchableOpacity
                key={i}
                style={styles.linkRow}
                onPress={() => handleLinkPress(l.href, navigation)}
              >
                <Text style={styles.linkText}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Legal */}
          <View style={styles.column}>
            <Text style={styles.linksTitle}>Pháp lý</Text>
            {legalLinks.map((l, i) => (
              <TouchableOpacity
                key={i}
                style={styles.linkRow}
                onPress={() => handleLinkPress(l.href, navigation)}
              >
                <Text style={styles.linkText}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyRow}>
          <Text style={styles.copyText}>
            © {currentYear} Rental Room. Made with{" "}
          </Text>
          <Heart size={18} color="red" style={{ marginHorizontal: 4 }} />
          <Text style={styles.copyText}>in Vietnam</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Footer;

const styles = StyleSheet.create({
  container: { paddingVertical: 60, paddingHorizontal: 10 },
  inner: { gap: 24 },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 10,
  },
  featureBox: {
    flex: 1,
    minWidth: 150,
    maxWidth: "100%",
    backgroundColor: "#1D2C3C",
    borderRadius: 16,
    padding: 18,
    marginBottom: 8,
    alignItems: "center",
  },
  featureIconBox: {
    backgroundColor: "#61D0E5",
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
    textAlign: "center",
  },
  featureDesc: {
    color: "#cbd5e1",
    fontSize: 14,
    textAlign: "center",
  },
  companyBigBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
    marginTop: 10,
  },
  logoRowBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 8,
  },
  logoBoxBig: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoTextBig: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#5eead4",
  },
  logoSubBig: {
    fontSize: 18,
    color: "#94a3b8",
    marginTop: 2,
  },
  descriptionBig: {
    fontSize: 17,
    color: "#fff",
    lineHeight: 24,
    marginVertical: 12,
  },
  contactRowBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 4,
  },
  contactTextBig: { fontSize: 17, color: "#e0e7ef" },
  socialRowBig: { flexDirection: "row", gap: 18, marginTop: 12 },
  socialIconBig: {
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  columnsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  column: {
    flex: 1,
    minWidth: 150,
    maxWidth: "48%",
    gap: 10,
    marginBottom: 10,
  },
  linksTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  linkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  linkText: { fontSize: 15, color: "#94a3b8" },
  copyRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  copyText: { fontSize: 14, color: "#94a3b8" },
});
