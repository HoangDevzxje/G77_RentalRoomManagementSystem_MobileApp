import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const FurnitureCard = ({ furnitures }) => {
  const renderFurniture = ({ item }) => (
    <View style={styles.furnitureCard}>
      <View style={styles.furnitureContent}>
        <Text style={styles.furnitureName} numberOfLines={1}>
          {item?.name || "Không tên"}
        </Text>
      </View>
      <View style={styles.furnitureQtyBadge}>
        <Text style={styles.furnitureQty}>×{item?.quantity ?? 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Nội thất</Text>
        {furnitures.length > 0 ? (
          <View style={styles.furnitureBadge}>
            <Text style={styles.furnitureBadgeText}>{furnitures.length}</Text>
          </View>
        ) : null}
      </View>

      {furnitures.length > 0 ? (
        <FlatList
          data={furnitures}
          keyExtractor={(it, i) => `${it.name ?? "f"}-${i}`}
          renderItem={renderFurniture}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyFurniture}>
          <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyFurnitureText}>
            Chưa có nội thất được ghi nhận
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  furnitureBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  furnitureBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  furnitureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    justifyContent: "space-between",
  },
  furnitureContent: {
    flex: 1,
    paddingRight: 12,
  },
  furnitureName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 2,
  },
  furnitureQtyBadge: {
    backgroundColor: "#0d9488",
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  furnitureQty: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyFurniture: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyFurnitureText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },
});

export default FurnitureCard;
