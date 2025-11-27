import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "../../context/NotificationContext";

const NotificationsList = () => {
  const navigation = useNavigation();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } =
    useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredNotifications(notifications);
    } else {
      const filtered = notifications.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotifications(filtered);
    }
  }, [searchQuery, notifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications({ replace: true });
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // Sau khi mark all read, context sẽ tự cập nhật unreadCount về 0
    fetchNotifications({ replace: true });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  };

  //Lấy thông tin hiển thị theo loại
  const getTypeInfo = (type) => {
    switch (type) {
      case "bill":
        return {
          label: "Hóa đơn",
          color: "#F59E0B",
          bg: "#FEF3C7",
          icon: "receipt-outline",
        };
      case "maintenance":
        return {
          label: "Bảo trì",
          color: "#EF4444",
          bg: "#FEE2E2",
          icon: "construct-outline",
        };
      case "reminder":
        return {
          label: "Nhắc nhở",
          color: "#8B5CF6",
          bg: "#EDE9FE",
          icon: "alarm-outline",
        };
      case "event":
        return {
          label: "Sự kiện",
          color: "#10B981",
          bg: "#D1FAE5",
          icon: "calendar-outline",
        };
      case "general":
      default:
        return {
          label: "Thông báo chung",
          color: "#3B82F6",
          bg: "#DBEAFE",
          icon: "newspaper-outline",
        };
    }
  };

  // Helper: Lấy tên người gửi fallback
  const getSenderName = (item) => {
    if (item.createBy?.userInfo?.fullName)
      return item.createBy.userInfo.fullName;
    if (item.createBy?.username) return item.createBy.username;

    switch (item.createByRole) {
      case "landlord":
        return "Chủ trọ";
      case "staff":
        return "Nhân viên";
      case "resident":
        return "Cư dân";
      case "system":
        return "Hệ thống";
      default:
        return "Ban quản lý";
    }
  };

  const renderItem = ({ item }) => {
    const isRead = item.isRead;
    const typeInfo = getTypeInfo(item.type);
    const senderName = getSenderName(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, !isRead && styles.cardUnread]}
        onPress={() =>
          navigation.navigate("NotificationDetail", { id: item._id || item.id })
        }
      >
        {/* Thể hiện loại thông báo */}
        <View style={[styles.iconContainer, { backgroundColor: typeInfo.bg }]}>
          <Ionicons name={typeInfo.icon} size={22} color={typeInfo.color} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.title, !isRead && styles.titleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.content} numberOfLines={2}>
            {item.content}
          </Text>
          <View style={styles.senderRow}>
            <Ionicons name="person-circle-outline" size={14} color="#9CA3AF" />
            <Text style={styles.senderText}>{senderName}</Text>
          </View>
        </View>
        {!isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Thông báo</Text>
              {unreadCount > 0 && (
                <Text style={styles.unreadText}>
                  {unreadCount} tin chưa đọc
                </Text>
              )}
            </View>

            {unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={styles.markAllBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done" size={20} color="#007AFF" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInner}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={
                  searchQuery ? "search-outline" : "notifications-off-outline"
                }
                size={64}
                color="#E5E7EB"
              />
              <Text style={styles.emptyTitle}>
                {searchQuery ? "Không tìm thấy kết quả" : "Chưa có thông báo"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Hãy thử từ khóa khác"
                  : "Bạn sẽ nhận được thông báo tại đây"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  unreadText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    marginTop: 2,
  },
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardUnread: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    color: "#111827",
    fontWeight: "700",
  },
  time: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  content: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  senderText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginTop: 6,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
});

export default NotificationsList;
