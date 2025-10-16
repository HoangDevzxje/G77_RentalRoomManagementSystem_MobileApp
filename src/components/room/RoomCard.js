// components/room/RoomCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function RoomCard({ room, onPress, cardWidth, cardHeight }) {
  return (
    <TouchableOpacity
      style={[styles.roomCard, { width: cardWidth }]}
      onPress={onPress}
    >
      {/* Room Image */}
      <Image
        source={{
          uri:
            room.imageUrl ||
            "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg",
        }}
        style={[styles.roomImage, { height: cardHeight * 0.6 }]}
        resizeMode="cover"
      />

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Room Number & Status */}
        <View style={styles.header}>
          <Text style={styles.roomNumber}>P.{room.roomNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              room.status === "available" && styles.availableBadge,
              room.status === "rented" && styles.rentedBadge,
              room.status === "maintenance" && styles.maintenanceBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {room.status === "available"
                ? "Trống"
                : room.status === "rented"
                ? "Đã thuê"
                : "Bảo trì"}
            </Text>
          </View>
        </View>

        {/* Price */}
        <Text style={styles.price}>{(room.price / 1000000).toFixed(1)} tr</Text>

        {/* Building Name */}
        {room.buildingId && (
          <Text style={styles.buildingName} numberOfLines={1}>
            {room.buildingId.name || "Tòa A"}
          </Text>
        )}

        {/* Area */}
        {room.area && <Text style={styles.area}>{room.area}m²</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  roomCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  roomImage: {
    width: "100%",
    backgroundColor: "#e5e7eb",
  },
  cardContent: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  availableBadge: {
    backgroundColor: "#d1fae5",
  },
  rentedBadge: {
    backgroundColor: "#fee2e2",
  },
  maintenanceBadge: {
    backgroundColor: "#fef3c7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  availableText: {
    color: "#059669",
  },
  rentedText: {
    color: "#dc2626",
  },
  maintenanceText: {
    color: "#d97706",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 4,
  },
  buildingName: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  area: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
