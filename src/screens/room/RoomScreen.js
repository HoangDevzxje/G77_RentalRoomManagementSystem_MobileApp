import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyRoomDetail, getMyRoomsList } from "../../api/roomApi";
import { Ionicons } from "@expo/vector-icons";
import RoomHeader from "../../components/room/RoomHeader";
import RoomTenants from "../../components/room/RoomTenants";
import QuickActions from "../../components/room/QuickActions";
import BasicInfoCard from "../../components/room/BasicInfoCard";
import UtilityCard from "../../components/room/UtilityCard";
import ServicesCard from "../../components/room/ServicesCard";
import FurnitureCard from "../../components/room/FurnitureCard";
import RoomSelectorModal from "../../components/room/RoomSelectorModal";

export default function RoomScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [room, setRoom] = useState(null);
  const [furnitures, setFurnitures] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomsListData, setRoomsListData] = useState([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Hàm lấy danh sách phòng
  const fetchRoomsList = async () => {
    try {
      const response = await getMyRoomsList();

      if (response.success) {
        setRoomsListData(response.data?.rooms || []);
        setErrorMessage(null);
      } else {
        setRoomsListData([]);
        if (response.message && response.message !== "Success") {
          setErrorMessage(response.message);
        }
      }
    } catch (error) {
      console.log("Error fetching rooms list:", error);
      setRoomsListData([]);
      setErrorMessage("Lỗi kết nối đến máy chủ");
    }
  };

  const fetchRoomDetail = async (showLoading = true, targetRoomId = null) => {
    try {
      if (showLoading) {
        setLoading(true);
        setErrorMessage(null);
      }

      const response = await getMyRoomDetail(targetRoomId);

      if (response.success && response.data) {
        const data = response.data;

        setRoom(data.room || null);
        setFurnitures(Array.isArray(data.furnitures) ? data.furnitures : []);
        setAvailableRooms(
          Array.isArray(data.availableRooms) ? data.availableRooms : []
        );

        if (data.room) {
          setSelectedRoomId(data.room.id || data.room._id);
        }

        setErrorMessage(null);
      } else {
        setRoom(null);
        setFurnitures([]);
        setAvailableRooms([]);

        if (response.message && response.message !== "Success") {
          setErrorMessage(response.message);
        }
      }
    } catch (err) {
      console.log("Error fetching room data:", err);
      setRoom(null);
      setFurnitures([]);
      setAvailableRooms([]);
      setErrorMessage("Lỗi kết nối đến máy chủ");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoomDetail(true);
    fetchRoomsList();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRoomDetail(false);
      fetchRoomsList();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoomDetail(false, selectedRoomId);
    fetchRoomsList();
  };

  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setShowRoomSelector(false);
    fetchRoomDetail(true, roomId);
  };

  const goToRoommates = () => {
    const roomId = room?.id ?? room?._id ?? null;
    if (!roomId) return;
    navigation.navigate("Roommates", { roomId });
  };

  const goToMaintenanceList = () => {
    const roomId = room?.id ?? room?._id ?? null;
    navigation.navigate("MaintenanceRequests", { roomId });
  };

  const openBuildingReviewList = () => {
    const buildingId = room?.building?._id ?? room?.buildingId ?? null;
    if (!buildingId) return;
    navigation.navigate("BuildingReviewList", { buildingId });
  };

  const openCreateBuildingReview = () => {
    const buildingId = room?.building?._id ?? room?.buildingId ?? null;
    if (!buildingId) return;
    navigation.navigate("CreateBuildingReview", {
      buildingId,
      buildingName: room?.building?.name ?? null,
    });
  };

  const goToInvoices = () => {
    navigation.navigate("InvoiceList");
  };

  const goToLaundryDevices = () => {
    const buildingId = room?.building?._id ?? room?.buildingId ?? null;
    const buildingName = room?.building?.name ?? "Tòa nhà";
    if (!buildingId) return;
    navigation.navigate("BuildingLaundryDevices", {
      buildingId,
      buildingName,
    });
  };

  const goToPostList = () => {
    navigation.navigate("PostList");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải thông tin phòng...</Text>
      </View>
    );
  }

  if (errorMessage && !room) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        </View>
        <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
        <Text style={styles.emptyText}>
          {errorMessage || "Không thể tải thông tin phòng"}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => fetchRoomDetail(true)}
        >
          <Text style={styles.primaryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="home-outline" size={64} color="#cbd5e1" />
        </View>
        <Text style={styles.emptyTitle}>Chưa có phòng</Text>
        <Text style={styles.emptyText}>
          Bạn cần kí hợp đồng thuê phòng. Để xem thông tin phòng bạn cần vào
          trang bài đăng.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => fetchRoomDetail(true)}
        >
          <Text style={styles.primaryButtonText}>Tải lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, styles.postButton]}
          onPress={goToPostList}
        >
          <Ionicons
            name="newspaper-outline"
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryButtonText}>Xem bài đăng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    roomNumber,
    images = [],
    area,
    price,
    electricity,
    water,
    building,
    services = [],
    tenants = [],
    userRoomStatus,
    floor,
  } = room;

  const roomsToCount =
    roomsListData.length > 0 ? roomsListData : availableRooms;

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0d9488"
            colors={["#0d9488"]}
          />
        }
      >
        {/* Room Header */}
        <RoomHeader
          roomNumber={roomNumber}
          images={images}
          building={building}
          userRoomStatus={userRoomStatus}
          roomsToCount={roomsToCount}
          onRoomSwitcherPress={() => setShowRoomSelector(true)}
        />

        <View style={styles.content}>
          {/* Room Tenants */}
          <RoomTenants tenants={tenants} onViewAll={goToRoommates} />

          {/* Quick Actions */}
          <QuickActions
            onInvoices={goToInvoices}
            onMaintenance={goToMaintenanceList}
            onCreateReview={openCreateBuildingReview}
            onViewReviews={openBuildingReviewList}
            onLaundryDevices={goToLaundryDevices}
          />

          {/* Basic Info Card */}
          <BasicInfoCard
            building={building}
            floor={floor}
            area={area}
            price={price}
          />

          {/* Electricity and Water Info Card */}
          <UtilityCard electricity={electricity} water={water} />

          {/* Services Card */}
          <ServicesCard services={services} />

          {/* Furniture Card */}
          <FurnitureCard furnitures={furnitures} />
        </View>
      </ScrollView>

      {/* Room Selector Modal */}
      <RoomSelectorModal
        visible={showRoomSelector}
        rooms={roomsToCount}
        selectedRoomId={selectedRoomId}
        onSelectRoom={handleSelectRoom}
        onClose={() => setShowRoomSelector(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f8fafc",
  },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14 },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    minWidth: 180,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  postButton: {
    backgroundColor: "#f59e0b",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
