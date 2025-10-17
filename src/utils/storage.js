import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const ROLE_KEY = "role";

export const setTokens = async (accessToken, user = null, role = null) => {
  try {
    if (accessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    if (role) await AsyncStorage.setItem(ROLE_KEY, role);
  } catch (error) {
    console.log("Error saving tokens:", error);
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const getRole = async () => {
  try {
    return await AsyncStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
};

export const removeTokens = async () => {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, USER_KEY, ROLE_KEY]);
  } catch (error) {
    console.log("Error removing tokens:", error);
  }
};
