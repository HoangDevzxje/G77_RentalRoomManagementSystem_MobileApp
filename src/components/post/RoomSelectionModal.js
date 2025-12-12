import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const RoomSelectionModal = ({
  visible,
  rooms,
  selectedRoom,
  post,
  formatPrice,
  screenHeight,
  onSelect,
  onClose,
}) => {
  if (!visible) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const renderStatus = (room) => {
    if (room.isAvailable) {
      return <Text style={[s.status, s.available]}>Còn trống</Text>;
    }

    if (room.isSoonAvailable && room.expectedAvailableDate) {
      return (
        <Text style={[s.status, s.soonAvailable]}>
          Trống từ {formatDate(room.expectedAvailableDate)}
        </Text>
      );
    }

    if (room.isRented) {
      return <Text style={[s.status, s.occupied]}>Đã thuê</Text>;
    }

    return null;
  };

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity
        style={[s.container, { maxHeight: screenHeight * 0.7 }]}
        activeOpacity={1}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={s.handleBarContainer}>
          <View style={s.handleBar} />
        </View>
        <View style={s.header}>
          <Text style={s.title}>Chọn phòng</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room._id}
              style={[s.card, selectedRoom?._id === room._id && s.activeCard]}
              onPress={() => onSelect(room)}
            >
              <View style={s.roomHeader}>
                <Text
                  style={[
                    s.roomName,
                    selectedRoom?._id === room._id && s.activeName,
                  ]}
                >
                  {room.name || `P.${room.roomNumber}`}
                </Text>
                {selectedRoom?._id === room._id && (
                  <Ionicons name="checkmark-circle" size={22} color="#0d9488" />
                )}
              </View>

              <Text
                style={[
                  s.price,
                  selectedRoom?._id === room._id && s.activePrice,
                ]}
              >
                {formatPrice(room.price)}
              </Text>

              <View style={s.info}>
                <View style={s.infoRow}>
                  <Ionicons name="resize-outline" size={14} color="#64748b" />
                  <Text style={s.area}>{room.area || post.areaMin} m²</Text>
                </View>

                {renderStatus(room)}
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
  },
  handleBarContainer: { alignItems: "center", paddingVertical: 10 },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#f8fafc",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  activeCard: { borderColor: "#0d9488", backgroundColor: "#f0fdfa" },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roomName: { fontSize: 17, fontWeight: "600", color: "#1e293b" },
  activeName: { color: "#0d9488" },
  price: { fontSize: 18, fontWeight: "700", color: "#dc2626", marginBottom: 8 },
  activePrice: { color: "#0d9488" },
  info: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  area: { fontSize: 14, color: "#64748b" },

  status: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  available: { backgroundColor: "#dcfce7", color: "#166534" },
  occupied: { backgroundColor: "#fee2e2", color: "#991b1b" },
  soonAvailable: { backgroundColor: "#fef3c7", color: "#b45309" },
});

export default RoomSelectionModal;
