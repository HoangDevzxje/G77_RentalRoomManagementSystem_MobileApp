import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getNotificationById } from "../../api/notificationsApi";
import { useNotifications } from "../../context/NotificationContext";

const AutoHeightImage = ({ uri }) => {
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (uri) {
      Image.getSize(
        uri,
        (width, height) => {
          if (width > 0 && height > 0) {
            setAspectRatio(width / height);
          }
        },
        (error) => console.log("Lỗi tải ảnh:", error)
      );
    }
  }, [uri]);

  return (
    <Image
      source={{ uri }}
      style={[styles.image, { aspectRatio: aspectRatio }]}
      resizeMode="contain"
    />
  );
};

const NotificationDetail = ({ route }) => {
  const { id } = route.params || {};
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { markAsRead } = useNotifications();

  const [noti, setNoti] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await getNotificationById(id);
        setNoti(res.data || res);
      } catch (e) {
        console.error("Lỗi tải thông báo:", e);
      } finally {
        setLoading(false);
      }
    };
    if (isFocused) loadDetail();
  }, [id, isFocused]);

  useEffect(() => {
    if (id && isFocused && !hasMarkedRef.current) {
      markAsRead(id);
      hasMarkedRef.current = true;
    }
    return () => {
      if (!isFocused) hasMarkedRef.current = false;
    };
  }, [id, isFocused, markAsRead]);

  const getRoleLabel = (role) => {
    switch (role) {
      case "landlord":
        return "Chủ trọ";
      case "staff":
        return "Nhân viên";
      case "resident":
        return "Cư dân";
      case "system":
        return "Hệ thống";
      default:
        return "Ban quản lý";
    }
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case "bill":
        return {
          label: "Hóa đơn",
          color: "#F59E0B",
          bg: "#FEF3C7",
          icon: "receipt-outline",
        };
      case "maintenance":
        return {
          label: "Bảo trì",
          color: "#EF4444",
          bg: "#FEE2E2",
          icon: "construct-outline",
        };
      case "reminder":
        return {
          label: "Nhắc nhở",
          color: "#8B5CF6",
          bg: "#EDE9FE",
          icon: "alarm-outline",
        };
      case "event":
        return {
          label: "Sự kiện",
          color: "#10B981",
          bg: "#D1FAE5",
          icon: "calendar-outline",
        };
      case "general":
      default:
        return {
          label: "Thông báo chung",
          color: "#3B82F6",
          bg: "#DBEAFE",
          icon: "newspaper-outline",
        };
    }
  };

  const handleOpenLink = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error("Không thể mở link:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!noti) return null;

  const typeInfo = getTypeInfo(noti.type);
  const senderName =
    noti.createBy?.fullName ||
    noti.createBy?.username ||
    getRoleLabel(noti.createByRole);
  const senderAvatar = noti.createBy?.avatar;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.titleContainer}>
            <View style={styles.topRow}>
              <View
                style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}
              >
                <Ionicons
                  name={typeInfo.icon}
                  size={12}
                  color={typeInfo.color}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.typeText, { color: typeInfo.color }]}>
                  {typeInfo.label}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(noti.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>

            <Text style={styles.notificationTitle}>{noti.title}</Text>
          </View>
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              {senderAvatar ? (
                <Image
                  source={{ uri: senderAvatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                </View>
              )}

              <View>
                <Text style={styles.metaLabel}>Người gửi</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.metaValue}>{senderName}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.contentSection}>
            <Text style={styles.notificationContent}>{noti.content}</Text>
          </View>
          {noti.link && (
            <View style={styles.linkSection}>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => handleOpenLink(noti.link)}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="link" size={20} color="#007AFF" />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {noti.link}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footerSection}>
            <View style={styles.footerDivider} />
            <View style={styles.footerMeta}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.footerText}>
                {new Date(noti.createdAt).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        {noti.images && noti.images.length > 0 && (
          <View style={styles.imagesContainer}>
            <View style={styles.imagesHeader}>
              <Ionicons name="images-outline" size={18} color="#6B7280" />
              <Text style={styles.imagesTitle}>
                Hình ảnh đính kèm ({noti.images.length})
              </Text>
            </View>
            <View style={styles.imagesGrid}>
              {noti.images.map((img, index) => (
                <AutoHeightImage key={index} uri={img} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 28,
  },
  metaContainer: {
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  metaLabel: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  metaRole: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
  },
  contentSection: {
    marginBottom: 16,
  },
  notificationContent: {
    fontSize: 16,
    lineHeight: 26,
    color: "#374151",
  },
  linkSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    gap: 8,
  },
  linkText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "500",
  },
  footerSection: {},
  footerDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  imagesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  imagesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  imagesGrid: {
    gap: 16,
  },
  image: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
});

export default NotificationDetail;
