import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getElectricityDisplay,
  getWaterDisplay,
  getElectricityDescription,
  getWaterDescription,
} from "../../utils/roomHelpers";

const UtilityCard = ({ electricity, water }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Điện & Nước</Text>
      </View>

      <View style={styles.utilityGrid}>
        <View style={styles.utilityItem}>
          <View style={[styles.utilityIcon, { backgroundColor: "#fef7ed" }]}>
            <Ionicons name="flash" size={20} color="#d97706" />
          </View>
          <View style={styles.utilityContent}>
            <Text style={styles.utilityTitle}>Điện</Text>
            <Text style={styles.utilitySubtitle}>
              {getElectricityDisplay(electricity)}
            </Text>
            <Text style={styles.utilityDescription}>
              {getElectricityDescription(electricity)}
            </Text>
          </View>
        </View>

        <View style={styles.utilityItem}>
          <View style={[styles.utilityIcon, { backgroundColor: "#f0f9ff" }]}>
            <Ionicons name="water" size={20} color="#0ea5e9" />
          </View>
          <View style={styles.utilityContent}>
            <Text style={styles.utilityTitle}>Nước</Text>
            <Text style={styles.utilitySubtitle}>{getWaterDisplay(water)}</Text>
            <Text style={styles.utilityDescription}>
              {getWaterDescription(water)}
            </Text>
          </View>
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
  utilityGrid: {
    marginBottom: 12,
  },
  utilityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  utilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  utilityContent: {
    flex: 1,
  },
  utilityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  utilitySubtitle: {
    fontSize: 14,
    color: "#0d9488",
    fontWeight: "500",
    marginBottom: 2,
  },
  utilityDescription: {
    fontSize: 12,
    color: "#64748b",
  },
});

export default UtilityCard;
