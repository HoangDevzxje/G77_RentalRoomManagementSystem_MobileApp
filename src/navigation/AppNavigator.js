import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import HomeScreen from "../screens/home/HomeScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import Header from "../components/Header";

const Stack = createStackNavigator();

const Boot = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" />
  </View>
);

export default function AppNavigator() {
  const { booting } = useAuth();
  if (booting) return <Boot />;

  const withHeader = (Component) => (props) =>
    (
      <View style={{ flex: 1 }}>
        <Header />
        <ScrollView contentContainerStyle={{ paddingTop: 80 }}>
          <Component {...props} />
        </ScrollView>
      </View>
    );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Home"
      >
        <Stack.Screen name="Home" component={withHeader(HomeScreen)} />
        <Stack.Screen
          name="ChangePassword"
          component={withHeader(ChangePasswordScreen)}
        />
        <Stack.Screen name="Login" component={withHeader(LoginScreen)} />
        <Stack.Screen name="Register" component={withHeader(RegisterScreen)} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
