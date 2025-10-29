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
      (content.includes("<html") ||
        content.includes("<body") ||
        content.includes("<div") ||
        content.includes("<p>") ||
        content.includes("<br") ||
        content.includes("<h1") ||
        content.includes("<h2"))
    );
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUri = () => {
    if (imageError) return DEFAULT_IMAGE;
    if (post?.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images[currentImageIndex] || DEFAULT_IMAGE;
    }
    return DEFAULT_IMAGE;
  };

  const getImageList = () => {
    if (post?.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images;
    }
    return [DEFAULT_IMAGE];
  };

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
    const formatSinglePrice = (price) => price.toLocaleString("vi-VN") + "đ";
    if (priceMin === priceMax) return formatSinglePrice(priceMin);
    return `${formatSinglePrice(priceMin)} - ${formatSinglePrice(priceMax)}`;
  };

  const formatArea = (areaMin, areaMax) => {
    if (!areaMin && !areaMax) return "N/A";
    if (areaMin === areaMax) return `${areaMin}m²`;
    return `${areaMin} - ${areaMax}m²`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRoomPress = (roomId) => {
    navigation.navigate("RoomDetail", { id: roomId });
  };

  const htmlRenderStyles = {
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: "#475569",
      fontFamily: "System",
    },
    p: { marginBottom: 14, lineHeight: 24 },
    h1: {
      fontSize: 20,
      fontWeight: "700",
      color: "#0f172a",
      marginBottom: 14,
      marginTop: 8,
      lineHeight: 28,
    },
    h2: {
      fontSize: 18,
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: 12,
      marginTop: 20,
      lineHeight: 26,
    },
    h3: {
      fontSize: 16,
      fontWeight: "600",
      color: "#334155",
      marginBottom: 10,
      marginTop: 16,
    },
    ul: { marginBottom: 14, paddingLeft: 8 },
    ol: { marginBottom: 14, paddingLeft: 8 },
    li: { marginBottom: 10, lineHeight: 24 },
    b: { fontWeight: "600", color: "#0f172a" },
    strong: { fontWeight: "600", color: "#0f172a" },
    a: { color: "#14b8a6", textDecorationLine: "underline" },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: "#cbd5e1",
      paddingLeft: 16,
      marginVertical: 14,
      fontStyle: "italic",
      color: "#64748b",
    },
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
        <Text style={styles.errorText}>Không tìm thấy thông tin bài đăng</Text>
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
          {/* Post Title & Price */}
          <View style={styles.section}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.price}>
              Giá: {formatPrice(post.priceMin, post.priceMax)}/tháng
            </Text>

            {post.buildingId && typeof post.buildingId === "object" && (
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
              </View>
            )}

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#0f172a" />
              <Text style={styles.address}>{post.address}</Text>
            </View>

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
                <Text style={styles.infoText}>
                  {formatDate(post.createdAt)}
                </Text>
              </View>
            </View>

            {/* Danh sách phòng */}
            {post.rooms && post.rooms.length > 0 && (
              <View style={styles.roomsSection}>
                <View style={styles.roomsHeader}>
                  <Ionicons name="bed-outline" size={18} color="#6366f1" />
                  <Text style={styles.roomsTitle}>
                    Danh sách phòng ({post.rooms.length})
                  </Text>
                </View>

                <View style={styles.roomsCompactList}>
                  {post.rooms.slice(0, 2).map((room) => (
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
                        Giá: {room.price?.toLocaleString("vi-VN")}đ
                      </Text>

                      {/* <View style={styles.roomStatusContainer}>
                        <View
                          style={[
                            styles.statusDot,
                            room.status === "available"
                              ? styles.statusAvailable
                              : styles.statusRented,
                          ]}
                        />
                        <Text
                          style={[
                            styles.roomStatus,
                            room.status === "available"
                              ? styles.statusAvailableText
                              : styles.statusRentedText,
                          ]}
                        >
                          {room.status === "available" ? "Trống" : "Đã thuê"}
                        </Text>
                      </View> */}
                    </TouchableOpacity>
                  ))}

                  {post.rooms.length > 2 && (
                    <View style={styles.roomMoreCard}>
                      <Text style={styles.roomMoreText}>
                        +{post.rooms.length - 2}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              {post.description && isHTMLContent(post.description) ? (
                <View style={styles.htmlContainer}>
                  <RenderHtml
                    contentWidth={width - 40}
                    source={{ html: post.description }}
                    tagsStyles={htmlRenderStyles}
                    baseStyle={styles.htmlBaseStyle}
                    enableExperimentalMarginCollapsing={true}
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

            {/* Utilities */}
            {post.buildingId && typeof post.buildingId === "object" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tiện ích</Text>
                <View style={styles.utilitiesRow}>
                  {post.buildingId.ePrice !== undefined && (
                    <View style={styles.utilityItem}>
                      <Ionicons name="flash" size={18} color="#f59e0b" />
                      <View style={styles.utilityInfo}>
                        <Text style={styles.utilityLabel}>Điện</Text>
                        <Text style={styles.utilityValue}>
                          {post.buildingId.eIndexType === "included"
                            ? "Đã bao gồm"
                            : `${
                                post.buildingId.ePrice?.toLocaleString() || "0"
                              }đ/kWh`}
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
                            ? "Đã bao gồm"
                            : `${
                                post.buildingId.wPrice?.toLocaleString() || "0"
                              }đ/m³`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {post.buildingId.amenities &&
                  post.buildingId.amenities.length > 0 && (
                    <View style={styles.amenitiesSection}>
                      <Text style={styles.amenitiesTitle}>Tiện nghi khác</Text>
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
                    <Text style={styles.buildingDescTitle}>Về tòa nhà</Text>
                    <Text style={styles.buildingDescText}>
                      {post.buildingId.description}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Landlord Info */}
            {post.landlordId && typeof post.landlordId === "object" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
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
                        <Ionicons
                          name="call-outline"
                          size={14}
                          color="#64748b"
                        />
                        <Text style={styles.landlordContact}>
                          {post.landlordId.phoneNumber}
                        </Text>
                      </View>
                    )}
                    {post.landlordId.email && (
                      <View style={styles.contactRow}>
                        <Ionicons
                          name="mail-outline"
                          size={14}
                          color="#64748b"
                        />
                        <Text style={styles.landlordContact}>
                          {post.landlordId.email}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Post Meta */}
            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color="#94a3b8" />
                <Text style={styles.metaText}>
                  Đăng ngày: {formatDate(post.createdAt)}
                </Text>
              </View>
              {post.updatedAt !== post.createdAt && (
                <View style={styles.metaRow}>
                  <Ionicons name="refresh-outline" size={16} color="#94a3b8" />
                  <Text style={styles.metaText}>
                    Cập nhật: {formatDate(post.updatedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
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
                ? "Bài đăng đã ẩn"
                : "Bài đăng hết hạn"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ==================== STYLES - ĐÃ SỬA TRÙNG LẶP ====================
const styles = StyleSheet.create({
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: { backgroundColor: "white", width: 20 },

  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a" },

  postTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 30,
  },
  price: { fontSize: 24, fontWeight: "700", color: "#dc2626", marginTop: 8 },
  buildingInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginTop: 12,
  },
  buildingTextInfo: { flex: 1, gap: 4 },
  buildingInfoText: { fontSize: 15, color: "#0f172a", fontWeight: "600" },
  buildingAddress: { fontSize: 13, color: "#64748b" },
  addressRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  address: { flex: 1, fontSize: 15, color: "#475569", lineHeight: 22 },
  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  infoText: { fontSize: 15, color: "#0f172a", fontWeight: "500" },
  divider: { width: 1, height: 20, backgroundColor: "#e2e8f0" },

  roomsSection: {
    marginTop: 12,
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
  roomsCompactList: { flexDirection: "row", alignItems: "center", gap: 8 },
  roomCompactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  roomMoreIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  roomMoreText: { fontSize: 12, fontWeight: "600", color: "#6366f1" },

  description: { fontSize: 15, color: "#475569", lineHeight: 24 },
  htmlContainer: { backgroundColor: "#ffffff", borderRadius: 8 },
  htmlBaseStyle: { fontSize: 15, lineHeight: 22, color: "#475569" },

  utilitiesRow: { flexDirection: "row", gap: 12 },
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
  buildingDescTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
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

  metaSection: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#94a3b8" },

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

  roomsSection: {
    marginTop: 12,
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

  roomsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4f46e5",
  },

  roomsCompactList: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
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

  roomRentedCard: {
    opacity: 0.6,
    borderColor: "#cbd5e1",
  },

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

  roomPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc2626",
  },

  roomStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusAvailable: {
    backgroundColor: "#10b981",
  },

  statusRented: {
    backgroundColor: "#ef4444",
  },

  roomStatus: {
    fontSize: 12,
    fontWeight: "500",
  },

  statusAvailableText: {
    color: "#10b981",
  },

  statusRentedText: {
    color: "#ef4444",
  },

  roomMoreCard: {
    width: (width - 60) / 2.3,
    height: 90,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderStyle: "dashed",
  },

  roomMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },
});
