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

  // Hàm extract text từ HTML
  const extractTextFromHTML = (html) => {
    if (!html) return "";

    return html
      .replace(/<[^>]*>/g, "") // Loại bỏ thẻ HTML
      .replace(/&nbsp;/g, " ") // Thay thế &nbsp;
      .replace(/&amp;/g, "&") // Thay thế &amp;
      .replace(/&lt;/g, "<") // Thay thế &lt;
      .replace(/&gt;/g, ">") // Thay thế &gt;
      .replace(/&quot;/g, '"') // Thay thế &quot;
      .trim();
  };

  // Hàm kiểm tra xem description có phải là HTML không
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

  const formatPrice = (price) => {
    if (!price) return "Liên hệ";
    return price.toLocaleString("vi-VN") + "đ";
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

  const htmlRenderStyles = {
    body: {
      fontSize: 15,
      lineHeight: 24,
      color: "#475569",
      fontFamily: "System",
    },
    p: {
      marginBottom: 14,
      lineHeight: 24,
    },
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
    ul: {
      marginBottom: 14,
      paddingLeft: 8,
    },
    ol: {
      marginBottom: 14,
      paddingLeft: 8,
    },
    li: {
      marginBottom: 10,
      lineHeight: 24,
    },
    b: {
      fontWeight: "600",
      color: "#0f172a",
    },
    strong: {
      fontWeight: "600",
      color: "#0f172a",
    },
    a: {
      color: "#14b8a6",
      textDecorationLine: "underline",
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: "#cbd5e1",
      paddingLeft: 16,
      marginVertical: 14,
      fontStyle: "italic",
      color: "#64748b",
    },
    ".highlight": {
      backgroundColor: "#f0fdfa",
      padding: 14,
      borderLeftWidth: 4,
      borderLeftColor: "#14b8a6",
      marginVertical: 14,
      borderRadius: 4,
    },
    ".price": {
      fontSize: 24,
      fontWeight: "700",
      color: "#dc2626",
      textAlign: "center",
      marginVertical: 16,
    },
    ".contact-info": {
      backgroundColor: "#fffbeb",
      padding: 16,
      borderWidth: 1,
      borderColor: "#fbbf24",
      borderRadius: 12,
      marginTop: 16,
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

          {/* Draft Badge */}
          {post.isDraft && (
            <View style={[styles.draftBadge]}>
              <Text style={styles.draftText}>Bản nháp</Text>
            </View>
          )}

          {/* Image Navigation */}
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

              {/* Dots Indicator */}
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
            <Text style={styles.price}>{formatPrice(post.price)}/tháng</Text>

            {/* Building Info */}
            {post.buildingId && typeof post.buildingId === "object" && (
              <View style={styles.buildingInfoCard}>
                <Ionicons name="business-outline" size={18} color="#64748b" />
                <Text style={styles.buildingInfoText}>
                  {post.buildingId.name || "Tòa nhà"}
                </Text>
              </View>
            )}

            {/* Address */}
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#0f172a" />
              <Text style={styles.address}>{post.address}</Text>
            </View>

            {/* Quick Info */}
            <View style={styles.quickInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="resize-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>{post.area}m²</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={18} color="#64748b" />
                <Text style={styles.infoText}>
                  {formatDate(post.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description - ĐÃ SỬA */}
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

          {/* Utilities - if building exists */}
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
                    {post.landlordId.fullName ||
                      post.landlordId.username ||
                      "Chủ nhà"}
                  </Text>
                  {post.landlordId.phone && (
                    <Text style={styles.landlordContact}>
                      {post.landlordId.phone}
                    </Text>
                  )}
                  {post.landlordId.email && (
                    <Text style={styles.landlordContact}>
                      {post.landlordId.email}
                    </Text>
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
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {post.status === "active" && !post.isDraft ? (
          <>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="call-outline" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Liên hệ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#14b8a6" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: "#64748b",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },

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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  scrollContent: {
    paddingBottom: 16,
  },

  imageContainer: {
    position: "relative",
    backgroundColor: "#f1f5f9",
  },
  image: {
    width: width,
    height: 280,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  draftBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#64748b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  draftText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
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
  navLeft: {
    left: 16,
  },
  navRight: {
    right: 16,
  },
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
  activeDot: {
    backgroundColor: "white",
    width: 20,
  },

  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
  },

  postTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 30,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#dc2626",
    marginTop: 8,
  },
  buildingInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginTop: 12,
  },
  buildingInfoText: {
    fontSize: 15,
    color: "#475569",
    fontWeight: "500",
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
  },

  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },
  htmlContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  htmlBaseStyle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },

  utilitiesRow: {
    flexDirection: "row",
    gap: 12,
  },
  utilityItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  utilityInfo: {
    flex: 1,
  },
  utilityLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },
  utilityValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

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
  landlordInfo: {
    flex: 1,
    gap: 4,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  landlordContact: {
    fontSize: 14,
    color: "#64748b",
  },

  metaSection: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#94a3b8",
  },

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
  primaryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
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
  disabledButtonText: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
});
