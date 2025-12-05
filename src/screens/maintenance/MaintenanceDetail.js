import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  getRequest,
  addComment,
  updateComment,
  deleteComment,
} from "../../api/maintenanceApi";
import { useAuth } from "../../context/AuthContext";

const decodeJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

if (!global.atob) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  global.atob = (input) => {
    let str = input.replace(/=+$/, "");
    let output = "";
    if (str.length % 4 == 1) throw new Error("'atob' failed");
    for (
      let bc = 0, bs = 0, buffer, i = 0;
      (buffer = str.charAt(i++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  };
}

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
  const { user } = useAuth();
  const params = route.params || {};
  const requestId =
    params.requestId || params.id || params.request?._id || params.request?.id;

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(params.request || null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineList, setTimelineList] = useState([]);

  const [updatingComments, setUpdatingComments] = useState({});
  const [deletingComments, setDeletingComments] = useState({});

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const currentUserId = useMemo(() => {
    if (!user) return null;
    const userData = user.user || user;
    if (userData?._id) return userData._id;
    if (userData?.id) return userData.id;
    if (user.accessToken) {
      const decoded = decodeJwt(user.accessToken);
      if (decoded && decoded.id) return decoded.id;
    }
    return null;
  }, [user]);

  const backupDataRef = useRef({});

  const normalizeDoc = (res) => {
    if (!res) return null;
    if (res.data && (res.data._id || res.data.id)) return res.data;
    if (res.data && res.data.data) return res.data.data;
    if (res._id || res.id) return res;
    return res;
  };

  const normalizeTimelineItem = (item) => {
    if (!item) return null;
    const normalized = { ...item };
    if (!normalized.id && normalized._id) normalized.id = normalized._id;
    if (normalized.at && !normalized.createdAt)
      normalized.createdAt = normalized.at;
    return normalized;
  };

  const load = async (forceFetch = false) => {
    if (!requestId) return;
    try {
      if (forceFetch || !request) setLoading(true);
      const res = await getRequest(requestId);
      const doc = normalizeDoc(res);
      if (doc) {
        const newRequest = JSON.parse(JSON.stringify(doc));
        if (newRequest.timeline && Array.isArray(newRequest.timeline)) {
          newRequest.timeline = newRequest.timeline.map(normalizeTimelineItem);
        }
        setRequest(newRequest);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể tải chi tiết",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(true);
  }, [requestId]);

  useEffect(() => {
    if (request?.timeline) {
      setTimelineList(request.timeline.map(normalizeTimelineItem));
    }
  }, [request]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, []);

  const checkPermission = useCallback(
    (item) => {
      if (!item || !currentUserId) return false;
      if (item.action !== "comment") return false;
      let authorId = null;
      if (typeof item.by === "string") authorId = item.by;
      else if (typeof item.by === "object" && item.by !== null)
        authorId = item.by._id || item.by.id || item.by;
      return String(currentUserId) === String(authorId);
    },
    [currentUserId]
  );

  const sortedTimeline = useMemo(() => {
    return [...timelineList].sort(
      (a, b) =>
        new Date(a.createdAt || a.at || 0) - new Date(b.createdAt || b.at || 0)
    );
  }, [timelineList]);

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      setSending(true);
      await addComment(requestId, comment.trim());
      Toast.show({ type: "success", text1: "Đã gửi bình luận" });
      setComment("");
      Keyboard.dismiss();

      setTimeout(() => {
        load(true);
      }, 1000);
    } catch (err) {
      Toast.show({ type: "error", text1: "Gửi thất bại" });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const commentToDelete = timelineList.find(
              (item) => (item._id || item.id) === commentId
            );
            if (commentToDelete) {
              backupDataRef.current[commentId] = {
                ...commentToDelete,
                _backup: true,
              };
            }

            setDeletingComments((prev) => ({
              ...prev,
              [commentId]: true,
            }));

            setTimelineList((prev) =>
              prev.filter((item) => (item._id || item.id) !== commentId)
            );

            await deleteComment(requestId, commentId);
            setDeletingComments((prev) => {
              const newState = { ...prev };
              delete newState[commentId];
              return newState;
            });

            Toast.show({ type: "success", text1: "Đã xóa" });
            setTimeout(() => {
              load(true);
            }, 2000);
          } catch (err) {
            console.error("Delete error:", err);

            if (backupDataRef.current[commentId]) {
              setTimelineList((prev) => {
                const newList = [...prev];
                const backupItem = backupDataRef.current[commentId];
                newList.push(backupItem);
                return newList;
              });
            }

            setDeletingComments((prev) => {
              const newState = { ...prev };
              delete newState[commentId];
              return newState;
            });

            Toast.show({
              type: "error",
              text1: "Lỗi xóa",
              text2: "Không thể xóa bình luận",
            });

            setTimeout(() => {
              load(true);
            }, 1000);
          }
        },
      },
    ]);
  };

  const handleUpdateComment = async () => {
    if (!editingContent.trim()) {
      Toast.show({ type: "info", text1: "Nội dung trống" });
      return;
    }

    const contentToUpdate = editingContent.trim();
    const idToUpdate = editingCommentId;

    try {
      const commentToUpdate = timelineList.find(
        (item) => (item._id || item.id) === idToUpdate
      );

      if (!commentToUpdate) {
        Toast.show({ type: "error", text1: "Không tìm thấy bình luận" });
        return;
      }

      backupDataRef.current[idToUpdate] = {
        ...commentToUpdate,
        _backup: true,
      };

      setUpdatingComments((prev) => ({
        ...prev,
        [idToUpdate]: true,
      }));

      setTimelineList((prev) =>
        prev.map((item) => {
          if ((item._id || item.id) === idToUpdate) {
            return {
              ...item,
              note: contentToUpdate,
              _optimistic: true,
            };
          }
          return item;
        })
      );

      setEditModalVisible(false);
      setEditingCommentId(null);
      setEditingContent("");

      await updateComment(requestId, idToUpdate, contentToUpdate);

      setUpdatingComments((prev) => {
        const newState = { ...prev };
        delete newState[idToUpdate];
        return newState;
      });

      Toast.show({ type: "success", text1: "Đã cập nhật" });

      setTimeout(() => {
        load(true);
      }, 1500);
    } catch (err) {
      console.error("Update error:", err);
      if (backupDataRef.current[idToUpdate]) {
        setTimelineList((prev) =>
          prev.map((item) => {
            if ((item._id || item.id) === idToUpdate) {
              return backupDataRef.current[idToUpdate];
            }
            return item;
          })
        );
      }
      setUpdatingComments((prev) => {
        const newState = { ...prev };
        delete newState[idToUpdate];
        return newState;
      });
      let errorMessage = "Cập nhật thất bại";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      Toast.show({
        type: "error",
        text1: errorMessage,
        text2: "Vui lòng thử lại",
      });
      setTimeout(() => {
        load(true);
      }, 1000);
    }
  };

  const openEditModal = (item) => {
    if (
      updatingComments[item._id || item.id] ||
      deletingComments[item._id || item.id]
    ) {
      Toast.show({
        type: "info",
        text1: "Đang xử lý...",
        text2: "Vui lòng chờ",
      });
      return;
    }

    setEditingCommentId(item._id || item.id);
    setEditingContent(item.note || "");
    setEditModalVisible(true);
  };

  const getDisplayName = (acc) => {
    if (!acc) return "Hệ thống";
    if (typeof acc === "string")
      return acc.length > 20 ? acc.substring(0, 20) + "..." : acc;
    return acc.userInfo?.fullName || acc.fullName || acc.name || "Cư dân";
  };
  const getDisplayItemName = (req) =>
    req.furnitureId?.name ||
    CATEGORY_LABELS[req.category] ||
    req.category ||
    "Bảo trì chung";
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const getStatusInfo = (s) =>
    STATUS_MAP[s] || {
      text: s,
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

  const photos = request.photos || [];
  const statusInfo = getStatusInfo(request.status);
  const displayItemName = getDisplayItemName(request);

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* HEADER */}
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
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
                      key={photo._id || `photo_${index}`}
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
              {sortedTimeline.length === 0 ? (
                <Text style={styles.emptyTimeline}>Chưa có hoạt động nào</Text>
              ) : (
                sortedTimeline.map((item, index) => {
                  const isComment = item.action === "comment";
                  const canEdit = isComment && checkPermission(item);
                  const commentId = item._id || item.id;
                  const isUpdating = updatingComments[commentId];
                  const isDeleting = deletingComments[commentId];
                  const isProcessing = isUpdating || isDeleting;

                  return (
                    <View
                      key={`${commentId}_${index}`}
                      style={styles.timelineItem}
                    >
                      {index !== sortedTimeline.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                      <View
                        style={[
                          styles.timelineDot,
                          isComment
                            ? {
                                backgroundColor: isProcessing
                                  ? "#94a3b8"
                                  : "#3b82f6",
                              }
                            : { backgroundColor: "#0d9488" },
                        ]}
                      />
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={styles.timelineActor}>
                            {getDisplayName(item.by)}
                            {isProcessing && (
                              <Text style={{ color: "#64748b", fontSize: 12 }}>
                                {" "}
                                • Đang xử lý...
                              </Text>
                            )}
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
                          <View
                            style={[
                              styles.noteBubble,
                              isProcessing && { opacity: 0.7 },
                            ]}
                          >
                            <Text style={styles.noteText}>{item.note}</Text>
                            {canEdit && !isProcessing && (
                              <View style={styles.commentActions}>
                                <TouchableOpacity
                                  onPress={() => openEditModal(item)}
                                  style={styles.actionBtn}
                                  disabled={isProcessing}
                                >
                                  <Ionicons
                                    name="create-outline"
                                    size={16}
                                    color="#3b82f6"
                                  />
                                  <Text style={styles.editBtnText}>Sửa</Text>
                                </TouchableOpacity>
                                <View style={styles.dividerVertical} />
                                <TouchableOpacity
                                  onPress={() => handleDeleteComment(commentId)}
                                  style={styles.actionBtn}
                                  disabled={isProcessing}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={16}
                                    color="#ef4444"
                                  />
                                  <Text style={styles.deleteBtnText}>Xóa</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                            {isProcessing && (
                              <View style={styles.commentActions}>
                                <ActivityIndicator
                                  size="small"
                                  color="#64748b"
                                />
                                <Text
                                  style={{
                                    color: "#64748b",
                                    fontSize: 12,
                                    marginLeft: 8,
                                  }}
                                >
                                  {isUpdating
                                    ? "Đang cập nhật..."
                                    : "Đang xóa..."}
                                </Text>
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
                placeholderTextColor="#94a3b8"
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (sending || !comment.trim()) && styles.submitButtonDisabled,
                ]}
                onPress={submitComment}
                disabled={sending || !comment.trim()}
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
        animationType="fade"
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
              placeholderTextColor="#94a3b8"
              autoFocus
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
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  noteText: { color: "#334155", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dividerVertical: {
    width: 1,
    height: 16,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 8,
  },
  editBtnText: {
    color: "#3b82f6",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  deleteBtnText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  submitButtonDisabled: { backgroundColor: "#94a3b8", opacity: 0.7 },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
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
    marginBottom: 16,
    color: "#1e293b",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalCancelBtn: { backgroundColor: "#f1f5f9" },
  modalSaveBtn: { backgroundColor: "#0d9488" },
  modalCancelText: { color: "#64748b", fontWeight: "600" },
  modalSaveText: { color: "#fff", fontWeight: "600" },
});
