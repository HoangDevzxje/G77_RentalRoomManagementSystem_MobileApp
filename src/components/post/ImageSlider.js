import React from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const ImageSlider = ({ images, index, onIndexChange }) => {
  if (!images?.length) return null;

  const prev = () => onIndexChange((index - 1 + images.length) % images.length);
  const next = () => onIndexChange((index + 1) % images.length);

  return (
    <View style={s.container}>
      <Image
        source={{ uri: images[index] }}
        style={s.image}
        resizeMode="cover"
      />
      {images.length > 1 && (
        <>
          <TouchableOpacity style={s.prev} onPress={prev}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.next} onPress={next}>
            <Ionicons name="chevron-forward" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={s.counter}>
            <Text style={s.counterText}>
              {index + 1} / {images.length}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { position: "relative", height: 260, backgroundColor: "#e2e8f0" },
  image: { width: "100%", height: "100%" },
  prev: {
    position: "absolute",
    top: "50%",
    left: 16,
    marginTop: -24,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  next: {
    position: "absolute",
    top: "50%",
    right: 16,
    marginTop: -24,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  counter: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});

export default ImageSlider;
