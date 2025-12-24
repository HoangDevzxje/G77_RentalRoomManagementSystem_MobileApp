import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import RenderHtml from "react-native-render-html";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { getPostById, getRoomById } from "../../api/postApi";
import { getMyContacts } from "../../api/contactApi";

import ImageSlider from "../../components/post/ImageSlider";
import FurnitureList from "../../components/post/FurnitureList";
import ActionBar from "../../components/post/ActionBar";
import RoomSelectionModal from "../../components/post/RoomSelectionModal";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");
const DEFAULT_IMAGE =
  "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg";

const tagsStyles = {
  p: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    marginBottom: 10,
  },
  strong: {
    fontWeight: "bold",
    color: "#1e293b",
  },
  h1: { fontSize: 20, color: "#1e293b", marginBottom: 10 },
  h2: { fontSize: 18, color: "#1e293b", marginBottom: 10 },
  h3: { fontSize: 16, color: "#1e293b", marginBottom: 8 },
  li: { fontSize: 15, color: "#475569" },
  ul: { marginBottom: 10 },
  img: { marginVertical: 10 },
};

const SYSTEM_FONTS = ["sans-serif", "Roboto", "Arial", "System"];

export default function RoomDetailScreen({ route, navigation }) {
  const { id: postId } = route.params;
  const { isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasExistingContact, setHasExistingContact] = useState(false);

  const building = post?.buildingId || {};
  const landlord = post?.landlordId || {};

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    navigation.setOptions({
      headerTitle: selectedRoom
        ? selectedRoom.name || `P.${selectedRoom.roomNumber}`
        : post.title,
    });
  }, [selectedRoom, post, navigation]);

  useEffect(() => {
    if (selectedRoom?._id) {
      if (isAuthenticated) {
        checkExistingContact();
      } else {
        setHasExistingContact(false);
      }
      fetchRoomDetail(selectedRoom._id);
    }
  }, [selectedRoom, isAuthenticated]);

  const fetchPostDetail = async () => {
    try {
      const data = await getPostById(postId);
      setPost(data);

      const rawRooms = data.rooms || [];
      const visibleRooms = rawRooms.filter(
        (room) => room.status === "available" || room.isSoonAvailable
      );

      setRooms(visibleRooms);

      if (visibleRooms.length > 0) {
        setSelectedRoom(visibleRooms[0]);
      } else {
        setSelectedRoom(null);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải thông tin bài đăng",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomDetail = async (roomId) => {
    try {
      const detail = await getRoomById(roomId);
      setRoomDetail(detail);
    } catch (error) {}
  };

  const checkExistingContact = async () => {
    try {
      const response = await getMyContacts({ page: 1, limit: 100 });
      const contacts = response.data || response.contacts || [];
      const exists = contacts.some(
        (c) =>
          c.roomId?._id === selectedRoom._id || c.roomId === selectedRoom._id
      );
      setHasExistingContact(exists);
    } catch (error) {
      console.log("Check contact error", error);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setImageIndex(0);
    setModalVisible(false);
  };

  const openZalo = (phone) => {
    const cleaned = phone?.replace(/[^0-9]/g, "") || "";
    const zaloUrl = `https://zalo.me/${cleaned}`;
    Linking.canOpenURL(zaloUrl)
      .then((supported) =>
        supported ? Linking.openURL(zaloUrl) : Linking.openURL(`tel:${cleaned}`)
      )
      .catch(() => Linking.openURL(`tel:${cleaned}`));
  };

  const makeCall = (phone) => {
    const cleaned = phone?.replace(/[^0-9]/g, "") || "";
    Linking.openURL(`tel:${cleaned}`);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === 0) return "Miễn phí";
    return `${Number(price).toLocaleString("vi-VN")}đ`;
  };

  const getImages = () => {
    const images = post?.images || [];
    return images.length > 0 ? images : [DEFAULT_IMAGE];
  };

  const checkLoginBeforeAction = (actionName) => {
    if (isAuthenticated) {
      return true;
    } else {
      Toast.show({
        type: "info",
        text1: "Yêu cầu đăng nhập",
        text2: `Bạn cần đăng nhập để ${actionName}`,
        visibilityTime: 3000,
        position: "top",
        onPress: () => navigation.navigate("Login"),
      });
      return false;
    }
  };

  const navigateToCreateContact = () => {
    if (!checkLoginBeforeAction("tạo hợp đồng")) return;

    if (!selectedRoom) {
      return Toast.show({
        type: "error",
        text1: "Chưa chọn phòng",
        text2: "Vui lòng chọn phòng để tiếp tục",
      });
    }

    navigation.navigate("ContactDetail", {
      roomId: selectedRoom._id,
      postId,
      buildingId: building._id || building,
      roomInfo: {
        name: selectedRoom.name || `P.${selectedRoom.roomNumber}`,
        price: selectedRoom.price,
        area: selectedRoom.area || post.areaMin,
      },
      landlord,
    });
  };

  const navigateToBooking = () => {
    if (!checkLoginBeforeAction("đặt lịch xem phòng")) return;

    if (!selectedRoom) {
      return Toast.show({
        type: "error",
        text1: "Chưa chọn phòng",
        text2: "Vui lòng chọn phòng để tiếp tục",
      });
    }

    navigation.navigate("BookingForm", {
      roomId: selectedRoom._id,
      postId,
    });
  };

  const images = getImages();

  const getServiceLabel = (price, type, unit) => {
    if (price === 0 || price === null || price === undefined) return "Miễn phí";
    if (type === "included") return "Đã bao gồm";
    return `${formatPrice(price)} / ${unit} (${getIndexTypeName(type)})`;
  };

  const getIndexTypeName = (type) => {
    const map = {
      byNumber: "Theo chỉ số",
      byPerson: "Theo người",
      included: "Đã bao gồm",
    };
    return map[type] || "Không xác định";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingIconContainer}>
          <Ionicons name="newspaper-outline" size={48} color="#0d9488" />
        </View>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải thông tin bài đăng...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        </View>
        <Text style={styles.noData}>Không tìm thấy bài đăng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={18} color="white" />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isRoomBookable =
    selectedRoom && (selectedRoom.isAvailable || selectedRoom.isSoonAvailable);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedRoom
            ? selectedRoom.name || `P.${selectedRoom.roomNumber}`
            : post.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageSlider
          images={images}
          index={imageIndex}
          onIndexChange={setImageIndex}
        />

        <TouchableOpacity
          style={[
            styles.bookingBanner,
            !isRoomBookable && { backgroundColor: "#94a3b8", opacity: 0.8 },
          ]}
          onPress={navigateToBooking}
          disabled={!isRoomBookable}
        >
          <View style={styles.bookingBannerContent}>
            <View style={styles.bookingIconContainer}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <View style={styles.bookingTextContainer}>
              <Text style={styles.bookingTitle}>
                {selectedRoom?.isSoonAvailable
                  ? "Đặt trước phòng này"
                  : selectedRoom?.isAvailable
                  ? "Đặt lịch xem phòng ngay"
                  : rooms.length === 0
                  ? "Đã hết phòng"
                  : "Vui lòng chọn phòng"}
              </Text>
              <Text style={styles.bookingSubtitle}>
                {selectedRoom?.isSoonAvailable
                  ? `Phòng trống từ ${new Date(
                      selectedRoom.expectedAvailableDate
                    ).toLocaleDateString("vi-VN")}`
                  : selectedRoom?.isAvailable
                  ? "Chọn ngày và giờ phù hợp để xem trực tiếp"
                  : rooms.length === 0
                  ? "Hiện tại không còn phòng trống nào"
                  : "Danh sách phòng khả dụng ở bên dưới"}
              </Text>
            </View>
            {isRoomBookable && (
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá:</Text>
            <Text style={styles.priceRange}>
              {selectedRoom
                ? formatPrice(selectedRoom.price)
                : `${formatPrice(post.priceMin)} - ${formatPrice(
                    post.priceMax
                  )}`}
            </Text>
          </View>
          <View style={styles.areaRow}>
            <Ionicons name="resize-outline" size={16} color="#64748b" />
            <Text style={styles.areaText}>
              {selectedRoom?.area || post.areaMin}m²
              {!selectedRoom && ` - ${post.areaMax}m²`}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={18} color="#0d9488" />
            <Text style={styles.address} numberOfLines={2}>
              {post.address || building.address || "Không có địa chỉ"}
            </Text>
          </View>
          {building.name && (
            <View style={styles.buildingRow}>
              <Ionicons name="business-outline" size={16} color="#64748b" />
              <Text style={styles.buildingName}>{building.name}</Text>
            </View>
          )}
        </View>

        {/* --- ĐÃ SỬA LỖI TẠI ĐÂY --- */}
        {post.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <View style={styles.descriptionCard}>
              <RenderHtml
                contentWidth={width - 64}
                source={{ html: post.description }}
                tagsStyles={tagsStyles}
                systemFonts={SYSTEM_FONTS}
              />
            </View>
          </View>
        )}

        {building.amenities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiện ích tòa nhà</Text>
            <View style={styles.amenitiesGrid}>
              {building.amenities.map((amenity, idx) => (
                <View key={idx} style={styles.amenityChip}>
                  <Ionicons name="checkmark-circle" size={16} color="#0d9488" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi phí dịch vụ</Text>
          <View style={styles.costGrid}>
            <View style={styles.costRow}>
              <View style={styles.costLeft}>
                <Ionicons name="flash-outline" size={18} color="#f59e0b" />
                <Text style={styles.costLabel}>Điện</Text>
              </View>
              <View style={styles.costRight}>
                <Text style={styles.costValue}>
                  {getServiceLabel(
                    building?.ePrice,
                    building?.eIndexType,
                    "kWh"
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.costRow}>
              <View style={styles.costLeft}>
                <Ionicons name="water-outline" size={18} color="#3b82f6" />
                <Text style={styles.costLabel}>Nước</Text>
              </View>
              <View style={styles.costRight}>
                <Text style={styles.costValue}>
                  {getServiceLabel(
                    building?.wPrice,
                    building?.wIndexType,
                    building?.wIndexType === "byPerson" ? "Người" : "m³"
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <FurnitureList furnitures={roomDetail?.furnitures} />

        {(landlord.fullName || landlord.phoneNumber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <View style={styles.landlordCard}>
              <View style={styles.landlordAvatar}>
                <Ionicons name="person" size={28} color="#0d9488" />
              </View>
              <View style={styles.landlordInfo}>
                {landlord.fullName && (
                  <Text style={styles.landlordName}>{landlord.fullName}</Text>
                )}
                {landlord.email && (
                  <Text style={styles.landlordPhone}>{landlord.email}</Text>
                )}
                {landlord.phoneNumber && (
                  <Text style={styles.landlordPhone}>
                    {landlord.phoneNumber}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      <ActionBar
        rooms={rooms}
        selectedRoom={selectedRoom}
        hasExistingContact={hasExistingContact}
        landlord={landlord}
        onOpenModal={() => setModalVisible(true)}
        onCreateContract={navigateToCreateContact}
        onZalo={openZalo}
        onCall={makeCall}
      />

      <RoomSelectionModal
        visible={modalVisible}
        rooms={rooms}
        selectedRoom={selectedRoom}
        post={post}
        formatPrice={formatPrice}
        screenHeight={height}
        onSelect={handleRoomSelect}
        onClose={() => setModalVisible(false)}
      />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  loadingIconContainer: { marginBottom: 16, opacity: 0.8 },
  errorIconContainer: { marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 15, color: "#64748b" },
  noData: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButtonText: { color: "white", fontSize: 15, fontWeight: "bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 16,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
  },
  headerRight: { width: 40 },
  bookingBanner: {
    backgroundColor: "#0da193",
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    padding: 8,
    elevation: 3,
  },
  bookingBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  bookingTextContainer: { flex: 1 },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  bookingSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 16,
    elevation: 2,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  priceLabel: { fontSize: 15, color: "#64748b", marginRight: 8 },
  priceRange: { fontSize: 22, fontWeight: "800", color: "#dc2626", flex: 1 },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  areaText: { fontSize: 14, color: "#64748b" },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    gap: 6,
  },
  address: { fontSize: 15, color: "#475569", flex: 1, lineHeight: 22 },
  buildingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  buildingName: { fontSize: 14, color: "#64748b", fontStyle: "italic" },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdfa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  amenityText: { fontSize: 14, color: "#0d9488", fontWeight: "500" },
  costGrid: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  costLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  costLabel: { fontSize: 15, color: "#475569", fontWeight: "500" },
  costRight: { alignItems: "flex-end" },
  costValue: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  landlordCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0fdfa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#99f6e4",
  },
  landlordInfo: { flex: 1 },
  landlordName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  landlordPhone: { fontSize: 14, color: "#64748b" },
});
