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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { getMyRoomDetail } from "../../api/roomApi";
import { createRequest } from "../../api/maintenanceApi";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");
const MAX_IMAGES = 5;

const CATEGORIES = [
  { label: "Điện (Electrical)", value: "electrical", icon: "flash" },
  { label: "Nước (Plumbing)", value: "plumbing", icon: "water" },
  { label: "Điều hòa (A/C)", value: "air_conditioning", icon: "thermometer" },
  { label: "Khóa cửa (Door Lock)", value: "door_lock", icon: "key" },
  { label: "Tường/Trần", value: "wall_ceiling", icon: "business" },
  { label: "Sàn nhà", value: "flooring", icon: "layers" },
  { label: "Cửa sổ", value: "windows", icon: "browsers" },
  { label: "Thiết bị gia dụng", value: "appliances", icon: "tv" },
  { label: "Internet/Wifi", value: "internet_wifi", icon: "wifi" },
  { label: "Côn trùng", value: "pest_control", icon: "bug" },
  { label: "Vệ sinh", value: "cleaning", icon: "trash" },
  { label: "An toàn", value: "safety", icon: "shield-checkmark" },
  { label: "Khác", value: "other", icon: "ellipsis-horizontal" },
];

export default function CreateMaintenanceRequest({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data state
  const [furnitures, setFurnitures] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);

  const [furnitureId, setFurnitureId] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affectedQuantity, setAffectedQuantity] = useState("1");
  const [images, setImages] = useState([]);

  const [showFurnitureModal, setShowFurnitureModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadRoomData();
  }, []);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      const r = await getMyRoomDetail();
      const room = r?.room ?? r;
      if (!room) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy thông tin phòng của bạn",
        });
        return;
      }

      setRoomInfo(room);
      const roomFurn = r?.furnitures ?? room?.furnitures ?? [];
      const validFurnitures = roomFurn.filter((f) => f && (f.name || f._id));
      setFurnitures(validFurnitures);
    } catch (err) {
      console.error("loadRoomData error:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không tải được dữ liệu phòng",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề sự cố";
    }

    if (!category) {
      newErrors.category = "Vui lòng chọn danh mục sự cố";
    }

    if (!affectedQuantity || parseInt(affectedQuantity) < 1) {
      newErrors.affectedQuantity = "Số lượng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === "title") setTitle(value);
    if (field === "description") setDescription(value);
    if (field === "affectedQuantity") {
      const cleaned = value.replace(/[^0-9]/g, "");
      setAffectedQuantity(cleaned);
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSelectFurniture = (item) => {
    if (item) {
      const fId = String(item._id || item.id);
      setFurnitureId(fId);
      setCategory("furniture");

      if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
    } else {
      setFurnitureId("");
      setCategory("");
    }
    setShowFurnitureModal(false);
  };

  const handleSelectCategory = (val) => {
    setCategory(val);
    if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
    setShowCategoryModal(false);
  };

  const pickImages = async () => {
    try {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Toast.show({ type: "error", text1: "Cần cấp quyền truy cập ảnh" });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
      });

      if (!result.canceled && result.assets.length > 0) {
        const items = result.assets.map((asset, idx) => ({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}_${idx}.jpg`,
          type: "image/jpeg",
        }));
        setImages((prev) => [...prev, ...items].slice(0, MAX_IMAGES));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!validateForm()) {
      Toast.show({ type: "error", text1: "Vui lòng kiểm tra lại thông tin" });
      return;
    }

    Alert.alert("Xác nhận", "Gửi yêu cầu bảo trì này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Gửi yêu cầu",
        onPress: async () => {
          try {
            setSubmitting(true);
            const payload = {
              roomId: roomInfo?.id ?? roomInfo?._id,
              category,
              title: title.trim(),
              description: description.trim(),
              affectedQuantity: parseInt(affectedQuantity),
              images: images,
            };

            if (category === "furniture" && furnitureId) {
              payload.furnitureId = furnitureId;
            }

            console.log("Submitting:", payload);
            await createRequest(payload, user.accessToken);

            Toast.show({ type: "success", text1: "Tạo yêu cầu thành công" });
            setTimeout(() => navigation.goBack(), 1500);
          } catch (err) {
            const msg = err?.response?.data?.message || "Tạo yêu cầu thất bại";
            Toast.show({ type: "error", text1: msg });
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={26} color="#1e293b" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Báo hỏng / Bảo trì</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const FurnitureModal = () => (
    <Modal
      visible={showFurnitureModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFurnitureModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn thiết bị trong phòng</Text>
            <TouchableOpacity onPress={() => setShowFurnitureModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.furnitureItem}
            onPress={() => handleSelectFurniture(null)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.furnitureItemName}>
                Vấn đề khác (Điện, Nước, Tường...)
              </Text>
              <Text style={styles.subLabel}>
                Không thuộc danh sách đồ nội thất
              </Text>
            </View>
            {!furnitureId && (
              <Ionicons name="checkmark" size={20} color="#0d9488" />
            )}
          </TouchableOpacity>

          <FlatList
            data={furnitures}
            keyExtractor={(item, i) => String(item._id || i)}
            renderItem={({ item }) => {
              const fId = String(item._id || item.id);
              const isSelected = furnitureId === fId;
              return (
                <TouchableOpacity
                  style={[
                    styles.furnitureItem,
                    isSelected && styles.furnitureItemSelected,
                  ]}
                  onPress={() => handleSelectFurniture(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.furnitureItemName}>{item.name}</Text>
                    <Text style={styles.furnitureItemQuantity}>
                      SL: {item.quantity}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color="#0d9488" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  const CategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn loại sự cố</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.furnitureItem,
                  category === item.value && styles.furnitureItemSelected,
                ]}
                onPress={() => handleSelectCategory(item.value)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color="#64748b"
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.furnitureItemName}>{item.label}</Text>
                {category === item.value && (
                  <Ionicons name="checkmark" size={20} color="#0d9488" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#0d9488"
          style={{ marginTop: 50 }}
        />
      </SafeAreaView>
    );
  }

  const selectedFurniture = furnitures.find(
    (f) => String(f._id || f.id) === String(furnitureId)
  );
  const selectedCategoryLabel = CATEGORIES.find(
    (c) => c.value === category
  )?.label;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Thông tin sự cố</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Đối tượng gặp sự cố</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowFurnitureModal(true)}
            >
              <Text
                style={[
                  styles.selectBtnText,
                  !furnitureId && { color: "#1e293b" },
                ]}
              >
                {selectedFurniture
                  ? selectedFurniture.name
                  : "Vấn đề khác (Điện, Nước...)"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, errors.category && styles.labelError]}>
              Danh mục <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.selectBtn,
                furnitureId && styles.disabledBtn,
                errors.category && styles.inputError,
              ]}
              onPress={() => !furnitureId && setShowCategoryModal(true)}
              disabled={!!furnitureId}
            >
              <Text style={styles.selectBtnText}>
                {furnitureId
                  ? "Nội thất (Furniture)"
                  : selectedCategoryLabel || "Chọn danh mục..."}
              </Text>
              {!furnitureId && (
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              )}
            </TouchableOpacity>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, errors.title && styles.labelError]}>
              Tiêu đề <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.title && styles.inputError]}
              placeholder="Vd: Vòi nước bị rò, Điều hòa không mát..."
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={(v) => handleInputChange("title", v)}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                errors.affectedQuantity && styles.labelError,
              ]}
            >
              Số lượng bị ảnh hưởng
            </Text>
            <TextInput
              style={[styles.textInput, { width: 100, textAlign: "center" }]}
              keyboardType="number-pad"
              value={affectedQuantity}
              onChangeText={(v) => handleInputChange("affectedQuantity", v)}
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Mô tả & Hình ảnh</Text>

          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Mô tả chi tiết tình trạng..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={(v) => handleInputChange("description", v)}
            textAlignVertical="top"
          />

          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>
              Hình ảnh ({images.length}/{MAX_IMAGES})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
            >
              {images.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.pickImage} />
                  <TouchableOpacity
                    onPress={() => removeImageAt(idx)}
                    style={styles.removeImageBtn}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={pickImages}
                >
                  <Ionicons name="camera-outline" size={24} color="#64748b" />
                  <Text style={styles.addImageText}>Thêm</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Gửi yêu cầu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FurnitureModal />
      <CategoryModal />
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  scrollContent: { padding: 16, paddingBottom: 100 },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f766e",
    marginBottom: 16,
  },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#475569", marginBottom: 6 },
  required: { color: "#dc2626" },

  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 100 },
  inputError: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4 },
  labelError: { color: "#dc2626" },

  selectBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  disabledBtn: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  selectBtnText: { fontSize: 15, color: "#1e293b" },

  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    overflow: "hidden",
  },
  pickImage: { width: "100%", height: "100%" },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: { fontSize: 12, color: "#64748b", marginTop: 4 },

  actionBar: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  submitBtn: {
    backgroundColor: "#0d9488",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: "#94a3b8" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  furnitureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  furnitureItemSelected: { backgroundColor: "#f0fdfa" },
  furnitureItemName: { fontSize: 15, fontWeight: "500", color: "#334155" },
  furnitureItemQuantity: { fontSize: 13, color: "#64748b", marginTop: 2 },
  subLabel: { fontSize: 13, color: "#94a3b8" },
});
