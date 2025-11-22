import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { getRequest, commentRequest } from "../../api/maintenanceApi";

export default function MaintenanceDetail({ route, navigation }) {
  const params = route.params || {};
  const paramRequest = params.request ?? params.doc ?? null;
  const possibleId =
    params.requestId ??
    params.id ??
    paramRequest?._id ??
    paramRequest?.id ??
    null;

  const requestId = possibleId;
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(paramRequest);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const normalizeDoc = (res) => {
    if (!res) return null;

    if (res.data) {
      if (res.data._id || res.data.id) return res.data;
      if (res.data.data && (res.data.data._id || res.data.data.id))
        return res.data.data;
      return res.data;
    }

    return res;
  };

  const load = async (forceFetch = false) => {
    if (request && !forceFetch) {
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

      if (!doc || (!doc._id && !doc.id)) {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không nhận được dữ liệu chi tiết từ server",
        });
        setRequest(null);
      } else {
        setRequest(doc);
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: err?.response?.data?.message || "Không thể tải chi tiết",
      });
      setRequest(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramRequest) {
      setRequest(paramRequest);
      setLoading(false);
      load(true);
    } else {
      load();
    }
  }, [requestId]);

  const submitComment = async () => {
    if (!comment || comment.trim().length === 0) {
      Toast.show({ type: "info", text1: "Nhập nội dung trước khi gửi" });
      return;
    }

    Alert.alert("Xác nhận", "Gửi bình luận vào timeline?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Gửi",
        onPress: async () => {
          try {
            setSending(true);
            await commentRequest(requestId, comment.trim());
            Toast.show({ type: "success", text1: "Đã gửi bình luận" });
            setComment("");
            await load(true);
          } catch (err) {
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: err?.response?.data?.message || "Gửi thất bại",
            });
          } finally {
            setSending(false);
          }
        },
      },
    ]);
  };

  const getDisplayName = (user) => {
    if (!user) return "Hệ thống";
    return user.userInfo?.fullName || user.email || "Người dùng";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  if (loading) {
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
        <Ionicons name="document-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyText}>Không tìm thấy chi tiết yêu cầu</Text>
      </View>
    );
  }

  const timeline = request.timeline || [];
  const photos = request.photos || [];

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#0f766e" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
            {request.roomId?.roomNumber && (
              <Text style={styles.headerSubtitle}>
                Phòng {request.roomId.roomNumber}
                {request.roomId?.building?.name
                  ? ` • ${request.roomId.building.name}`
                  : ""}
              </Text>
            )}
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Thông tin chính */}
        <View style={styles.card}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {request.status || "Chờ xử lý"}
            </Text>
          </View>
          <Text style={styles.title}>
            {request.title || "Không có tiêu đề"}
          </Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>
                {request.furnitureId?.name || "Nội thất"}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="business-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>
                {request.roomId?.roomNumber || "Phòng"} ·{" "}
                {request.affectedQuantity || 1} cái
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>
                Ưu tiên: {request.priority || "Trung bình"}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.metaText}>
                Tạo: {formatDate(request.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mô tả chi tiết */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mô tả sự cố</Text>
          <Text style={styles.description}>
            {request.description || "Không có mô tả"}
          </Text>
        </View>

        {/* Ảnh đính kèm */}
        {photos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Ảnh đính kèm ({photos.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosContainer}
            >
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{
                    uri: typeof photo === "string" ? photo : photo.url,
                  }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Thông tin người xử lý */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin xử lý</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Người báo cáo:</Text>
            <Text style={styles.infoValue}>
              {getDisplayName(request.reporterAccountId)}
            </Text>
          </View>

          {request.assigneeAccountId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người xử lý:</Text>
              <Text style={styles.infoValue}>
                {getDisplayName(request.assigneeAccountId)}
              </Text>
            </View>
          )}

          {request.scheduledAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lịch hẹn:</Text>
              <Text style={styles.infoValue}>
                {formatDate(request.scheduledAt)}
              </Text>
            </View>
          )}

          {request.resolvedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hoàn thành:</Text>
              <Text style={styles.infoValue}>
                {formatDate(request.resolvedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lịch sử hoạt động</Text>
          {timeline.length === 0 ? (
            <Text style={styles.emptyTimeline}>Chưa có hoạt động nào</Text>
          ) : (
            timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineActor}>
                    {getDisplayName(item.by)}
                  </Text>
                  <Text style={styles.timelineAction}>
                    {item.action === "created"
                      ? "Tạo yêu cầu"
                      : item.action === "comment"
                      ? "Bình luận"
                      : item.action || "Cập nhật"}
                    {item.note ? `: ${item.note}` : ""}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Thêm bình luận */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thêm bình luận</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Nhập bình luận hoặc cập nhật tiến độ..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              sending && styles.submitButtonDisabled,
            ]}
            onPress={submitComment}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="#fff" />
                <Text style={styles.submitButtonText}> Gửi bình luận</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  emptyText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d97706",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  metaContainer: {
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    color: "#64748b",
    fontSize: 14,
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  description: {
    color: "#334155",
    lineHeight: 20,
    fontSize: 14,
  },
  photosContainer: {
    marginTop: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#f1f5f9",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  emptyTimeline: {
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0d9488",
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineActor: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 14,
    marginBottom: 2,
  },
  timelineAction: {
    color: "#334155",
    fontSize: 14,
    marginBottom: 4,
  },
  timelineTime: {
    color: "#94a3b8",
    fontSize: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#0f172a",
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: "#0d9488",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  submitButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
