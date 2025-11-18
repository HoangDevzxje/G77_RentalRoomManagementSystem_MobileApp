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
import ProfileScreen from "../screens/profile/ProfileScreen";
import AccountScreen from "../screens/profile/AccountScreen";
import PostListScreen from "../screens/post/PostListScreen";
import RoomDetailScreen from "../screens/post/RoomDetailScreen";
import BookingScreen from "../screens/booking/BookingScreen";
import BookingFormScreen from "../screens/booking/BookingFormScreen";
import ContactScreen from "../screens/contact/ContactScreen";
import ContactDetailScreen from "../screens/contact/ContactDetailScreen";
import ContractsListScreen from "../screens/contract/ContractsListScreen";
import ContractDetailScreen from "../screens/contract/ContractDetailScreen";
import UpcomingExpireScreen from "../screens/contract/UpcomingExpireScreen";
import RoomScreen from "../screens/room/RoomScreen";

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
      {/* Main */}
      <Stack.Screen name="BottomTabs" component={BottomTabs} />

      {/* Auth */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="SendOtp" component={SendOtpScreen} />

      {/* Home */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* Post */}
      <Stack.Screen name="PostList" component={PostListScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />

      {/* Booking */}
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="BookingForm" component={BookingFormScreen} />

      {/* Contact*/}
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />

      {/* Profile */}
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      {/* Contracts */}
      <Stack.Screen name="Contracts" component={ContractsListScreen} />
      <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
      <Stack.Screen name="UpcomingExpire" component={UpcomingExpireScreen} />
      {/*Room*/}
      <Stack.Screen name="Room" component={RoomScreen} />
    </Stack.Navigator>
  );
}
