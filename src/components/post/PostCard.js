import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function PostCard({ post, onPress, cardWidth, cardHeight }) {
  const getImageUri = () => {
    if (post.images && Array.isArray(post.images) && post.images.length > 0) {
      return post.images[0];
    }
    return "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg";
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "Thỏa thuận";
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} tr`;
    }
    return `${(price / 1000).toFixed(0)} k`;
  };

  const formatArea = (area) => {
    if (!area) return "N/A";
    return `${area}m²`;
  };

  const getBuildingName = () => {
    if (!post.buildingId) return null;
    if (typeof post.buildingId === "object") {
      return post.buildingId.name || null;
    }
    return null;
  };

  const getLandlordName = () => {
    if (!post.landlordId) return null;
    if (typeof post.landlordId === "object") {
      return post.landlordId.fullName || null;
    }
    return null;
  };

  const buildingName = getBuildingName();
  const landlordName = getLandlordName();

  return (
    <TouchableOpacity
      style={[styles.postCard, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Post Image */}
      <View style={[styles.imageContainer, { height: cardHeight * 0.6 }]}>
        <Image
          source={{ uri: getImageUri() }}
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Draft Badge */}
        {post.isDraft && (
          <View style={styles.draftBadge}>
            <Text style={styles.draftText}>Bản nháp</Text>
          </View>
        )}

        {/* Price Overlay */}
        <View style={styles.priceOverlay}>
          <Text style={styles.priceOverlayText}>{formatPrice(post.price)}</Text>
          <Text style={styles.priceOverlaySubText}>/tháng</Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {post.title || "Không có tiêu đề"}
        </Text>

        {/* Address */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={12} color="#64748b" />
          <Text style={styles.address}>
            {post.address || "Đang cập nhật địa chỉ"}
          </Text>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {/* Area */}
          <View style={styles.infoItem}>
            <Ionicons name="resize-outline" size={12} color="#94a3b8" />
            <Text style={styles.infoText}>{formatArea(post.area)}</Text>
          </View>

          {/* Building */}
          {buildingName && (
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={12} color="#94a3b8" />
              <Text style={styles.infoText} numberOfLines={1}>
                {buildingName}
              </Text>
            </View>
          )}
        </View>

        {/* Landlord Info */}
        {landlordName && (
          <View style={styles.landlordInfo}>
            <Ionicons name="person-outline" size={12} color="#0d9488" />
            <Text style={styles.landlordText} numberOfLines={1}>
              {landlordName}
            </Text>
          </View>
        )}

        {/* Created Date */}
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={10} color="#cbd5e1" />
          <Text style={styles.dateText}>
            {post.createdAt
              ? new Date(post.createdAt).toLocaleDateString("vi-VN")
              : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  postCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  imageContainer: {
    position: "relative",
    backgroundColor: "#f1f5f9",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },

  draftBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  draftText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
  priceOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceOverlayText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    marginRight: 2,
  },
  priceOverlaySubText: {
    fontSize: 11,
    color: "#ffffff",
    opacity: 0.95,
  },

  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 20,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  address: {
    fontSize: 12,
    color: "#64748b",
    flex: 1,
    lineHeight: 16,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#94a3b8",
  },

  landlordInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginBottom: 4,
  },
  landlordText: {
    fontSize: 12,
    color: "#0d9488",
    fontWeight: "500",
    flex: 1,
  },

  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#cbd5e1",
  },
});
