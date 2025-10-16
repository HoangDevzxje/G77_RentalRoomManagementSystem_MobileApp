import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, ScrollView } from "react-native";

import HomeScreen from "../screens/home/HomeScreen";
import MessagesScreen from "../screens/messages/MessagesScreen";
import RoomListScreen from "../screens/room/RoomListScreen";
import ProfileScreen from "../screens/auth/ProfileScreen";

import Header from "../components/Header";
import Footer from "../components/Footer";

const Tab = createBottomTabNavigator();

const withHeader =
  (Component) =>
  ({ style, ...props }) => {
    return (
      <View style={{ flex: 1 }}>
        <Header />
        <View style={[{ flex: 1, paddingTop: 100 }, style]}>
          <Component {...props} />
        </View>
      </View>
    );
  };

const withHeaderAndFooter =
  (Component) =>
  ({ style, ...props }) => {
    return (
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
  };

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case "Trang chủ":
              iconName = "home-outline";
              break;
            case "Nhắn tin":
              iconName = "chatbubble-outline";
              break;
            case "Tìm phòng":
              iconName = "bed-outline";
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
        tabBarInactiveTintColor: "#9ca3af",
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
      <Tab.Screen
        name="Trang chủ"
        component={withHeaderAndFooter(HomeScreen)}
      />
      <Tab.Screen name="Nhắn tin" component={withHeader(MessagesScreen)} />
      <Tab.Screen
        name="Tìm phòng"
        component={withHeader(RoomListScreen)}
        initialParams={{ buildingId: null }}
      />
      <Tab.Screen name="Tài khoản" component={withHeader(ProfileScreen)} />
    </Tab.Navigator>
  );
}
