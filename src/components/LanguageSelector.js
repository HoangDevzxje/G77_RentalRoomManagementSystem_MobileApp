import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import Svg, { Rect, Polygon, G } from "react-native-svg";

const LanguageSelector = ({ isScrolled = false }) => {
  const [visible, setVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("vi");
  const screenWidth = Dimensions.get("window").width;
  const [slideAnim] = useState(new Animated.Value(300));
  const [fadeAnim] = useState(new Animated.Value(0));

  const VnFlag = ({ size = 24 }) => (
    <Svg width={size} height={size * 0.67} viewBox="0 0 900 600">
      <Rect width="900" height="600" fill="#DA251D" />
      <Polygon
        fill="#FFFF00"
        points="450,150 518,437 282,262 618,262 382,437"
      />
    </Svg>
  );

  const UsFlag = ({ size = 24 }) => (
    <Svg width={size} height={size * 0.53} viewBox="0 0 7410 3900">
      <Rect width="7410" height="3900" fill="#b22234" />
      <G fill="#fff">
        {[...Array(13)].map((_, i) => (
          <Rect key={i} y={i * 300} width="7410" height="150" />
        ))}
      </G>
      <Rect width="2964" height="2100" fill="#3c3b6e" />
    </Svg>
  );

  const languages = [
    { code: "en", name: "English", flag: <UsFlag /> },
    { code: "vi", name: "Tiếng Việt", flag: <VnFlag /> },
  ];

  const openDropdown = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    closeDropdown();
  };

  const currentLang =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.triggerButton,
          isScrolled ? styles.triggerScrolled : styles.triggerDefault,
        ]}
        onPress={openDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <View style={styles.flagWrapper}>{currentLang.flag}</View>
        </View>
      </TouchableOpacity>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <Animated.View
            style={[
              styles.dropdownContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Chọn ngôn ngữ</Text>
            </View>

            {languages.map((language, index) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  currentLanguage === language.code &&
                    styles.languageItemSelected,
                  index === languages.length - 1 && styles.lastItem,
                ]}
                onPress={() => handleLanguageChange(language.code)}
                activeOpacity={0.6}
              >
                <View style={styles.languageContent}>
                  <View style={styles.flagContainer}>{language.flag}</View>
                  <Text
                    style={[
                      styles.languageText,
                      currentLanguage === language.code &&
                        styles.languageTextSelected,
                    ]}
                  >
                    {language.name}
                  </Text>
                </View>

                {currentLanguage === language.code && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  triggerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  triggerDefault: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  triggerScrolled: {
    backgroundColor: "#f0fdfa",
    borderColor: "#ccfbf1",
  },
  triggerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  flagWrapper: {
    width: 24,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: StatusBar.currentHeight + 80,
  },
  dropdownContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: Dimensions.get("window").width * 0.8,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  languageItemSelected: {
    backgroundColor: "#f0fdfa",
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  languageContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flagContainer: {
    width: 28,
    height: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  languageText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  languageTextSelected: {
    color: "#0f766e",
    fontWeight: "600",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#14b8a6",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default LanguageSelector;
