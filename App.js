import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "react-native";
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style={{ barStyle: "dark-content" }} />
      <AppNavigator />
    </AuthProvider>
  );
}
