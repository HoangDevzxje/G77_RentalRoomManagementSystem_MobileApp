import Constants from "expo-constants";
import { Platform } from "react-native";

const extra = Constants.expoConfig?.extra ?? {};
console.log("Expo extra config:", extra);

let API_URL = extra.API_URL_BACKEND;

if (Platform.OS === "web" && __DEV__) {
  API_URL = "http://localhost:9999";
}

if (Platform.OS !== "web") {
  API_URL = extra.API_URL_BACKEND;
}

export default API_URL;
