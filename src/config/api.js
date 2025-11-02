import { Platform } from "react-native";
import { API_URL_BACKEND, API_URL_SHIP, TOKEN_SHIP } from "@env";

let API_URL = API_URL_BACKEND;

if (Platform.OS === "web" && __DEV__) {
  API_URL = "http://localhost:9999";
}
export const GHN_API_URL =
  API_URL_SHIP || "https://online-gateway.ghn.vn/shiip/public-api";
export const GHN_TOKEN = TOKEN_SHIP || "5a1bbde4-5491-11f0-928a-1a690f81b498";

export default API_URL;
