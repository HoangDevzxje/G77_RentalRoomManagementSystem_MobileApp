import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import Ionicons from "react-native-vector-icons/Ionicons";
import { submitBuildingReview as submitBuildingReviewApi } from "../../api/buildingReviewApi";

const Header = ({ title, onBack }) => {
  const androidStatus =
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  return (
    <SafeAreaView style={[styles.headerSafe, { paddingTop: androidStatus }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title || "Đánh giá tòa nhà"}
        </Text>
        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );
};

export default function BuildingReviewCreateScreen({ route, navigation }) {
  const { buildingId, buildingName, existingReview, roomId } =
    route.params || {};

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isAnonymous, setIsAnonymous] = useState(
    existingReview?.isAnonymous || false
  );

  const normalizeImages = (imgs) => {
    if (!imgs) return [];
    return imgs.map((it) =>
      typeof it === "string" ? { uri: it, name: it.split("/").pop() } : it
    );
  };

  const [images, setImages] = useState(normalizeImages(existingReview?.images));
  const [loading, setLoading] = useState(false);

  const openSettingsPrompt = () => {
    Toast.show({
      type: "info",
      text1: "Mở Cài đặt",
      text2: "Bật quyền Photos nếu bạn đã từ chối",
      visibilityTime: 2000,
      position: "top",
    });

    setTimeout(() => {
      Linking.openSettings().catch(() => {
        Toast.show({
          type: "error",
          text1: "Không thể mở Settings",
          visibilityTime: 2000,
          position: "top",
        });
      });
    }, 300);
  };

  const pickImages = async () => {
    try {
      const remaining = 5 - images.length;
      if (remaining <= 0) {
        Toast.show({
          type: "info",
          text1: "Đã đạt giới hạn 5 ảnh",
          visibilityTime: 1500,
          position: "top",
        });
        return;
      }

      // Request permission (Expo)
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền bị từ chối",
          text2: "Ứng dụng cần quyền truy cập ảnh để bạn có thể chọn hình",
          visibilityTime: 2500,
          position: "top",
        });
        return openSettingsPrompt();
      }

      // Build options
      let options = {
        quality: 0.8,
        mediaTypes:
          (ImagePicker.MediaType && ImagePicker.MediaType.Images) ||
          ImagePicker.MediaTypeOptions?.Images ||
          undefined,
        allowsMultipleSelection: true,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result) {
        Toast.show({
          type: "error",
          text1: "Không có phản hồi từ picker",
          visibilityTime: 1500,
          position: "top",
        });
        return;
      }

      const wasCancelled =
        result.canceled === true || result.cancelled === true;
      if (wasCancelled) {
        return;
      }

      let assets = [];
      if (Array.isArray(result.assets) && result.assets.length > 0) {
        assets = result.assets;
      } else if (result.uri) {
        assets = [
          {
            uri: result.uri,
            fileName: result.fileName || result.uri.split("/").pop(),
          },
        ];
      } else if (result.canceled === false && !result.assets) {
        Toast.show({
          type: "info",
          text1: "Không có ảnh được chọn (no assets)",
          visibilityTime: 1500,
          position: "top",
        });
        return;
      }

      if (!assets || assets.length === 0) {
        Toast.show({
          type: "info",
          text1: "Không có ảnh được chọn",
          visibilityTime: 1500,
          position: "top",
        });
        return;
      }

      const items = assets.slice(0, remaining).map((asset, idx) => ({
        uri: asset.uri,
        name:
          asset.fileName ||
          asset.name ||
          (asset.uri
            ? asset.uri.split("/").pop()
            : `photo_${Date.now()}_${idx}.jpg`),
        type: asset.type || "image/jpeg",
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      }));

      setImages((prev) => {
        const merged = [...prev, ...items];
        return merged.slice(0, 5);
      });

      Toast.show({
        type: "success",
        text1: `Đã thêm ${items.length} ảnh`,
        visibilityTime: 1500,
        position: "top",
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi chọn ảnh",
        text2: String(err),
        visibilityTime: 2500,
        position: "top",
      });
    }
  };

  const removeImageAt = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    Toast.show({
      type: "info",
      text1: "Đã xóa ảnh",
      visibilityTime: 1000,
      position: "top",
    });
  };

  const validateForm = () => {
    if (!buildingId) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin tòa nhà",
        visibilityTime: 2000,
        position: "top",
      });
      return false;
    }
    if (!rating || rating < 1 || rating > 5) {
      Toast.show({
        type: "error",
        text1: "Vui lòng chọn đánh giá từ 1-5 sao",
        visibilityTime: 2000,
        position: "top",
      });
      return false;
    }
    if (comment.trim().length > 500) {
      Toast.show({
        type: "error",
        text1: "Bình luận không được quá 500 ký tự",
        visibilityTime: 2000,
        position: "top",
      });
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        buildingId,
        rating,
        comment: comment.trim(),
        isAnonymous,
        images,
      };

      const result = await submitBuildingReviewApi(payload);

      Toast.show({
        type: "success",
        text1: result?.message || "Đánh giá đã được gửi thành công!",
        visibilityTime: 2000,
        position: "top",
        onHide: () => {
          // --- SỬA Ở ĐÂY: Điều hướng về BuildingReviewList ---
          // Thay thế màn hình hiện tại bằng BuildingReviewList để khi user back sẽ ko quay lại form tạo
          navigation.replace("BuildingReviewList", { buildingId });
        },
        onPress: () => {
          Toast.hide();
          navigation.replace("BuildingReviewList", { buildingId });
        },
      });
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        String(err);

      // HIỂN THỊ LỖI
      Toast.show({
        type: "error",
        text1: "Gửi thất bại",
        text2: serverMessage,
        visibilityTime: 3000,
        position: "top",
      });

      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={buildingName ? `Đánh giá toà: ${buildingName}` : "Viết đánh giá"}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
                disabled={loading}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={36}
                  color={star <= rating ? "#f59e0b" : "#cbd5e1"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 5
              ? "Rất tuyệt vời"
              : rating === 4
              ? "Tốt"
              : rating === 3
              ? "Bình thường"
              : rating === 2
              ? "Không hài lòng"
              : "Rất tệ"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bình luận (tùy chọn)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ trải nghiệm của bạn về tòa nhà..."
            placeholderTextColor="#94a3b8"
            multiline
            style={styles.commentInput}
            maxLength={500}
            editable={!loading}
          />
          <Text style={styles.charCount}>{comment.length}/500 ký tự</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.anonymousRow}>
            <View style={styles.anonymousText}>
              <Text style={styles.sectionTitle}>Đánh giá ẩn danh</Text>
              <Text style={styles.anonymousSubtitle}>
                Tên của bạn sẽ không hiển thị công khai
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: "#cbd5e1", true: "#0d9488" }}
              thumbColor={isAnonymous ? "#fff" : "#fff"}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình ảnh ({images.length}/5)</Text>
          <Text style={styles.sectionSubtitle}>
            Chia sẻ hình ảnh về tòa nhà (bấm "Thêm ảnh" nhiều lần để chọn thêm)
          </Text>

          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={`image-${index}`} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imageThumbnail}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImageAt(index)}
                  disabled={loading}
                >
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity
                style={[
                  styles.addImageButton,
                  loading && styles.disabledButton,
                ]}
                onPress={pickImages}
                disabled={loading}
              >
                <Ionicons name="camera-outline" size={28} color="#64748b" />
                <Text style={styles.addImageText}>Thêm ảnh</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {existingReview ? "CẬP NHẬT ĐÁNH GIÁ" : "GỬI ĐÁNH GIÁ"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerSafe: {
    backgroundColor: "#fff",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    fontWeight: "500",
  },
  commentInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  charCount: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
    marginTop: 4,
  },
  anonymousRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  anonymousText: {
    flex: 1,
  },
  anonymousSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
    marginBottom: 12,
  },
  imageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: "#0d9488",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  spacer: {
    height: 20,
  },
});
