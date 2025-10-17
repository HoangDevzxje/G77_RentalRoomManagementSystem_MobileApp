import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getRooms } from "../../api/roomApi";
import { useAuth } from "../../context/AuthContext";
import RoomCard from "../../components/room/RoomCard";

const { width, height } = Dimensions.get("window");
const HORIZONTAL_PADDING = 16;
const CARD_SPACING = 12;
const NUM_COLUMNS = 2;
const AVAILABLE_WIDTH = width - HORIZONTAL_PADDING * 2;
const CARD_WIDTH = (AVAILABLE_WIDTH - CARD_SPACING) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

export default function RoomListScreen({ route, navigation }) {
  const buildingId = route.params?.buildingId;
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        let data;
        if (buildingId) {
          data = await getRooms({ buildingId });
        } else {
          data = await getRooms({ status: "available" });
        }
        setRooms(data);
        setFilteredRooms(data);
        setError(null);
      } catch (error) {
        setError(`Lỗi: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRooms();
    } else {
      setError("Vui lòng đăng nhập để xem danh sách phòng");
      setLoading(false);
    }
  }, [buildingId, isAuthenticated]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter((room) =>
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchQuery, rooms]);

  const renderRoomItem = ({ item, index }) => (
    <View style={styles.cardWrapper}>
      <RoomCard
        room={item}
        cardWidth={CARD_WIDTH}
        cardHeight={CARD_HEIGHT}
        onPress={() =>
          navigation.navigate("RoomDetail", { id: item._id || item.id })
        }
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>❌ {error}</Text>
        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#94a3b8"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập số phòng để tìm kiếm..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultCountContainer}>
        <Text style={styles.resultCount}>
          Tìm thấy {filteredRooms.length} phòng
        </Text>
      </View>

      {filteredRooms.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.noRooms}>📭 Không tìm thấy phòng nào</Text>
          <Text style={styles.noRoomsSub}>
            {searchQuery
              ? `với số phòng "${searchQuery}"`
              : buildingId
              ? "trong tòa nhà này"
              : "phù hợp với tìm kiếm"}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.buttonText}>Xóa tìm kiếm</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  searchContainer: {
    backgroundColor: "white",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },
  resultCountContainer: {
    backgroundColor: "white",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  resultCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: CARD_SPACING,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
  },
  error: {
    color: "#ef4444",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
  },
  noRooms: {
    fontSize: 18,
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
  },
  noRoomsSub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
