import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
// Import API
import {
  getRequest,
  addComment as commentRequest, // Alias cho khớp logic cũ
  updateComment,
  deleteComment,
} from "../../api/maintenanceApi";
import { useAuth } from "../../context/AuthContext";

// Map danh mục sang tiếng Việt
const CATEGORY_LABELS = {
  furniture: "Nội thất",
  electrical: "Điện",
  plumbing: "Nước",
  air_conditioning: "Điều hòa",
  door_lock: "Khóa cửa",
  wall_ceiling: "Tường/Trần",
  flooring: "Sàn nhà",
  windows: "Cửa sổ",
  appliances: "Gia dụng",
  internet_wifi: "Internet/Wifi",
  pest_control: "Côn trùng",
  cleaning: "Vệ sinh",
  safety: "An toàn",
  other: "Khác",
};

// Map trạng thái và màu sắc
const STATUS_MAP = {
  open: {
    text: "Chờ xử lý",
    color: "#fee2e2",
    textColor: "#dc2626",
    icon: "time-outline",
  },
  in_progress: {
    text: "Đang xử lý",
    color: "#fef3c7",
    textColor: "#d97706",
    icon: "build-outline",
  },
  resolved: {
    text: "Đã hoàn thành",
    color: "#d1fae5",
    textColor: "#059669",
    icon: "checkmark-done-outline",
  },
  rejected: {
    text: "Đã từ chối",
    color: "#f3f4f6",
    textColor: "#6b7280",
    icon: "close-outline",
  },
};

export default function MaintenanceDetail({ route, navigation }) {
  const { user } = useAuth(); // Lấy user từ AuthContext
  const params = route.params || {};
  const requestId =
    params.requestId || params.id || params.request?._id || params.request?.id;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(params.request || null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  // State cho việc sửa bình luận
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const normalizeDoc = (res) => {
    if (!res) return null;
    if (res.data && (res.data._id || res.data.id)) return res.data;
    if (res.data && res.data.data) return res.data.data;
    if (res._id || res.id) return res;
    return res;
  };

  const load = async (forceFetch = false) => {
    if (request && !forceFetch && !params.requestId) {
      setLoading(false);
      return;
    }
    if (!requestId) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "ID yêu cầu không xác định",
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getRequest(requestId);
      const doc = normalizeDoc(res);
      if (doc) setRequest(doc);
      else
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy dữ liệu",
        });
    } catch (err) {
      console.error("Load Detail Error:", err);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err?.response?.data?.message || "Không thể tải chi tiết",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, [requestId]);

  // --- HÀM CHECK QUYỀN SỞ HỮU (ĐÃ SỬA CHO KHỚP AUTHCONTEXT) ---
  const checkPermission = (item) => {
    if (!item || !user) return false;

    // 1. Lấy ID người viết comment
    // item.by có thể là object (nếu populate) hoặc string ID
    const authorId = item.by?._id || item.by?.id || item.by;

    // 2. Lấy ID của chính mình
    // Cấu trúc AuthContext: { user: { _id: "...", ... }, accessToken: "..." }
    // Nên phải lấy user.user._id
    const myInfo = user.user || user;
    const myId = myInfo?._id || myInfo?.id;

    // Debug nếu cần:
    // console.log(`Author: ${authorId} | Me: ${myId}`);

    if (!authorId || !myId) return false;
    return String(authorId) === String(myId);
  };

  // --- ACTIONS ---
  const submitComment = async () => {
    if (!comment || comment.trim().length === 0) {
      Toast.show({ type: "info", text1: "Vui lòng nhập nội dung" });
      return;
    }
    try {
      setSending(true);
      await commentRequest(requestId, comment.trim());
      Toast.show({ type: "success", text1: "Đã gửi bình luận" });
      setComment("");
      Keyboard.dismiss();
      await load(true);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Gửi thất bại",
        text2: err?.response?.data?.message,
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteComment(requestId, commentId);
            Toast.show({ type: "success", text1: "Đã xóa bình luận" });
            await load(true);
          } catch (err) {
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: err?.response?.data?.message || "Không thể xóa",
            });
            setLoading(false);
          }
        },
      },
    ]);
  };

  const openEditModal = (item) => {
    setEditingCommentId(item._id);
    setEditingContent(item.note);
    setEditModalVisible(true);
  };

  const handleUpdateComment = async () => {
    if (!editingContent.trim()) {
      Toast.show({ type: "info", text1: "Nội dung không được để trống" });
      return;
    }
    try {
      setLoading(true);
      await updateComment(requestId, editingCommentId, editingContent.trim());
      setEditModalVisible(false);
      Toast.show({ type: "success", text1: "Đã cập nhật bình luận" });
      await load(true);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err?.response?.data?.message || "Cập nhật thất bại",
      });
      setLoading(false);
    }
  };

  const getDisplayName = (userAccount) => {
    if (!userAccount) return "Hệ thống";
    if (typeof userAccount === "string") return "Người dùng";
    return userAccount.userInfo?.fullName || userAccount.email || "Cư dân";
  };

  const getDisplayItemName = (req) => {
    if (
      req.furnitureId &&
      typeof req.furnitureId === "object" &&
      req.furnitureId.name
    ) {
      return req.furnitureId.name;
    }
    return CATEGORY_LABELS[req.category] || req.category || "Bảo trì chung";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusInfo = (status) =>
    STATUS_MAP[status] || {
      text: status || "Không xác định",
      color: "#f1f5f9",
      textColor: "#64748b",
      icon: "help-circle-outline",
    };

  if (loading && !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>Không tìm thấy yêu cầu</Text>
        <TouchableOpacity
          style={styles.backButtonCenter}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#0d9488", fontWeight: "600" }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timeline = request.timeline || [];
  const photos = request.photos || [];
  const statusInfo = getStatusInfo(request.status);
  const displayItemName = getDisplayItemName(request);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#0f766e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chi tiết phiếu bảo trì</Text>
            {request.roomId?.roomNumber && (
              <Text style={styles.headerSubtitle}>
                Phòng {request.roomId.roomNumber}
              </Text>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* INFO CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusInfo.color },
                ]}
              >
                <Ionicons
                  name={statusInfo.icon}
                  size={14}
                  color={statusInfo.textColor}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[styles.statusText, { color: statusInfo.textColor }]}
                >
                  {statusInfo.text}
                </Text>
              </View>
              <Text style={styles.dateText}>
                {formatDate(request.createdAt)}
              </Text>
            </View>
            <Text style={styles.title}>{request.title}</Text>
            <View style={styles.divider} />
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Đối tượng</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={
                      request.category === "furniture"
                        ? "cube-outline"
                        : "flash-outline"
                    }
                    size={16}
                    color="#475569"
                  />
                  <Text style={styles.metaValue}>{displayItemName}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Số lượng</Text>
                <Text style={styles.metaValue}>
                  {request.affectedQuantity || 1}
                </Text>
              </View>
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
            <Text style={styles.description}>
              {request.description || "Không có mô tả thêm."}
            </Text>
            {photos.length > 0 && (
              <View style={styles.photosSection}>
                <Text style={styles.subSectionTitle}>
                  Hình ảnh đính kèm ({photos.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photosContainer}
                >
                  {photos.map((photo, index) => (
                    <Image
                      key={photo._id || index}
                      source={{ uri: photo.url || photo }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* REPORTER INFO */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin xử lý</Text>
            <View style={styles.infoRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color="#64748b"
                />
                <Text style={styles.infoLabel}>Người báo:</Text>
              </View>
              <Text style={styles.infoValue}>
                {getDisplayName(request.reporterAccountId)}
              </Text>
            </View>
            {request.scheduledAt && (
              <View style={styles.infoRow}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                  <Text style={styles.infoLabel}>Lịch hẹn:</Text>
                </View>
                <Text style={[styles.infoValue, { color: "#0d9488" }]}>
                  {formatDate(request.scheduledAt)}
                </Text>
              </View>
            )}
          </View>

          {/* TIMELINE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Hoạt động & Bình luận</Text>
            <View style={styles.timelineContainer}>
              {timeline.length === 0 ? (
                <Text style={styles.emptyTimeline}>Chưa có hoạt động nào</Text>
              ) : (
                timeline.map((item, index) => {
                  const isComment = item.action === "comment";
                  return (
                    <View key={item._id || index} style={styles.timelineItem}>
                      {index !== timeline.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                      <View
                        style={[
                          styles.timelineDot,
                          isComment
                            ? { backgroundColor: "#3b82f6" }
                            : { backgroundColor: "#0d9488" },
                        ]}
                      />
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineActor}>
                            {getDisplayName(item.by)}
                          </Text>
                          <Text style={styles.timelineTime}>
                            {formatDate(item.at || item.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.timelineAction}>
                          {item.action === "created"
                            ? "Đã tạo yêu cầu"
                            : item.action === "comment"
                            ? "Đã bình luận:"
                            : item.action === "update"
                            ? "Đã cập nhật trạng thái"
                            : item.action}
                        </Text>
                        {item.note ? (
                          <View style={styles.noteBubble}>
                            <Text style={styles.noteText}>{item.note}</Text>

                            {/* --- NÚT SỬA / XÓA --- */}
                            {isComment && checkPermission(item) && (
                              <View style={styles.commentActions}>
                                <TouchableOpacity
                                  onPress={() => openEditModal(item)}
                                  style={styles.actionBtn}
                                >
                                  <Text style={styles.editBtnText}>Sửa</Text>
                                </TouchableOpacity>
                                <View style={styles.dividerVertical} />
                                <TouchableOpacity
                                  onPress={() => handleDeleteComment(item._id)}
                                  style={styles.actionBtn}
                                >
                                  <Text style={styles.deleteBtnText}>Xóa</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* INPUT COMMENT */}
            <View style={styles.commentSection}>
              <Text style={styles.subSectionTitle}>Thêm bình luận</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập nội dung trao đổi..."
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  sending && styles.submitButtonDisabled,
                ]}
                onPress={submitComment}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitButtonText}>Gửi</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* EDIT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa bình luận</Text>
            <TextInput
              style={[styles.textArea, { minHeight: 100 }]}
              value={editingContent}
              onChangeText={setEditingContent}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSaveBtn]}
                onPress={handleUpdateComment}
              >
                <Text style={styles.modalSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { padding: 6, marginRight: 8 },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 12, color: "#64748b", fontSize: 14 },
  emptyText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
    textAlign: "center",
  },
  backButtonCenter: { marginTop: 20, padding: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 13, fontWeight: "600" },
  dateText: { fontSize: 13, color: "#94a3b8" },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
    lineHeight: 26,
  },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 },
  metaGrid: { flexDirection: "row", justifyContent: "space-between" },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  description: { color: "#334155", lineHeight: 22, fontSize: 15 },
  photosSection: { marginTop: 16 },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  photosContainer: { flexDirection: "row" },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#f1f5f9",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoLabel: { fontSize: 14, color: "#64748b", marginLeft: 6 },
  infoValue: { fontSize: 14, color: "#0f172a", fontWeight: "600" },
  timelineContainer: { marginTop: 4, marginBottom: 20 },
  emptyTimeline: {
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  timelineItem: {
    flexDirection: "row",
    paddingBottom: 20,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 5,
    top: 12,
    bottom: -10,
    width: 2,
    backgroundColor: "#e2e8f0",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
    zIndex: 1,
  },
  timelineContent: { flex: 1 },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  timelineActor: { fontWeight: "700", color: "#334155", fontSize: 14 },
  timelineTime: { color: "#94a3b8", fontSize: 11 },
  timelineAction: { color: "#64748b", fontSize: 13, marginBottom: 4 },
  noteBubble: {
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  noteText: { color: "#334155", fontSize: 14 },

  // Style cho nút Sửa/Xóa
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dividerVertical: {
    width: 1,
    height: 12,
    backgroundColor: "#cbd5e1",
  },
  editBtnText: { color: "#3b82f6", fontSize: 12, fontWeight: "600" },
  deleteBtnText: { color: "#ef4444", fontSize: 12, fontWeight: "600" },

  commentSection: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    backgroundColor: "#f8fafc",
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#0d9488",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  submitButtonDisabled: { backgroundColor: "#94a3b8" },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e293b",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 12,
  },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  modalCancelBtn: { backgroundColor: "#f1f5f9" },
  modalSaveBtn: { backgroundColor: "#0d9488" },
  modalCancelText: { color: "#64748b", fontWeight: "600" },
  modalSaveText: { color: "#fff", fontWeight: "600" },
});
