import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ActionBar = ({
  rooms,
  selectedRoom,
  hasExistingContact,
  landlord,
  onOpenModal,
  onCreateContract,
  onZalo,
  onCall,
}) => {
  return (
    <View style={s.bar}>
      {rooms.length > 1 && (
        <TouchableOpacity style={s.selectBtn} onPress={onOpenModal}>
          <View style={s.selectContent}>
            <View style={s.selectLeft}>
              <Ionicons name="business-outline" size={18} color="#0d9488" />
              <Text style={s.selectText}>
                Chọn phòng ({rooms.length} phòng trống)
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#0d9488" />
          </View>
        </TouchableOpacity>
      )}

      <View style={s.buttons}>
        <TouchableOpacity
          style={[s.contractBtn, hasExistingContact && s.active]}
          onPress={onCreateContract}
          disabled={!selectedRoom}
        >
          <View style={s.iconContainer}>
            <Ionicons
              name={
                hasExistingContact ? "document-text" : "document-text-outline"
              }
              size={20}
              color="#fff"
            />
            {hasExistingContact && (
              <View style={s.badge}>
                <Text style={s.badgeText}>Check</Text>
              </View>
            )}
          </View>
          <Text style={s.contractText}>
            {hasExistingContact ? "Hợp đồng" : "Tạo hợp đồng"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => onZalo(landlord.phoneNumber)}
          disabled={!landlord.phoneNumber}
        >
          <Ionicons name="chatbubble-ellipses" size={17} color="#fff" />
          <Text style={s.iconText}>Zalo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => onCall(landlord.phoneNumber)}
          disabled={!landlord.phoneNumber}
        >
          <Ionicons name="call" size={17} color="#fff" />
          <Text style={s.iconText}>Gọi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  bar: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  selectBtn: {
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#99f6e4",
    marginBottom: 12,
  },
  selectContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  selectLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectText: { fontSize: 15, fontWeight: "600", color: "#0d9488" },
  buttons: { flexDirection: "row", gap: 12 },
  contractBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0d9488",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  active: { backgroundColor: "#0d9488" },
  iconContainer: { position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "bold" },
  contractText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  iconBtn: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 60,
  },
  iconText: { color: "#fff", fontSize: 12, fontWeight: "500", marginTop: 3 },
});

export default ActionBar;
