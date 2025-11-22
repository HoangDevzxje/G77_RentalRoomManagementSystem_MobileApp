// screens/CreateMaintenanceRequest.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  Image,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { getMyRoomDetail } from "../../api/roomApi";
import { createRequest } from "../../api/maintenanceApi";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");
const MAX_IMAGES = 5;

export default function CreateMaintenanceRequest({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [furnitures, setFurnitures] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [showFurnitureModal, setShowFurnitureModal] = useState(false);

  // furnitureId stores the actual _id string of the furniture
  const [furnitureId, setFurnitureId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [affectedQuantity, setAffectedQuantity] = useState("1");

  // Image picker state (phone images)
  const [images, setImages] = useState([]); // { uri, name, type }

  useEffect(() => {
    loadRoomData();
  }, []);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      const r = await getMyRoomDetail();
      const room = r?.room ?? r;
      if (!room) throw new Error("Không tìm thấy phòng");

      setRoomId(room.id ?? room._id);
      const roomFurn = r?.furnitures ?? room?.furnitures ?? [];

      const validFurnitures = roomFurn.filter(
        (f) => f && (f.name || f._id || f.id)
      );
      setFurnitures(validFurnitures);

      if (validFurnitures.length > 0) {
        // set default to the actual _id (or id) of the first furniture
        const first = validFurnitures[0];
        setFurnitureId(String(first._id || first.id || first.name || ""));
      } else {
        setFurnitureId("");
      }
    } catch (err) {
      console.error("loadRoomData error:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err?.message || "Không tải được dữ liệu phòng",
      });
    } finally {
      setLoading(false);
    }
  };

  const normalizeFileUri = (uri) => {
    if (!uri || typeof uri !== "string") return uri;
    if (uri.startsWith("ph://")) {
      return uri.replace("ph://", "assets-library://");
    }
    if (uri.startsWith("/")) {
      if (!uri.startsWith("file://")) return `file://${uri}`;
    }
    return uri;
  };

  const openSettingsPrompt = () => {
    Toast.show({
      type: "info",
      text1: "Mở Cài đặt",
      text2: "Bật quyền Photos nếu bạn đã từ chối",
    });
    setTimeout(() => {
      if (Platform.OS !== "web") {
        Linking.openSettings?.();
      }
    }, 300);
  };

  // --- Image picker (Expo) ---
  const pickImages = async () => {
    try {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        Toast.show({ type: "info", text1: `Tối đa ${MAX_IMAGES} ảnh` });
        return;
      }

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền bị từ chối",
          text2: "Ứng dụng cần quyền truy cập ảnh để bạn có thể chọn hình",
        });
        return openSettingsPrompt();
      }

      const options = {
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) {
        return;
      }

      const assets = result.assets || [];
      if (assets.length === 0) {
        Toast.show({ type: "info", text1: "Không có ảnh được chọn" });
        return;
      }

      const items = assets.map((asset, idx) => {
        const originalUri = asset.uri;
        const uri = normalizeFileUri(originalUri);
        const filename =
          asset.fileName ||
          (uri ? uri.split("/").pop() : `photo_${Date.now()}_${idx}.jpg`);

        const lower = filename.toLowerCase();
        let mime = "image/jpeg";
        if (lower.endsWith(".png")) mime = "image/png";
        else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
          mime = "image/jpeg";

        return {
          uri,
          name: filename,
          type: mime,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
        };
      });

      setImages((prev) => {
        const merged = [...prev, ...items];
        return merged.slice(0, MAX_IMAGES);
      });

      Toast.show({ type: "success", text1: `Đã thêm ${items.length} ảnh` });
    } catch (err) {
      console.error("pickImages error:", err);
      Toast.show({ type: "error", text1: "Lỗi chọn ảnh", text2: String(err) });
    }
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Submit ---
  const submit = async () => {
    if (!user?.accessToken) {
      Toast.show({ type: "info", text1: "Bạn phải đăng nhập để tạo yêu cầu" });
      return;
    }

    if (!roomId) {
      Toast.show({ type: "info", text1: "Phòng chưa xác định" });
      return;
    }
    if (!furnitureId || furnitureId === "") {
      Toast.show({ type: "info", text1: "Vui lòng chọn đồ nội thất bị hỏng" });
      return;
    }
    if (!title || title.trim().length < 3) {
      Toast.show({ type: "info", text1: "Tiêu đề ít nhất 3 ký tự" });
      return;
    }

    Alert.alert("Xác nhận", "Bạn có chắc muốn tạo yêu cầu bảo trì này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Tạo yêu cầu",
        onPress: async () => {
          try {
            setSubmitting(true);

            // Find selected furniture by its _id (or fallback to furnitureId)
            const selectedFurniture =
              furnitures.find(
                (f) => String(f._id || f.id || f.name) === String(furnitureId)
              ) || null;

            const payload = {
              roomId,
              furnitureId:
                selectedFurniture?._id ||
                selectedFurniture?.id ||
                String(furnitureId),
              title: title.trim(),
              description: description.trim(),
              priority,
              affectedQuantity: Number(affectedQuantity) || 1,
              // CHỈ gửi images từ thiết bị, không gửi photos URLs nữa
              images: images.map((img) => ({
                uri: img.uri,
                name: img.name || `photo_${Date.now()}.jpg`,
                type: img.type || "image/jpeg",
              })),
            };

            await createRequest(payload, user.accessToken);

            // show success toast then navigate back after a short delay
            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "Đã tạo yêu cầu bảo trì",
            });

            // wait for toast to be visible before navigating
            setTimeout(() => {
              navigation.goBack();
            }, 1200);
          } catch (err) {
            const serverMsg =
              err?.response?.data?.message ||
              err?.response?.data ||
              err?.message ||
              String(err);
            console.error("createRequest error:", err);
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: serverMsg || "Tạo yêu cầu thất bại",
            });
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const Header = () => (
    <SafeAreaView style={styles.headerSafe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0f766e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo yêu cầu bảo trì</Text>
        <View style={styles.headerRight} />
      </View>
    </SafeAreaView>
  );

  const PrioritySelector = () => (
    <View style={styles.priorityContainer}>
      <Text style={styles.label}>Mức độ ưu tiên</Text>
      <View style={styles.priorityButtons}>
        {[
          { value: "low", label: "Thấp", color: "#10b981" },
          { value: "medium", label: "Bình thường", color: "#3b82f6" },
          { value: "high", label: "Cao", color: "#f59e0b" },
          { value: "urgent", label: "Khẩn cấp", color: "#ef4444" },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.priorityButton,
              priority === item.value && styles.priorityButtonSelected,
              priority === item.value && { borderColor: item.color },
            ]}
            onPress={() => setPriority(item.value)}
          >
            <View
              style={[styles.priorityDot, { backgroundColor: item.color }]}
            />
            <Text
              style={[
                styles.priorityText,
                priority === item.value && styles.priorityTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const FurnitureModal = () => (
    <Modal
      visible={showFurnitureModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFurnitureModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn đồ nội thất</Text>
            <TouchableOpacity
              onPress={() => setShowFurnitureModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={furnitures}
            keyExtractor={(item, index) =>
              String(item._id || item.id || item.name || index)
            }
            renderItem={({ item }) => {
              const itemId = String(item._id || item.id || item.name || "");
              const selected = String(furnitureId) === itemId;
              return (
                <TouchableOpacity
                  style={[
                    styles.furnitureItem,
                    selected && styles.furnitureItemSelected,
                  ]}
                  onPress={() => {
                    setFurnitureId(itemId);
                    setShowFurnitureModal(false);
                  }}
                >
                  <View style={styles.furnitureItemContent}>
                    <Text style={styles.furnitureItemName}>{item.name}</Text>
                    <Text style={styles.furnitureItemQuantity}>
                      Số lượng: {item.quantity || 1}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark" size={20} color="#0d9488" />
                  )}
                </TouchableOpacity>
              );
            }}
            style={styles.modalList}
          />
        </View>
      </View>
    </Modal>
  );

  const FurnitureSelector = () => {
    const selectedFurniture = furnitures.find(
      (f) => String(f._id || f.id || f.name) === String(furnitureId)
    );

    return (
      <View style={styles.field}>
        <Text style={styles.label}>Đồ nội thất bị hỏng *</Text>
        {furnitures.length === 0 ? (
          <View style={styles.placeholderContainer}>
            <Ionicons name="cube-outline" size={32} color="#94a3b8" />
            <Text style={styles.placeholderText}>
              Không có danh sách nội thất
            </Text>
          </View>
        ) : (
          <View style={styles.furnitureContainer}>
            <TouchableOpacity
              style={styles.furnitureButton}
              onPress={() => setShowFurnitureModal(true)}
            >
              <View style={styles.furnitureButtonContent}>
                <Ionicons name="cube" size={20} color="#0d9488" />
                <Text style={styles.furnitureButtonText}>
                  {selectedFurniture
                    ? `${selectedFurniture.name} (${
                        selectedFurniture.quantity || 1
                      } cái)`
                    : "Chọn đồ nội thất..."}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>

            {selectedFurniture && (
              <View style={styles.selectedInfo}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.selectedText}>
                  Đã chọn:{" "}
                  <Text style={styles.furnitureName}>
                    {selectedFurniture.name}
                  </Text>
                </Text>
              </View>
            )}
          </View>
        )}
        <FurnitureModal />
      </View>
    );
  };

  const keyboardVerticalOffset = Platform.select({
    ios: 0,
    android: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 64,
    default: 0,
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <FurnitureSelector />

              <View style={styles.field}>
                <Text style={styles.label}>Tiêu đề sự cố *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Bồn rửa bị rò nước, Đèn không sáng..."
                  placeholderTextColor="#94a3b8"
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mô tả chi tiết</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Mô tả chi tiết về sự cố, vị trí, mức độ ảnh hưởng..."
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Device images picker - CHỈ CÒN PHẦN NÀY */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Hình ảnh đính kèm ({images.length}/{MAX_IMAGES})
                </Text>
                <Text style={styles.subLabel}>
                  Chọn ảnh từ thiết bị của bạn (tối đa {MAX_IMAGES} ảnh)
                </Text>

                <View style={styles.imagesRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: "center" }}
                  >
                    {images.map((img, idx) => (
                      <View key={idx} style={styles.imageWrapper}>
                        <Image
                          source={{ uri: img.uri }}
                          style={styles.pickImage}
                        />
                        <TouchableOpacity
                          onPress={() => removeImageAt(idx)}
                          style={styles.removeImageBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Xóa ảnh"
                        >
                          <Ionicons name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {images.length < MAX_IMAGES && (
                      <TouchableOpacity
                        style={styles.addImageBtn}
                        onPress={pickImages}
                      >
                        <Ionicons
                          name="camera-outline"
                          size={24}
                          color="#64748b"
                        />
                        <Text style={styles.addImageText}>Thêm ảnh</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.priorityField]}>
                  <PrioritySelector />
                </View>

                <View style={[styles.field, styles.quantityField]}>
                  <Text style={styles.label}>Số lượng</Text>
                  <View style={styles.quantityInput}>
                    <TextInput
                      style={styles.quantityText}
                      keyboardType="number-pad"
                      value={affectedQuantity}
                      onChangeText={(t) => {
                        const cleaned = t.replace(/[^0-9]/g, "");
                        setAffectedQuantity(cleaned);
                      }}
                      textAlign="center"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={submit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="construct-outline" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      Tạo yêu cầu bảo trì
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerSafe: {
    backgroundColor: "#fff",
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  form: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
  },
  field: {
    marginBottom: 20,
  },
  priorityField: {
    flex: 1,
    marginRight: 16,
  },
  quantityField: {
    width: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  label: {
    color: "#374151",
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  subLabel: {
    color: "#64748b",
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: Platform.OS === "ios" ? 14 : 12,
    borderRadius: 12,
    fontSize: 16,
    color: "#374151",
  },
  textArea: {
    minHeight: 100,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
  },

  /* Images UI */
  imagesRow: {
    flexDirection: "row",
  },
  imageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 10,
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  pickImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeImageBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },
  addImageText: { fontSize: 12, color: "#64748b", marginTop: 6 },

  /* Furniture */
  furnitureContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  furnitureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  furnitureButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  furnitureButtonText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f0fdf4",
    borderTopWidth: 1,
    borderTopColor: "#dcfce7",
  },
  selectedText: {
    fontSize: 14,
    color: "#15803d",
    fontWeight: "500",
    marginLeft: 8,
  },
  furnitureName: {
    fontWeight: "600",
    color: "#166534",
  },
  placeholderContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f766e",
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  furnitureItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  furnitureItemSelected: {
    backgroundColor: "#f0fdfa",
  },
  furnitureItemContent: {
    flex: 1,
  },
  furnitureItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  furnitureItemQuantity: {
    fontSize: 14,
    color: "#64748b",
  },

  /* Priority Selector */
  priorityContainer: {
    flex: 1,
  },
  priorityButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: (width - 64) / 4 - 12,
  },
  priorityButtonSelected: {
    backgroundColor: "#f0fdfa",
    borderWidth: 2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  priorityTextSelected: {
    color: "#0f766e",
    fontWeight: "600",
  },

  /* Quantity */
  quantityInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    overflow: "hidden",
  },
  quantityText: {
    padding: Platform.OS === "ios" ? 16 : 14,
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    textAlign: "center",
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d9488",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
