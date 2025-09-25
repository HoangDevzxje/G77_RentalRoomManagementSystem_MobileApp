import React, { createContext, useState, useContext, useEffect } from "react";
import { getAccessToken, setTokens, removeTokens } from "../utils/storage";
import { logoutApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedAccessToken = await getAccessToken();
        if (storedAccessToken) {
          setTokenState(storedAccessToken);
        }
      } catch (error) {
        console.log("Init auth error:", error);
      } finally {
        setBooting(false);
      }
    };

    initAuth();
  }, []);

  const login = async ({ accessToken, role, user }) => {
    if (!accessToken) return;

    await setTokens(accessToken);
    setTokenState(accessToken);
    setRole(role || null);
    setUser(user || null);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      await removeTokens();
      setTokenState(null);
      setRole(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, user, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
