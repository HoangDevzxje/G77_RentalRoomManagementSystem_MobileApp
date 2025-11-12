import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getPostById } from "../../api/postApi";
import { getMyContacts } from "../../api/contactApi";

const { width, height } = Dimensions.get("window");
const DEFAULT_IMAGE =
  "https://bandon.vn/uploads/posts/thiet-ke-nha-tro-dep-2020-bandon-0.jpg";

export default function RoomDetailScreen({ route, navigation }) {
  const { id: postId } = route.params;
  const [post, setPost] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasExistingContact, setHasExistingContact] = useState(false);

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    const roomName = selectedRoom
      ? selectedRoom.name || `P.${selectedRoom.roomNumber}`
      : post.title;
    navigation.setOptions({ headerTitle: roomName });
  }, [selectedRoom, post, navigation]);

  // Kiểm tra xem đã có contact nào cho phòng này chưa
  useEffect(() => {
    if (selectedRoom?._id) {
      checkExistingContact();
    }
  }, [selectedRoom]);

  const fetchPostDetail = async () => {
    try {
      const data = await getPostById(postId);
      setPost(data);
      const availableRooms = data.rooms || [];
      setRooms(availableRooms);
      if (availableRooms.length > 0) {
        setSelectedRoom(availableRooms[0]);
      }
    } catch (error) {
      console.error("Lỗi tải bài đăng:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingContact = async () => {
    try {
      const response = await getMyContacts({ page: 1, limit: 100 });
      const contacts = response.data || response.contacts || [];
      // Kiểm tra xem có contact nào cho phòng hiện tại không
      const existingContact = contacts.find(
        (c) =>
          c.roomId?._id === selectedRoom._id || c.roomId === selectedRoom._id
      );
      setHasExistingContact(!!existingContact);
    } catch (error) {
      console.error("Lỗi kiểm tra contact:", error);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setImageIndex(0);
    setModalVisible(false);
  };

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

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
    if (price === null || price === undefined) return "Liên hệ";
    return `${Number(price).toLocaleString("vi-VN")}đ`;
  };

  const getImages = () => {
    const images = post?.images || [];
    return images.length > 0 ? images : [DEFAULT_IMAGE];
  };

  const navigateToCreateContact = () => {
    if (!selectedRoom) {
      alert("Vui lòng chọn phòng trước");
      return;
    }
    navigation.navigate("ContactDetail", {
      roomId: selectedRoom._id,
      postId: postId,
      buildingId: building._id || building,
      roomInfo: {
        name: selectedRoom.name || `P.${selectedRoom.roomNumber}`,
        price: selectedRoom.price,
        area: selectedRoom.area || post.areaMin,
      },
      landlord: landlord,
    });
  };

  const navigateToBooking = () => {
    if (!selectedRoom) {
      alert("Vui lòng chọn phòng trước");
      return;
    }
    navigation.navigate("BookingForm", {
      roomId: selectedRoom?._id,
      postId,
    });
  };

  const images = getImages();

  const handlePrevImage = () => {
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setImageIndex((prev) => (prev + 1) % images.length);
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

  const building = post.buildingId || {};
  const landlord = post.landlordId || {};

  return (
    <View style={styles.container}>
      {/* Header */}
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

        {/* Đã xoá nút Đặt lịch xem khỏi header */}
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Slider */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[imageIndex] }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {images.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navBtn, styles.prevBtn]}
                onPress={handlePrevImage}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navBtn, styles.nextBtn]}
                onPress={handleNextImage}
              >
                <Ionicons name="chevron-forward" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.imageCounter}>
                <Text style={styles.counterText}>
                  {imageIndex + 1} / {images.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Banner Đặt lịch xem phòng ngay */}
        <TouchableOpacity
          style={styles.bookingBanner}
          onPress={navigateToBooking}
          disabled={!selectedRoom}
        >
          <View style={styles.bookingBannerContent}>
            <View style={styles.bookingIconContainer}>
              <Ionicons name="calendar" size={24} color="#fff" />
            </View>
            <View style={styles.bookingTextContainer}>
              <Text style={styles.bookingTitle}>Đặt lịch xem phòng ngay</Text>
              <Text style={styles.bookingSubtitle}>
                Chọn ngày và giờ phù hợp để xem trực tiếp phòng trọ
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Post Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá:</Text>
            <Text style={styles.priceRange}>
              {formatPrice(post.priceMin)} - {formatPrice(post.priceMax)}
            </Text>
          </View>
          <View style={styles.areaRow}>
            <Ionicons name="resize-outline" size={16} color="#64748b" />
            <Text style={styles.areaText}>
              {post.areaMin}m² - {post.areaMax}m²
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

        {/* Description */}
        {post.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{post.description}</Text>
            </View>
          </View>
        )}

        {/* Building Amenities */}
        {building.amenities && building.amenities.length > 0 && (
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

        {/* Utility Costs */}
        {building && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi phí dịch vụ</Text>
            <View style={styles.costGrid}>
              <View style={styles.costRow}>
                <View style={styles.costLeft}>
                  <Ionicons name="flash-outline" size={18} color="#f59e0b" />
                  <Text style={styles.costLabel}>Điện</Text>
                </View>
                <Text style={styles.costValue}>
                  {formatPrice(building?.ePrice)} /kWh
                </Text>
              </View>

              <View style={styles.costRow}>
                <View style={styles.costLeft}>
                  <Ionicons name="water-outline" size={18} color="#3b82f6" />
                  <Text style={styles.costLabel}>Nước</Text>
                </View>
                <Text style={styles.costValue}>
                  {formatPrice(building?.wPrice)} /Người
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Landlord Info */}
        {landlord && (landlord.fullName || landlord.phoneNumber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            <View style={styles.landlordSection}>
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
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {/* Nút chọn phòng */}
        {rooms.length > 1 && (
          <TouchableOpacity style={styles.selectRoomBtn} onPress={openModal}>
            <View style={styles.selectRoomContent}>
              <View style={styles.selectRoomLeft}>
                <Ionicons name="business-outline" size={18} color="#0d9488" />
                <Text style={styles.selectRoomText}>
                  Chọn phòng ({rooms.length} phòng trống)
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#0d9488" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          {/* Nút Tạo hợp đồng - Đã chuyển xuống action bar */}
          <TouchableOpacity
            style={[
              styles.contractBtn,
              hasExistingContact && styles.contractBtnActive,
            ]}
            onPress={navigateToCreateContact}
            disabled={!selectedRoom}
          >
            <View style={styles.contractIconContainer}>
              <Ionicons
                name={
                  hasExistingContact ? "document-text" : "document-text-outline"
                }
                size={20}
                color={hasExistingContact ? "#fff" : "#fff"}
              />
              {hasExistingContact && (
                <View style={styles.contractBadge}>
                  <Text style={styles.contractBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.contractBtnText}>
              {hasExistingContact ? "Hợp đồng" : "Tạo hợp đồng"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => openZalo(landlord.phoneNumber)}
            disabled={!landlord.phoneNumber}
          >
            <Ionicons name="chatbubble-ellipses" size={17} color="#fff" />
            <Text style={styles.iconBtnText}>Zalo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => makeCall(landlord.phoneNumber)}
            disabled={!landlord.phoneNumber}
          >
            <Ionicons name="call" size={17} color="#fff" />
            <Text style={styles.iconBtnText}>Gọi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal chọn phòng */}
      {modalVisible && (
        <TouchableOpacity
          style={styles.fixedModalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.fixedModalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <View style={styles.handleBarContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn phòng</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Danh sách phòng */}
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {rooms.map((room) => (
                <TouchableOpacity
                  key={room._id}
                  style={[
                    styles.modalRoomCard,
                    selectedRoom?._id === room._id &&
                      styles.modalRoomCardActive,
                  ]}
                  onPress={() => handleRoomSelect(room)}
                >
                  <View style={styles.modalRoomHeader}>
                    <Text
                      style={[
                        styles.modalRoomName,
                        selectedRoom?._id === room._id &&
                          styles.modalRoomNameActive,
                      ]}
                    >
                      {room.name || `P.${room.roomNumber}`}
                    </Text>
                    {selectedRoom?._id === room._id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#0d9488"
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.modalRoomPrice,
                      selectedRoom?._id === room._id &&
                        styles.modalRoomPriceActive,
                    ]}
                  >
                    {formatPrice(room.price)}
                  </Text>
                  <View style={styles.modalRoomInfo}>
                    <Text style={styles.modalRoomArea}>
                      {room.area || post.areaMin} m²
                    </Text>
                    {room.status && (
                      <Text
                        style={[
                          styles.modalRoomStatus,
                          room.status === "available"
                            ? styles.statusAvailable
                            : styles.statusOccupied,
                        ]}
                      >
                        {room.status === "available" ? "Trống" : "Đã thuê"}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
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
  noData: { marginTop: 12, fontSize: 16, color: "#64748b", fontWeight: "600" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    marginHorizontal: 12,
    textAlign: "center",
  },
  headerRight: {
    width: 40,
  },

  bookingBanner: {
    backgroundColor: "#0da193",
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
    borderRadius: 12,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
  bookingTextContainer: {
    flex: 1,
  },
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

  imageContainer: {
    position: "relative",
    height: 260,
    backgroundColor: "#e2e8f0",
  },
  mainImage: { width: "100%", height: "100%" },
  navBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  prevBtn: { left: 16 },
  nextBtn: { right: 16 },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  infoCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
  descriptionText: { fontSize: 15, color: "#475569", lineHeight: 24 },

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
    padding: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  costLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  costLabel: { fontSize: 15, color: "#475569", fontWeight: "500" },
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

  actionBar: {
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
  selectRoomBtn: {
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#99f6e4",
    marginBottom: 12,
    overflow: "hidden",
  },
  selectRoomContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  selectRoomLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectRoomText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0d9488",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  contractBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0d9488",
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },
  contractBtnActive: {
    backgroundColor: "#0d9488",
  },
  contractIconContainer: {
    position: "relative",
  },
  contractBadge: {
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
  contractBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
    lineHeight: 12,
  },
  contractBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  iconBtn: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 60,
    elevation: 2,
  },
  iconBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },

  fixedModalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  fixedModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.65,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  handleBarContainer: { alignItems: "center", paddingVertical: 10 },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  modalContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#f8fafc",
  },
  modalRoomCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  modalRoomCardActive: { borderColor: "#0d9488", backgroundColor: "#f0fdfa" },
  modalRoomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalRoomName: { fontSize: 17, fontWeight: "600", color: "#1e293b" },
  modalRoomNameActive: { color: "#0d9488" },
  modalRoomPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 8,
  },
  modalRoomPriceActive: { color: "#0d9488" },
  modalRoomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalRoomArea: { fontSize: 14, color: "#64748b" },
  modalRoomStatus: {
    fontSize: 13,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAvailable: { backgroundColor: "#dcfce7", color: "#166534" },
  statusOccupied: { backgroundColor: "#fee2e2", color: "#991b1b" },

  landlordSection: {
    marginBottom: 22,
    backgroundColor: "#fff",
    borderRadius: 5,
    elevation: 2,
  },
});
