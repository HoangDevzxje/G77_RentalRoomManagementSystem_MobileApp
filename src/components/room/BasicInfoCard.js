import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BasicInfoCard = ({ building, floor, area, price }) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const toggleDescription = () => {
    setDescriptionExpanded(!descriptionExpanded);
  };

  const getFloorInfo = () => {
    if (!floor) return "—";
    if (floor.name) return floor.name;
    if (floor.level) return `Tầng ${floor.level}`;
    if (floor.floorNumber) return `Tầng ${floor.floorNumber}`;
    return "—";
  };

  const infoItems = [
    {
      id: 1,
      label: "Tòa nhà",
      value: building?.name ?? "—",
      icon: "business",
    },
    {
      id: 2,
      label: "Tầng",
      value: getFloorInfo(),
      icon: "layers",
    },
    {
      id: 3,
      label: "Địa chỉ",
      value: building?.address ?? "—",
      icon: "location",
    },
    {
      id: 4,
      label: "Diện tích",
      value: area ? `${area} m²` : "—",
      icon: "resize",
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
      </View>

      <View style={styles.infoGrid}>
        {infoItems.map((item) => (
          <View key={item.id} style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name={item.icon} size={18} color="#0d9488" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={item.id === 3 ? 2 : 1}
              >
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {building?.description && (
        <View style={styles.descriptionSection}>
          <TouchableOpacity onPress={toggleDescription}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionLabel}>Mô tả tòa nhà</Text>
              <Ionicons
                name={descriptionExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#64748b"
              />
            </View>
          </TouchableOpacity>

          {descriptionExpanded && (
            <Text style={styles.descriptionText}>{building.description}</Text>
          )}
        </View>
      )}

      {building?.contact ? (
        <View style={styles.contactSection}>
          <View style={styles.contactHeader}>
            <Ionicons name="call" size={16} color="#64748b" />
            <Text style={styles.contactLabel}>Liên hệ quản lý</Text>
          </View>
          <Text style={styles.contactValue}>{building.contact}</Text>
        </View>
      ) : null}

      <View style={styles.priceSection}>
        <View style={styles.priceContent}>
          <Text style={styles.priceLabel}>Giá thuê</Text>
          <Text style={styles.priceValue}>
            {price ? `${Number(price).toLocaleString("vi-VN")} đ/tháng` : "—"}
          </Text>
        </View>
      </View>
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
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
    marginBottom: 12,
  },
  infoItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  floorDescriptionSection: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
  },
  floorDescriptionLabel: {
    fontSize: 13,
    color: "#0369a1",
    fontWeight: "600",
    marginBottom: 4,
  },
  floorDescriptionText: {
    fontSize: 14,
    color: "#0c4a6e",
    lineHeight: 20,
  },
  descriptionSection: {
    marginBottom: 12,
  },
  descriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  contactSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 6,
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  priceSection: {
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0d9488",
  },
  priceContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 16,
    color: "#0d9488",
    fontWeight: "600",
  },
});

export default BasicInfoCard;
