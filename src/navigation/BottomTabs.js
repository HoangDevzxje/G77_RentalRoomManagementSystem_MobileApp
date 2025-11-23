import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, ScrollView } from "react-native";

import RoomListScreen from "../screens/post/PostListScreen"; // Tìm phòng (danh sách)
import RoomScreen from "../screens/room/RoomScreen"; // Chi tiết phòng (màn bạn vừa tạo)
import ContractsListScreen from "../screens/contract/ContractsListScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";

import Footer from "../components/footer/Footer";
import Header from "../components/header/Header";
import { Home } from "lucide-react-native";
import HomeRoomScreen from "../screens/home/HomeScreen";

const Tab = createBottomTabNavigator();

const withHeader =
  (Component) =>
  ({ style, ...props }) =>
    (
      <View style={{ flex: 1 }}>
        <Header />
        <View style={[{ flex: 1, paddingTop: 100 }, style]}>
          <Component {...props} />
        </View>
      </View>
    );

const withHeaderAndFooter =
  (Component) =>
  ({ style, ...props }) =>
    (
      <View style={{ flex: 1 }}>
        <Header />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 100 }}
          style={style}
        >
          <Component {...props} />
          <Footer />
        </ScrollView>
      </View>
    );

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Tìm phòng":
              iconName = "search-outline";
              break;
            case "Chi tiết phòng":
              iconName = "home-outline";
              break;
            case "Hợp đồng":
              iconName = "document-text-outline";
              break;
            case "Tài khoản":
              iconName = "person-outline";
              break;
            default:
              iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#14b8a6",
        tabBarInactiveTintColor: "#94a3b8",
        headerShown: false,
        tabBarLabelStyle: {
          marginBottom: 5,
          fontSize: 12,
        },
        tabBarStyle: {
          height: 80,
        },
      })}
    >
      {/* 1: Tìm phòng (danh sách) */}
      <Tab.Screen
        name="Tìm phòng"
        component={withHeaderAndFooter(HomeRoomScreen)}
        initialParams={{ buildingId: null }}
      />

      {/* 2: Chi tiết phòng (thay cho Trang chủ trước đây) */}
      <Tab.Screen
        name="Chi tiết phòng"
        component={withHeader(RoomScreen)}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3: Hợp đồng */}
      <Tab.Screen
        name="Hợp đồng thuê"
        component={withHeader(ContractsListScreen)}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 4: Tài khoản */}
      <Tab.Screen name="Tài khoản" component={withHeader(ProfileScreen)} />
    </Tab.Navigator>
  );
}
