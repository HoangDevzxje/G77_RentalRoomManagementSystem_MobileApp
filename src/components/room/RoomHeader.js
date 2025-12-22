import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  normalizeUri,
  getContractStatusText,
  getContractStatusColor,
} from "../../utils/roomHelpers";

const RoomHeader = ({
  roomNumber,
  images = [],
  building = {},
  userRoomStatus,
  roomsToCount = [],
  onRoomSwitcherPress,
}) => {
  const roomImages =
    images && images.length > 0 ? images : building?.images || [];
  const mainImageUri =
    roomImages.length > 0 ? normalizeUri(roomImages[0]) : null;

  return (
    <View style={styles.imageContainer}>
      {mainImageUri ? (
        <Image source={{ uri: mainImageUri }} style={styles.mainImage} />
      ) : (
        <View style={styles.noImage}>
          <Ionicons name="home-outline" size={48} color="#94a3b8" />
          <Text style={styles.noImageText}>Không có ảnh</Text>
        </View>
      )}

      <View style={styles.headerBadges}>
        <View style={styles.leftBadges}>
          <View style={styles.roomNumberBadge}>
            <Text style={styles.roomNumberText}>Phòng {roomNumber ?? "—"}</Text>
          </View>

          <View
            style={[
              styles.roomStatusBadge,
              {
                backgroundColor: `${getContractStatusColor(userRoomStatus)}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.roomStatusText,
                { color: getContractStatusColor(userRoomStatus) },
              ]}
            >
              {getContractStatusText(userRoomStatus)}
            </Text>
          </View>
        </View>

        {roomsToCount.length > 1 && (
          <TouchableOpacity
            style={styles.roomSwitcherButton}
            onPress={onRoomSwitcherPress}
          >
            <View style={styles.switcherBadge}>
              <Text style={styles.switcherBadgeText}>
                {roomsToCount.length}
              </Text>
            </View>
            <Text style={styles.switcherMainText}>Đổi phòng</Text>
            <Ionicons
              name="swap-horizontal"
              size={16}
              color="#fff"
              style={styles.switcherIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: { position: "relative", marginBottom: 16 },
  mainImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#e2e8f0",
  },
  noImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noImageText: { color: "#94a3b8", fontSize: 14, marginTop: 8 },
  headerBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  leftBadges: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  roomNumberBadge: {
    backgroundColor: "rgba(13, 148, 136, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  roomNumberText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  roomStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roomStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  roomSwitcherButton: {
    marginLeft: "auto",
    backgroundColor: "rgba(13, 148, 136, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  switcherBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  switcherBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  switcherMainText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  switcherIcon: {
    marginLeft: 4,
  },
});

export default RoomHeader;
