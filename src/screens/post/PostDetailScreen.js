import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { getPostById } from "../../api/postApi";

const { width } = Dimensions.get("window");
const DEFAULT_IMAGE =
  "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg";

export default function PostDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        const data = await getPostById(id);
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [id]);

  const openZaloChat = async (phoneNumber) => {
    if (!phoneNumber) return;
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, "");
    const zaloDeepLink = `zalo://chat?phone=${cleanedPhone}`;
    const zaloWebLink = `https://zalo.me/${cleanedPhone}`;

    try {
      const supported = await Linking.canOpenURL(zaloDeepLink);
      if (supported) {
        await Linking.openURL(zaloDeepLink);
      } else {
        await Linking.openURL(zaloWebLink);
      }
    } catch (error) {
      console.error("Lỗi mở Zalo:", error);
      Linking.openURL(`tel:${cleanedPhone}`);
    }
  };

  const makePhoneCall = (phoneNumber) => {
    if (!phoneNumber) return;
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, "");
    Linking.openURL(`tel:${cleanedPhone}`);
  };

  const extractTextFromHTML = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  };

  const isHTMLContent = (content) => {
    return (
      content &&
      (content.includes("<p>") ||
        content.includes("<div") ||
        content.includes("<br") ||
        content.includes("<h") ||
        content.includes("<ul") ||
        content.includes("<li"))
    );
  };

  const handleImageError = () => setImageError(true);

  const getImageUri = () => {
    if (imageError) return DEFAULT_IMAGE;
    if (post?.images?.length > 0) {
      return post.images[currentImageIndex] || DEFAULT_IMAGE;
    }
    return DEFAULT_IMAGE;
  };

  const getImageList = () =>
    post?.images?.length > 0 ? post.images : [DEFAULT_IMAGE];

  const handleNextImage = () => {
    const images = getImageList();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    const images = getImageList();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (priceMin, priceMax) => {
    if (!priceMin && !priceMax) return "Liên hệ";
    const f = (p) => p.toLocaleString("vi-VN") + "đ";
    return priceMin === priceMax
      ? f(priceMin)
      : `${f(priceMin)} - ${f(priceMax)}`;
  };

  const formatArea = (areaMin, areaMax) => {
    if (!areaMin && !areaMax) return "N/A";
    return areaMin === areaMax ? `${areaMin}m²` : `${areaMin} - ${areaMax}m²`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRoomPress = (roomId) => {
    navigation.navigate("RoomDetail", { id: roomId });
  };

  const htmlRenderStyles = {
    body: { fontSize: 15, lineHeight: 24, color: "#475569" },
    p: { marginBottom: 14 },
    h1: {
      fontSize: 20,
      fontWeight: "700",
      color: "#0f172a",
      marginVertical: 12,
    },
    h2: {
      fontSize: 18,
      fontWeight: "600",
      color: "#1e293b",
      marginVertical: 10,
    },
    ul: { paddingLeft: 8, marginBottom: 14 },
    li: { marginBottom: 8, lineHeight: 22 },
    a: { color: "#14b8a6", textDecorationLine: "underline" },
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
        <Text style={styles.errorText}>Không tìm thấy bài đăng</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài đăng</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUri() }}
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
          />

          {/* Status Badge */}
          {post.isDraft && (
            <View style={[styles.statusBadge, { backgroundColor: "#f59e0b" }]}>
              <Text style={styles.statusText}>Bản nháp</Text>
            </View>
          )}
          {post.status === "hidden" && !post.isDraft && (
            <View style={[styles.statusBadge, { backgroundColor: "#64748b" }]}>
              <Text style={styles.statusText}>Đã ẩn</Text>
            </View>
          )}
          {post.status === "expired" && !post.isDraft && (
            <View style={[styles.statusBadge, { backgroundColor: "#dc2626" }]}>
              <Text style={styles.statusText}>Hết hạn</Text>
            </View>
          )}

          {/* Navigation & Dots */}
          {getImageList().length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.navLeft]}
                onPress={handlePrevImage}
              >
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, styles.navRight]}
                onPress={handleNextImage}
              >
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
              <View style={styles.dotsContainer}>
                {getImageList().map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentImageIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.content}>
          {/* 1. Tiêu đề + Giá */}
          <View style={styles.section}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.price}>
              {formatPrice(post.priceMin, post.priceMax)}/tháng
            </Text>
          </View>

          {/* 2. Địa chỉ */}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color="#0f172a" />
            <Text style={styles.address}>{post.address}</Text>
          </View>

          {/* 3. Thông tin nhanh: Diện tích + Ngày đăng */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="resize-outline" size={18} color="#64748b" />
              <Text style={styles.infoText}>
                {formatArea(post.areaMin, post.areaMax)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color="#64748b" />
              <Text style={styles.infoText}>{formatDate(post.createdAt)}</Text>
            </View>
          </View>

          {/* 4. Danh sách phòng - ƯU TIÊN CAO */}
          {post.rooms && post.rooms.length > 0 && (
            <View style={styles.roomsSection}>
              <View style={styles.roomsHeader}>
                <Ionicons name="bed-outline" size={18} color="#6366f1" />
                <Text style={styles.roomsTitle}>
                  Danh sách phòng ({post.rooms.length})
                </Text>
              </View>
              <View style={styles.roomsCompactList}>
                {post.rooms.map((room) => (
                  <TouchableOpacity
                    key={room._id}
                    style={[
                      styles.roomCompactCard,
                      room.status === "rented" && styles.roomRentedCard,
                    ]}
                    onPress={() => handleRoomPress(room._id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roomCardHeader}>
                      <Text style={styles.roomName} numberOfLines={1}>
                        {room.name || `Phòng ${room.roomNumber}`}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#6366f1"
                      />
                    </View>
                    <Text style={styles.roomPrice}>
                      {room.price?.toLocaleString("vi-VN")}đ
                    </Text>
                    {room.status === "rented" && (
                      <Text style={styles.rentedLabel}>Đã thuê</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* 5. Mô tả chi tiết */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            {post.description && isHTMLContent(post.description) ? (
              <View style={styles.htmlContainer}>
                <RenderHtml
                  contentWidth={width - 40}
                  source={{ html: post.description }}
                  tagsStyles={htmlRenderStyles}
                  baseStyle={styles.htmlBaseStyle}
                />
              </View>
            ) : (
              <Text style={styles.description}>
                {post.description
                  ? extractTextFromHTML(post.description)
                  : "Không có mô tả"}
              </Text>
            )}
          </View>

          {/* 6. Thông tin tòa nhà (nếu có) */}
          {/* {post.buildingId && typeof post.buildingId === "object" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tòa nhà</Text>
              <View style={styles.buildingInfoCard}>
                <Ionicons name="business-outline" size={18} color="#64748b" />
                <View style={styles.buildingTextInfo}>
                  <Text style={styles.buildingInfoText}>
                    {post.buildingId.name || "Tòa nhà"}
                  </Text>
                  {post.buildingId.address && (
                    <Text style={styles.buildingAddress}>
                      {post.buildingId.address}
                    </Text>
                  )}
                </View>
              </View> */}

          {/* Tiện ích */}
          {/* {(post.buildingId.ePrice !== undefined ||
                post.buildingId.wPrice !== undefined) && (
                <View style={styles.utilitiesRow}>
                  {post.buildingId.ePrice !== undefined && (
                    <View style={styles.utilityItem}>
                      <Ionicons name="flash" size={18} color="#f59e0b" />
                      <View style={styles.utilityInfo}>
                        <Text style={styles.utilityLabel}>Điện</Text>
                        <Text style={styles.utilityValue}>
                          {post.buildingId.eIndexType === "included"
                            ? "Bao gồm"
                            : `${post.buildingId.ePrice?.toLocaleString()}đ/kWh`}
                        </Text>
                      </View>
                    </View>
                  )}
                  {post.buildingId.wPrice !== undefined && (
                    <View style={styles.utilityItem}>
                      <Ionicons name="water" size={18} color="#0ea5e9" />
                      <View style={styles.utilityInfo}>
                        <Text style={styles.utilityLabel}>Nước</Text>
                        <Text style={styles.utilityValue}>
                          {post.buildingId.wIndexType === "included"
                            ? "Bao gồm"
                            : `${post.buildingId.wPrice?.toLocaleString()}đ/m³`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )} */}

          {/* Tiện nghi */}
          {/* {post.buildingId.amenities &&
                post.buildingId.amenities.length > 0 && (
                  <View style={styles.amenitiesSection}>
                    <Text style={styles.amenitiesTitle}>Tiện nghi</Text>
                    <View style={styles.amenitiesList}>
                      {post.buildingId.amenities.map((amenity, index) => (
                        <View key={index} style={styles.amenityTag}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#14b8a6"
                          />
                          <Text style={styles.amenityText}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

              {post.buildingId.description && (
                <View style={styles.buildingDescSection}>
                  <Text style={styles.buildingDescText}>
                    {post.buildingId.description}
                  </Text>
                </View>
              )} */}
          {/* </View>
          )} */}

          {/* 7. Thông tin liên hệ */}
          {post.landlordId && typeof post.landlordId === "object" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Liên hệ chủ nhà</Text>
              <View style={styles.landlordCard}>
                <View style={styles.landlordAvatar}>
                  <Ionicons name="person" size={24} color="#14b8a6" />
                </View>
                <View style={styles.landlordInfo}>
                  <Text style={styles.landlordName}>
                    {post.landlordId.fullName || "Chủ nhà"}
                  </Text>
                  {post.landlordId.phoneNumber && (
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={14} color="#64748b" />
                      <Text style={styles.landlordContact}>
                        {post.landlordId.phoneNumber}
                      </Text>
                    </View>
                  )}
                  {post.landlordId.email && (
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={14} color="#64748b" />
                      <Text style={styles.landlordContact}>
                        {post.landlordId.email}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {post.status === "active" && !post.isDraft ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => openZaloChat(post.landlordId?.phoneNumber)}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color="white"
              />
              <Text style={styles.primaryButtonText}>Nhắn Zalo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => makePhoneCall(post.landlordId?.phoneNumber)}
            >
              <Ionicons name="call-outline" size={20} color="#14b8a6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="heart-outline" size={20} color="#14b8a6" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.disabledButton} disabled>
            <Text style={styles.disabledButtonText}>
              {post.isDraft
                ? "Bản nháp"
                : post.status === "hidden"
                ? "Đã ẩn"
                : "Hết hạn"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ==================== STYLES (giữ nguyên, chỉ thêm 1 style nhỏ) ====================
const styles = StyleSheet.create({
  // ... (giữ nguyên tất cả styles cũ)

  rentedLabel: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
    marginTop: 2,
  },

  // Các style khác giữ nguyên như cũ
  container: { flex: 1, backgroundColor: "#ffffff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: { fontSize: 15, color: "#64748b" },
  errorText: { fontSize: 16, color: "#64748b", textAlign: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  scrollContent: { paddingBottom: 16 },
  imageContainer: { position: "relative", backgroundColor: "#f1f5f9" },
  image: { width: width, height: 280 },
  statusBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { color: "white", fontSize: 13, fontWeight: "600" },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -18 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  navLeft: { left: 16 },
  navRight: { right: 16 },
  dotsContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activeDot: { backgroundColor: "white", width: 20 },
  content: { padding: 20, gap: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a" },
  postTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 30,
  },
  price: { fontSize: 24, fontWeight: "700", color: "#dc2626", marginTop: 4 },
  addressRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  address: { flex: 1, fontSize: 15, color: "#475569", lineHeight: 22 },
  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  infoText: { fontSize: 15, color: "#0f172a", fontWeight: "500" },
  divider: { width: 1, height: 20, backgroundColor: "#e2e8f0" },
  roomsSection: {
    padding: 14,
    backgroundColor: "#f3f4ff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  roomsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  roomsTitle: { fontSize: 15, fontWeight: "600", color: "#4f46e5" },
  roomsCompactList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
  },
  roomCompactCard: {
    width: (width - 60) / 2.3,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e7ff",
    gap: 6,
  },
  roomRentedCard: { opacity: 0.6, borderColor: "#cbd5e1" },
  roomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  roomPrice: { fontSize: 15, fontWeight: "700", color: "#dc2626" },
  description: { fontSize: 15, color: "#475569", lineHeight: 24 },
  htmlContainer: { backgroundColor: "#ffffff", borderRadius: 8 },
  htmlBaseStyle: { fontSize: 15, lineHeight: 22, color: "#475569" },
  buildingInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  buildingTextInfo: { flex: 1, gap: 4 },
  buildingInfoText: { fontSize: 15, color: "#0f172a", fontWeight: "600" },
  buildingAddress: { fontSize: 13, color: "#64748b" },
  utilitiesRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  utilityItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  utilityInfo: { flex: 1 },
  utilityLabel: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  utilityValue: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  amenitiesSection: { marginTop: 12 },
  amenitiesTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  amenitiesList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  amenityText: { fontSize: 13, color: "#0f766e" },
  buildingDescSection: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#fafafa",
    borderRadius: 12,
  },
  buildingDescText: { fontSize: 14, color: "#64748b", lineHeight: 22 },
  landlordCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
  },
  landlordInfo: { flex: 1, gap: 6 },
  landlordName: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  landlordContact: { fontSize: 14, color: "#64748b" },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: { color: "white", fontSize: 15, fontWeight: "600" },
  secondaryButton: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
  },
  disabledButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButtonText: { color: "#94a3b8", fontSize: 15, fontWeight: "600" },
});
