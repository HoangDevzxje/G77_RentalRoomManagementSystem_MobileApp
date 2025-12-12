import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import {
  ArrowRight,
  Building2,
  Home,
  Search,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Check,
  Sparkles,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { getPosts } from "../../api/postApi";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function HomeCombinedScreen({ navigation, route }) {
  const { isAuthenticated } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (route?.params?.fromLogin) {
      setShowSuccessAlert(true);
      const t = setTimeout(() => setShowSuccessAlert(false), 2000);
      return () => clearTimeout(t);
    }
  }, [route?.params]);

  const checkLoginSuccess = async () => {
    try {
      const justLoggedIn = await AsyncStorage.getItem("justLoggedIn");
      if (justLoggedIn === "true") {
        setShowSuccessAlert(true);
        await AsyncStorage.removeItem("justLoggedIn");
        const t = setTimeout(() => setShowSuccessAlert(false), 2000);
        return () => clearTimeout(t);
      }
    } catch (err) {
      console.log("checkLoginSuccess err", err);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await getPosts({ page: 1, limit: 4 });
      setPosts(res.data || res || []);
    } catch (err) {
      console.error("fetchPosts err", err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    } else {
      setPostsLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        fetchPosts();
      }
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (isAuthenticated) {
      fetchPosts();
    }
    setRefreshing(false);
  };

  const WhyChooseCard = ({ icon: Icon, title, desc, index }) => {
    const [anim] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.whyChooseCard,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Icon size={32} color="#3b82f6" style={styles.whyChooseIcon} />
        <Text style={styles.whyChooseTitle}>{title}</Text>
        <Text style={styles.whyChooseDesc}>{desc}</Text>
      </Animated.View>
    );
  };

  const FeatureCard = ({
    title,
    description,
    icon: Icon,
    color,
    features,
    buttonText,
    buttonIcon: ButtonIcon,
    onPress,
    index,
  }) => {
    const [cardAnim] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 800,
        delay: 400 + index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);

    const scale = cardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });

    const translateY = cardAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    return (
      <Animated.View
        style={[
          styles.featureCard,
          {
            opacity: cardAnim,
            transform: [{ scale }, { translateY }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          style={styles.cardTouchable}
        >
          {/* Decorative Elements */}
          <View style={[styles.cardBlob, { backgroundColor: `${color}10` }]} />
          <View style={[styles.cardBlob2, { backgroundColor: `${color}05` }]} />

          {/* Sparkle Icon */}
          <View style={styles.sparkleIcon}>
            <Sparkles size={20} color={color} />
          </View>

          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: color,
                  },
                ]}
              >
                <Icon size={24} color="white" />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <View
                  style={[styles.titleUnderline, { backgroundColor: color }]}
                />
              </View>
            </View>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>

          <View style={styles.cardContent}>
            {features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={[styles.checkIcon, { backgroundColor: color }]}>
                  <Check size={16} color="white" />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            <View style={[styles.highlightBox, { borderColor: `${color}20` }]}>
              <Sparkles size={16} color={color} />
              <Text style={[styles.highlightText, { color }]}>
                {index === 0
                  ? "Nhiều gói dịch vụ phù hợp mọi quy mô"
                  : "Hoàn toàn miễn phí cho người thuê"}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[
                styles.cardButton,
                {
                  backgroundColor: color,
                },
              ]}
              activeOpacity={0.8}
              onPress={onPress}
            >
              {ButtonIcon && <ButtonIcon size={20} color="white" />}
              <Text style={styles.cardButtonText}>{buttonText}</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const featureCards = [
    {
      title: "Bạn là Chủ trọ?",
      description:
        "Quản lý toàn bộ hoạt động nhà trọ chỉ trên một nền tảng chuyên nghiệp",
      icon: Building2,
      color: "#3b82f6",
      features: [
        "Quản lý phòng, người thuê, hợp đồng một cách hệ thống",
        "Tự động tạo hóa đơn & nhắc hạn thanh toán thông minh",
        "Đăng tin cho thuê dễ dàng với giao diện trực quan",
      ],
      buttonText: "Xem các gói dịch vụ",
      onPress: () => navigation.navigate("AboutUs"),
    },
    {
      title: "Bạn đang tìm phòng trọ?",
      description:
        "Tìm kiếm và lựa chọn phòng trọ phù hợp với nhu cầu của bạn một cách nhanh chóng",
      icon: Home,
      color: "#10b981",
      features: [
        "Thông tin rõ ràng, hình ảnh thật từ chủ trọ",
        "Liên hệ trực tiếp chủ trọ không qua trung gian",
        "Đặt lịch xem phòng, ký hợp đồng online tiện lợi",
      ],
      buttonText: "Tìm phòng trọ ngay bây giờ",
      buttonIcon: Search,
      onPress: () => navigation.navigate("PostList"),
    },
  ];

  const whyChooseData = [
    {
      icon: Shield,
      title: "Minh bạch 100%",
      desc: "Chỉ chủ trọ thật mới được đăng tin",
    },
    {
      icon: Clock,
      title: "Tiết kiệm thời gian",
      desc: "Quản lý tự động – Tìm phòng chỉ 5 phút",
    },
    {
      icon: Users,
      title: "Không trung gian",
      desc: "Liên hệ trực tiếp, không mất phí môi giới",
    },
    {
      icon: CheckCircle,
      title: "Hợp đồng online",
      desc: "Ký điện tử an toàn, hợp pháp",
    },
  ];

  const AnimatedText = ({ text, delay = 0 }) => {
    const [animatedText] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(animatedText, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, []);

    const translateY = animatedText.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0],
    });

    return (
      <Animated.Text
        style={[
          styles.heroTitlePart,
          {
            opacity: animatedText,
            transform: [{ translateY }],
          },
        ]}
      >
        {text}
      </Animated.Text>
    );
  };

  const GradientText = ({ text }) => {
    return <Text style={styles.gradientText}>{text}</Text>;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {showSuccessAlert && (
        <View style={[styles.topAlert, styles.successAlert]}>
          <CheckCircle size={20} color="white" style={styles.alertIcon} />
          <Text style={styles.alertMessage}>Đăng nhập thành công</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBackground}></View>

          <View style={styles.heroContent}>
            <View style={styles.heroTitleContainer}>
              <AnimatedText text="Hệ Thống" delay={50} />
              <GradientText text="Quản Lý & Tìm kiếm" />
              <AnimatedText text="Phòng Trọ" delay={110} />
            </View>

            <Text style={styles.heroDescription}>
              Một nền tảng giúp chủ trọ quản lý nhà trọ chuyên nghiệp và người
              thuê tìm phòng minh bạch, an toàn
            </Text>
          </View>
        </View>

        {/* Cards Section */}
        <View style={styles.cardsSection}>
          {featureCards.map((card, index) => (
            <FeatureCard key={index} index={index} {...card} />
          ))}
        </View>

        {/* Why Choose Us Section */}
        <View style={styles.whyChooseSection}>
          <Text style={styles.sectionTitle}>
            Tại sao nên chọn chúng tôi làm sự lựa chọn hàng đầu?
          </Text>

          <View style={styles.whyChooseGrid}>
            {whyChooseData.map((item, index) => (
              <WhyChooseCard key={index} index={index} {...item} />
            ))}
          </View>
        </View>
      </ScrollView>

      <Toast />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },
  scrollView: {
    flex: 1,
  },
  topAlert: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
    fontWeight: "600",
    flex: 1,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "#f0f9ff",
    position: "relative",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundBlob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.2,
  },
  blob1: {
    width: 200,
    height: 200,
    top: -100,
    left: -50,
    backgroundColor: "#3b82f6",
  },
  blob2: {
    width: 150,
    height: 150,
    bottom: -50,
    right: -30,
    backgroundColor: "#10b981",
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitlePart: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginHorizontal: 4,
  },
  gradientText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3b82f6",
    marginHorizontal: 4,
  },
  heroDescription: {
    fontSize: 16,
    color: "#374151",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "600",
  },

  // Cards Section
  cardsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
  },
  cardTouchable: {
    padding: 20,
  },
  cardBlob: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -80,
    right: -80,
    opacity: 0.1,
  },
  cardBlob2: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,
    bottom: -64,
    left: -64,
    opacity: 0.05,
  },
  sparkleIcon: {
    position: "absolute",
    top: 16,
    right: 16,
    opacity: 0,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  titleUnderline: {
    width: 64,
    height: 3,
    borderRadius: 2,
  },
  cardDescription: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
  },
  cardContent: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    fontWeight: "500",
  },
  highlightBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  cardFooter: {},
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },

  // Why Choose Section
  whyChooseSection: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 20,
    paddingVertical: 40,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 30,
  },
  whyChooseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  whyChooseCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  whyChooseIcon: {
    marginBottom: 12,
  },
  whyChooseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 6,
  },
  whyChooseDesc: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },

  // Posts Section
  postsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  postsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  postsHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  postsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  postsSubtitle: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  viewAllText: {
    color: "#0d9488",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 4,
  },
  postsScroll: {
    flexDirection: "row",
  },
  postCard: {
    width: width * 0.7,
    backgroundColor: "white",
    borderRadius: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  postImage: {
    height: 150,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  postContent: {
    padding: 16,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  postPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  postPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ef4444",
  },
  postType: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
  centerCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 8,
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  noResults: {
    color: "#6b7280",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
  },
});
