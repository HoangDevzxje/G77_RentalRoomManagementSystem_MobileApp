import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ContractTopBar = ({ navigation, title = "Chi tiết" }) => {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        onPress={() =>
          navigation.canGoBack()
            ? navigation.goBack()
            : navigation.replace("Contracts")
        }
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#0d9488" />
      </TouchableOpacity>
      <Text style={styles.topTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 24) + 6,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: { padding: 4 },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
});

export default ContractTopBar;
