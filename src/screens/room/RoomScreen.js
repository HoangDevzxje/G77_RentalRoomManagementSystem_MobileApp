import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyRoomDetail, getMyRoomsList } from "../../api/roomApi";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

import RoomHeader from "../../components/room/RoomHeader";
import RoomTenants from "../../components/room/RoomTenants";
import QuickActions from "../../components/room/QuickActions";
import BasicInfoCard from "../../components/room/BasicInfoCard";
import UtilityCard from "../../components/room/UtilityCard";
import ServicesCard from "../../components/room/ServicesCard";
import FurnitureCard from "../../components/room/FurnitureCard";
import RoomSelectorModal from "../../components/room/RoomSelectorModal";

const { width } = Dimensions.get("window");

export default function RoomScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [room, setRoom] = useState(null);
  const [furnitures, setFurnitures] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomsListData, setRoomsListData] = useState([]);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const fetchRoomsList = async () => {
    if (!isAuthenticated) {
      setRoomsListData([]);
      return;
    }
    try {
      const response = await getMyRoomsList();
      if (response.success) {
        setRoomsListData(response.data?.rooms || []);
      } else {
        setRoomsListData([]);
      }
    } catch (error) {
      setRoomsListData([]);
      // FIX: Thêm check !== 404 để không hiện log khi chưa có phòng
      if (error.response?.status !== 401 && error.response?.status !== 404) {
        console.log("Error fetching room list:", error);
      }
    }
  };

  const fetchRoomDetail = async (showLoading = true, targetRoomId = null) => {
    if (!isAuthenticated) {
      setRoom(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
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
      } else {
        setRoom(null);
        setFurnitures([]);
        setAvailableRooms([]);
      }
    } catch (err) {
      setRoom(null);
      if (err.response?.status !== 401 && err.response?.status !== 404) {
        console.log("Error fetching room detail:", err);
      }
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRoomDetail(true);
      fetchRoomsList();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchRoomDetail(false, selectedRoomId);
        fetchRoomsList();
      }
    }, [isAuthenticated, selectedRoomId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (isAuthenticated) {
      fetchRoomDetail(false, selectedRoomId);
      fetchRoomsList();
    } else {
      setRefreshing(false);
    }
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

  // Màn hình Empty State / Guest Mode
  if (!isAuthenticated || !room) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
            <Ionicons
              name={isAuthenticated ? "search" : "log-in-outline"}
              size={60}
              color="#0d9488"
            />
          </View>

          <Text style={styles.emptyTitle}>
            {isAuthenticated ? "Bạn chưa thuê phòng nào" : "Chào mừng bạn"}
          </Text>

          <Text style={styles.emptyDescription}>
            {isAuthenticated
              ? "Hiện tại bạn chưa có hợp đồng thuê phòng nào. Hãy khám phá danh sách phòng trọ và tìm cho mình một nơi ở ưng ý nhé!"
              : "Vui lòng đăng nhập để xem thông tin phòng của bạn hoặc tìm kiếm phòng mới."}
          </Text>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => {
              if (isAuthenticated) {
                goToPostList();
              } else {
                navigation.navigate("Login");
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isAuthenticated ? "search-outline" : "log-in-outline"}
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.btnPrimaryText}>
              {isAuthenticated ? "Tìm phòng ngay" : "Đăng nhập ngay"}
            </Text>
          </TouchableOpacity>

          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={goToPostList}
              activeOpacity={0.6}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color="#64748b"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnSecondaryText}>Xem danh sách phòng</Text>
            </TouchableOpacity>
          )}

          {isAuthenticated && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => fetchRoomDetail(true)}
              activeOpacity={0.6}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#64748b"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnSecondaryText}>Làm mới trang</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Main Content
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
        <RoomHeader
          roomNumber={roomNumber}
          images={images}
          building={building}
          userRoomStatus={userRoomStatus}
          roomsToCount={roomsToCount}
          onRoomSwitcherPress={() => setShowRoomSelector(true)}
        />

        <View style={styles.content}>
          <RoomTenants tenants={tenants} onViewAll={goToRoommates} />

          <QuickActions
            onInvoices={goToInvoices}
            onMaintenance={goToMaintenanceList}
            onCreateReview={openCreateBuildingReview}
            onViewReviews={openBuildingReviewList}
            onLaundryDevices={goToLaundryDevices}
          />

          <BasicInfoCard
            building={building}
            floor={floor}
            area={area}
            price={price}
          />

          <UtilityCard electricity={electricity} water={water} />
          <ServicesCard services={services} />
          <FurnitureCard furnitures={furnitures} />
        </View>
      </ScrollView>

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
  centerScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14 },
  emptyContainer: {
    alignItems: "center",
    width: "100%",
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  btnPrimary: {
    backgroundColor: "#0d9488",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: "100%",
    justifyContent: "center",
    marginBottom: 16,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    width: "100%",
  },
  btnSecondaryText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
});
