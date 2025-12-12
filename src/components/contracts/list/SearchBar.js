import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  onClear,
  focused,
  onFocus,
  onBlur,
  submitting,
}) => {
  return (
    <View style={styles.searchRow}>
      <View
        style={[
          styles.searchContainer,
          focused && styles.searchContainerFocused,
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={focused ? "#0d9488" : "#94a3b8"}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm hợp đồng..."
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {value ? (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={onSubmit}
        activeOpacity={0.8}
      >
        {submitting ? (
          <Ionicons name="refresh" size={20} color="#fff" />
        ) : (
          <Ionicons name="search" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    minHeight: 48,
    marginRight: 10,
  },
  searchContainerFocused: {
    borderColor: "#0d9488",
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
  },
  clearButton: {
    paddingLeft: 8,
  },
  searchButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 48,
    minWidth: 48,
  },
});

export default SearchBar;
