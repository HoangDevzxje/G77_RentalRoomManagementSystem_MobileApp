import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import HomeScreen from "../screens/home/HomeScreen";
import MessagesScreen from "../screens/messages/MessagesScreen";
import FindRoomScreen from "../screens/Room/FindRoomScreen";
import ProfileScreen from "../screens/auth/ProfileScreen";
import Header from "../components/Header";

const Tab = createBottomTabNavigator();

const withHeader =
  (Component) =>
  ({ style, ...props }) => {
    return (
      <View style={{ flex: 1 }}>
        <Header />
        <View
          style={[
            { flex: 1, paddingTop: 60 },
            style,
            style?.pointerEvents
              ? { pointerEvents: style.pointerEvents }
              : null,
          ]}
        >
          <Component {...props} />
        </View>
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
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Trang chủ" component={withHeader(HomeScreen)} />
      <Tab.Screen name="Nhắn tin" component={withHeader(MessagesScreen)} />
      <Tab.Screen name="Tìm phòng" component={withHeader(FindRoomScreen)} />
      <Tab.Screen name="Tài khoản" component={withHeader(ProfileScreen)} />
    </Tab.Navigator>
  );
}
