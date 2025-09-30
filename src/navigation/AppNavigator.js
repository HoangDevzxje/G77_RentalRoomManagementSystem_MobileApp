import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import BottomTabs from "./BottomTabs";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyOtpScreen from "../screens/auth/VerifyOtpScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import { useAuth } from "../context/AuthContext";
import SendOtpScreen from "../screens/auth/SendOtpScreen";
import HomeScreen from "../screens/home/HomeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { loading } = useAuth();

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
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="SendOtp" component={SendOtpScreen} />
    </Stack.Navigator>
  );
}
