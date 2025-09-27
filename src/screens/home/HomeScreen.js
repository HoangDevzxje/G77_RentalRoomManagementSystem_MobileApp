import React from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Trang chủ</Text>
      <Text>Chào mừng bạn!</Text>
    </View>
  );
}
