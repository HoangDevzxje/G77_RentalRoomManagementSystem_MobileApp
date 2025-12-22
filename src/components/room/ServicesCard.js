import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getServiceIcon, getServiceColor } from "../../utils/roomHelpers";

const ServicesCard = ({ services }) => {
  if (services.length === 0) return null;

  const renderService = ({ item }) => (
    <View style={styles.serviceCard}>
      <View
        style={[
          styles.serviceIcon,
          { backgroundColor: `${getServiceColor(item.name)}10` },
        ]}
      >
        <Ionicons
          name={getServiceIcon(item.name)}
          size={20}
          color={getServiceColor(item.name)}
        />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceName}>{item.label || item.name}</Text>
        {item.description ? (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.servicePrice}>
        <Text style={styles.servicePriceText}>
          {item.displayText ||
            (item.chargeType === "included"
              ? "Đã bao gồm"
              : `${Number(item.fee || 0).toLocaleString("vi-VN")} ${
                  item.currency || "VND"
                }`)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Dịch vụ</Text>
        <View style={styles.servicesBadge}>
          <Text style={styles.servicesBadgeText}>{services.length}</Text>
        </View>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item, index) => `service-${item.id || index}`}
        renderItem={renderService}
        scrollEnabled={false}
      />
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
  servicesBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  servicesBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: "#64748b",
  },
  servicePrice: {
    alignItems: "flex-end",
  },
  servicePriceText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0d9488",
  },
});

export default ServicesCard;
