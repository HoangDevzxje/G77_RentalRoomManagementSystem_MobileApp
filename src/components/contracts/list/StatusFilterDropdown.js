import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const StatusFilterDropdown = ({ options, selected, onSelect, visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.statusFilterDropdown}>
      <ScrollView style={styles.statusFilterList}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusFilterItem,
              selected === option.value && styles.statusFilterItemSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.statusFilterText,
                selected === option.value && styles.statusFilterTextSelected,
              ]}
            >
              {option.label}
            </Text>
            {selected === option.value && (
              <Ionicons name="checkmark" size={16} color="#0d9488" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  statusFilterDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
    maxHeight: 200,
  },
  statusFilterList: { maxHeight: 200 },
  statusFilterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  statusFilterItemSelected: { backgroundColor: "#f0fdfa" },
  statusFilterText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  statusFilterTextSelected: { color: "#0d9488", fontWeight: "600" },
});

export default StatusFilterDropdown;
