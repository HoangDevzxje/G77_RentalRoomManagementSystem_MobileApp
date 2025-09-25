import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "accessToken";

export const setTokens = async (accessToken) => {
  try {
    if (accessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } catch {}
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const removeTokens = async () => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
};
