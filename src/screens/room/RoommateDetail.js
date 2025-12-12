import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { getRoommateDetail } from "../../api/roomatesApi";

export default function RoommateDetail({ route, navigation }) {
  const { userId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const loadData = async (showLoading = true) => {
    if (!userId) return;

    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const res = await getRoommateDetail(userId);
      const payload = res?.data ?? res;
      const d = payload?.data ?? payload;
      setData(d);
    } catch (err) {
      console.error("roommate detail err", err);
      Toast.show({
        type: "error",
        text1: "Lỗi tải thông tin",
        text2:
          err?.response?.data?.message ||
          err?.message ||
          "Không thể lấy thông tin chi tiết",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [userId]);

  const handleBack = () => {
    navigation?.goBack();
  };

  const handleRefresh = () => {
    loadData(false);
  };

  const openPhone = async (rawNumber) => {
    if (!rawNumber) {
      Toast.show({ type: "info", text1: "Số điện thoại không hợp lệ" });
      return;
    }
    // Chuẩn hoá số (bỏ khoảng trắng)
    const number = `${rawNumber}`.replace(/\s+/g, "");
    const scheme =
      Platform.OS === "ios" ? `telprompt:${number}` : `tel:${number}`;
    try {
      const supported = await Linking.canOpenURL(scheme);
      if (!supported) {
        Toast.show({
          type: "error",
          text1: "Thiết bị không hỗ trợ gọi điện",
        });
        return;
      }
      await Linking.openURL(scheme);
      // Không cần thông báo thành công — hệ thống sẽ mở app gọi
    } catch (err) {
      console.error("openPhone error:", err);
      Toast.show({
        type: "error",
        text1: "Không thể gọi",
        text2: "Có lỗi khi mở ứng dụng gọi điện",
      });
    }
  };

  const openEmail = async (email) => {
    if (!email) {
      Toast.show({ type: "info", text1: "Email không hợp lệ" });
      return;
    }
    const mailto = `mailto:${email}`;
    try {
      const supported = await Linking.canOpenURL(mailto);
      if (!supported) {
        Toast.show({
          type: "error",
          text1: "Thiết bị không hỗ trợ gửi email",
        });
        return;
      }
      await Linking.openURL(mailto);
    } catch (err) {
      console.error("openEmail error:", err);
      Toast.show({
        type: "error",
        text1: "Không thể mở email",
        text2: "Có lỗi khi mở ứng dụng email",
      });
    }
  };

  const handleContact = (type, value) => {
    if (!value || value === "Chưa cập nhật") {
      Toast.show({
        type: "info",
        text1: "Thông tin chưa có",
        text2: `Người này chưa cập nhật ${
          type === "phone" ? "số điện thoại" : "email"
        }`,
      });
      return;
    }

    if (type === "phone") {
      // Hiển thị confirm trước khi gọi
      const displayName =
        data?.userInfo?.fullName || data?.fullName || "người này";
      Alert.alert(
        "Gọi điện",
        `Bạn có muốn gọi cho ${displayName} (${value})?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Gọi",
            onPress: () => openPhone(value),
          },
        ]
      );
    } else if (type === "email") {
      const displayName =
        data?.userInfo?.fullName || data?.fullName || "người này";
      Alert.alert(
        "Gửi email",
        `Bạn có muốn gửi email cho ${displayName} (${value})?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Mở email",
            onPress: () => openEmail(value),
          },
        ]
      );
    }
  };

  const InfoCard = ({ title, value, icon, type, onPress }) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name={icon} size={18} color="#0d9488" />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {onPress && value !== "Chưa cập nhật" && (
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => onPress(type, value)}
          >
            <Ionicons
              name={type === "phone" ? "call-outline" : "mail-outline"}
              size={16}
              color="#0d9488"
            />
          </TouchableOpacity>
        )}
      </View>
      <Text
        style={[
          styles.cardValue,
          value === "Chưa cập nhật" && styles.placeholderText,
        ]}
      >
        {value}
      </Text>
    </View>
  );

  const StatusBadge = ({ isMainTenant, isMe }) => (
    <View style={styles.badgeContainer}>
      {isMainTenant && (
        <View style={[styles.badge, styles.mainTenantBadge]}>
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.badgeText}>Chủ phòng</Text>
        </View>
      )}
      {isMe && (
        <View style={[styles.badge, styles.meBadge]}>
          <Text style={styles.badgeText}>Bạn</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <View style={styles.wrapper}>
          <Header
            onBack={handleBack}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.loadingText}>Đang tải thông tin...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <View style={styles.wrapper}>
          <Header
            onBack={handleBack}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
          <View style={styles.center}>
            <Ionicons name="person-outline" size={64} color="#cbd5e1" />
            <Text style={styles.errorTitle}>Không tìm thấy thông tin</Text>
            <Text style={styles.errorSubtitle}>
              Người dùng không tồn tại hoặc bạn không có quyền xem
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const userInfo = data.userInfo || {};
  const fullName = (
    userInfo.fullName ||
    data.fullName ||
    "Chưa cập nhật"
  ).trim();
  const phoneNumber =
    userInfo.phoneNumber || data.phoneNumber || "Chưa cập nhật";
  const email = data.email || "Chưa cập nhật";
  const dob = userInfo.dob || data.dob;
  const gender = userInfo.gender || data.gender || "Chưa cập nhật";
  const address = userInfo.address || data.address || "Chưa cập nhật";
  const isMainTenant = data.isMainTenant || false;
  const isMe = data.isMe || false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />
      <View style={styles.wrapper}>
        <Header
          onBack={handleBack}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#0d9488"]}
              tintColor="#0d9488"
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(fullName[0] || email[0] || "U").toUpperCase()}
                </Text>
              </View>
              <StatusBadge isMainTenant={isMainTenant} isMe={isMe} />
            </View>

            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

            <InfoCard
              title="Số điện thoại"
              value={phoneNumber}
              icon="call-outline"
              type="phone"
              onPress={handleContact}
            />

            <InfoCard
              title="Email"
              value={email}
              icon="mail-outline"
              type="email"
              onPress={handleContact}
            />
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

            <InfoCard
              title="Ngày sinh"
              value={
                dob
                  ? new Date(dob).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"
              }
              icon="calendar-outline"
            />

            <InfoCard
              title="Giới tính"
              value={getGenderText(gender)}
              icon="person-outline"
            />

            <InfoCard title="Địa chỉ" value={address} icon="location-outline" />
          </View>

          {/* Room Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin phòng</Text>

            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Ionicons name="business-outline" size={18} color="#0d9488" />
                  <Text style={styles.cardTitle}>Vai trò</Text>
                </View>
              </View>
              <Text style={styles.cardValue}>
                {isMainTenant
                  ? "Chủ phòng (Người đứng tên hợp đồng)"
                  : "Thành viên"}
              </Text>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.footerNote}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#64748b"
            />
            <Text style={styles.footerText}>
              Chỉ có thể xem thông tin của người cùng phòng
            </Text>
          </View>
        </ScrollView>

        <Toast />
      </View>
    </SafeAreaView>
  );
}

const Header = ({ onBack, onRefresh, refreshing }) => (
  <View style={styles.headerBar}>
    <TouchableOpacity style={styles.backBtn} onPress={onBack}>
      <Ionicons name="arrow-back" size={22} color="#0f172a" />
    </TouchableOpacity>

    <Text style={styles.headerTitle}>Chi tiết thành viên</Text>

    <TouchableOpacity
      style={styles.refreshBtn}
      onPress={onRefresh}
      disabled={refreshing}
    >
      <Ionicons
        name="refresh"
        size={20}
        color={refreshing ? "#94a3b8" : "#0f172a"}
      />
    </TouchableOpacity>
  </View>
);

const getGenderText = (gender) => {
  const genderMap = {
    male: "Nam",
    female: "Nữ",
    other: "Khác",
  };
  return genderMap[gender] || gender || "Chưa cập nhật";
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  wrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  refreshBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  profileHeader: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0d9488",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "600",
  },
  badgeContainer: {
    position: "absolute",
    bottom: -4,
    right: -4,
    flexDirection: "row",
    gap: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  mainTenantBadge: {
    backgroundColor: "#f59e0b",
  },
  meBadge: {
    backgroundColor: "#0d9488",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minHeight: Platform.OS === "ios" ? 80 : undefined,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 22,
  },
  placeholderText: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontWeight: "400",
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
    lineHeight: 18,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
