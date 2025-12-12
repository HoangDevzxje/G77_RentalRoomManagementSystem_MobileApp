import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const FurnitureList = ({ furnitures }) => {
  // API đã lọc dữ liệu, không cần filter thêm
  const activeFurnitures = furnitures || [];

  if (!activeFurnitures.length) return null;

  return (
    <View style={s.section}>
      <Text style={s.title}>Nội thất phòng</Text>
      <View style={s.grid}>
        {activeFurnitures.map((furniture, index) => (
          <FurnitureItem key={furniture.id || index} furniture={furniture} />
        ))}
      </View>
    </View>
  );
};

const FurnitureItem = ({ furniture }) => {
  const { name, quantity, condition, notes } = furniture;

  return (
    <View style={s.card}>
      <View style={s.info}>
        <Text style={s.name}>{name || "Không có tên"}</Text>

        <View style={s.detailRow}>
          {quantity !== undefined && quantity !== null && (
            <Text style={s.detail}>SL: {quantity}</Text>
          )}
          {condition && <Text style={s.detail}></Text>}
        </View>

        {notes && (
          <Text style={s.notes} numberOfLines={2}>
            {notes}
          </Text>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  section: { paddingHorizontal: 16, marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  grid: {
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detail: {
    fontSize: 13,
    color: "#64748b",
  },
  notes: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
    lineHeight: 18,
  },
});

export default FurnitureList;
