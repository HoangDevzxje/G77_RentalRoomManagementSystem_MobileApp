import React from "react";
import { StatusBar } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style={{ barStyle: "dark-content" }} />
      <AppNavigator />
    </AuthProvider>
  );
}
