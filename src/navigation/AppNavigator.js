import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import BottomTabs from "./BottomTabs";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import { useAuth } from "../context/AuthContext";
import VerifyOtpScreen from "../screens/auth/VerifyOtpScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import ResetPasswordScreen from "../screens/auth/ChangePasswordScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { loading } = useAuth(); // Bỏ check user ở đây

  // Hiển thị loading khi đang check auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BottomTabs" component={BottomTabs} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="VerifyOtp"
        component={VerifyOtpScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          presentation: "modal",
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
