import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RoomTenants = ({ tenants = [], onViewAll }) => {
  if (!Array.isArray(tenants) || tenants.length === 0) {
    return null;
  }

  return (
    <View style={styles.tenantsCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Người ở cùng</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tenants.slice(0, 3)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `tenant-${item?.id || index}`}
        renderItem={({ item }) => (
          <View style={styles.tenantCard}>
            <View style={styles.tenantAvatar}>
              <Ionicons name="person" size={24} color="#94a3b8" />
            </View>
            <Text style={styles.tenantName} numberOfLines={1}>
              {item?.fullName || item?.username || "—"}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tenantsCard: {
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
  seeAllText: {
    fontSize: 13,
    color: "#0d9488",
    fontWeight: "500",
  },
  tenantCard: {
    alignItems: "center",
    width: 80,
  },
  tenantAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  tenantName: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default RoomTenants;
