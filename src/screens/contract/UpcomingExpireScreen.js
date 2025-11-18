// src/screens/contract/UpcomingExpireScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import { listUpcomingExpire } from "../../api/contractApi";
import { Ionicons } from "@expo/vector-icons";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const daysBetween = (d1, d2) => {
  if (!d1) return null;
  try {
    const diff =
      new Date(d1).setHours(0, 0, 0, 0) - new Date(d2).setHours(0, 0, 0, 0);
    return Math.ceil(diff / MS_PER_DAY);
  } catch {
    return null;
  }
};

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("vi-VN");
  } catch {
    return d;
  }
};

const ExpireBadge = ({ daysLeft }) => {
  if (daysLeft == null) return null;
  let bg = "#d1fae5"; // green
  let color = "#065f46";
  if (daysLeft <= 7) {
    bg = "#fee2e2"; // red-ish
    color = "#991b1b";
  } else if (daysLeft <= 30) {
    bg = "#fffbeb"; // amber
    color = "#92400e";
  }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{daysLeft} ngày</Text>
    </View>
  );
};

const UpcomingExpireScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false }); // we render our own topbar
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await listUpcomingExpire({ days: 30, page: 1, limit: 50 });
      setItems(res.items || []);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: e.message || "Không thể tải dữ liệu",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const endDate = item.contract?.endDate;
    const daysLeft = endDate ? daysBetween(endDate, new Date()) : null;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ContractDetail", { id: item._id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.contract?.no || item._id}</Text>
            <ExpireBadge daysLeft={daysLeft} />
          </View>

          <Text style={styles.sub}>
            {item.buildingId?.name || "-"} • P.{item.roomId?.roomNumber || "-"}
          </Text>

          <Text style={styles.muted}>
            Kết thúc:{" "}
            <Text style={styles.mutedStrong}>
              {endDate ? fmtDate(endDate) : "-"}
            </Text>
            {daysLeft != null && daysLeft < 0 ? (
              <Text style={styles.overdueText}> • Đã quá hạn</Text>
            ) : null}
          </Text>
        </View>

        <View style={styles.cardRight}>
          <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );

  return (
    <View style={styles.screen}>
      {/* Top bar (in-screen so works on web/mobile) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topBack}
        >
          <Ionicons name="arrow-back" size={22} color="#0d9488" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Sắp hết hạn</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={56} color="#cbd5e1" />
            <Text style={styles.emptyText}>Không có hợp đồng sắp hết hạn</Text>
            <Text style={styles.emptySub}>
              Hệ thống kiểm tra trong {30} ngày tới
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  topBack: { padding: 6 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: "#0f172a",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eef3f6",
    // shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  cardLeft: { flex: 1 },
  cardRight: { width: 32, alignItems: "flex-end" },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#0f172a" },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontWeight: "700", fontSize: 12 },

  sub: { color: "#64748b", marginTop: 6 },
  muted: { color: "#64748b", marginTop: 8, fontSize: 13 },
  mutedStrong: { color: "#0f172a", fontWeight: "600" },

  overdueText: { color: "#991b1b", fontWeight: "700" },

  empty: { alignItems: "center", marginTop: 48 },
  emptyText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySub: { marginTop: 6, color: "#94a3b8" },
});

export default UpcomingExpireScreen;
