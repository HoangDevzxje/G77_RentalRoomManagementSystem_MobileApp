import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const QuickActions = ({
  onInvoices,
  onMaintenance,
  onCreateReview,
  onViewReviews,
  onLaundryDevices,
}) => {
  const actionItems = [
    {
      id: 1,
      title: "Hóa đơn của tôi",
      subtitle: "Xem & thanh toán hóa đơn",
      icon: "receipt-outline",
      iconColor: "#22c55e",
      bgColor: "#f0fdf4",
      onPress: onInvoices,
    },
    {
      id: 2,
      title: "Yêu cầu bảo trì",
      subtitle: "Xem & theo dõi các yêu cầu của phòng",
      icon: "construct",
      iconColor: "#f59e0b",
      bgColor: "#fef7ed",
      onPress: onMaintenance,
    },
    {
      id: 3,
      title: "Gửi đánh giá tòa nhà",
      subtitle: "Chia sẻ trải nghiệm của bạn",
      icon: "star",
      iconColor: "#22c55e",
      bgColor: "#f0fdf4",
      onPress: onCreateReview,
    },
    {
      id: 4,
      title: "Xem đánh giá tòa nhà",
      subtitle: "Danh sách đánh giá",
      icon: "book",
      iconColor: "#8b5cf6",
      bgColor: "#faf5ff",
      onPress: onViewReviews,
    },
    {
      id: 5,
      title: "Thiết bị giặt/sấy",
      subtitle: "Xem máy giặt, máy sấy trong tòa",
      icon: "shirt-outline",
      iconColor: "#3b82f6",
      bgColor: "#f0f9ff",
      onPress: onLaundryDevices,
    },
  ];

  return (
    <View style={styles.quickActionsCard}>
      {actionItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <View style={styles.divider} />}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: item.bgColor }]}
            >
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 68,
  },
});

export default QuickActions;
