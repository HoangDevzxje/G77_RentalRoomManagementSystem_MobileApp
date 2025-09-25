import React, { createContext, useState, useContext, useEffect } from "react";
import { getToken, setToken, removeToken } from "../utils/storage";
import { logoutApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setTokenState(storedToken);
        }
      } catch (error) {
      } finally {
        setBooting(false);
      }
    };

    initAuth();
  }, []);

  const login = async (newToken) => {
    if (!newToken) {
      return;
    }
    await setToken(newToken);
    setTokenState(newToken);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
    } finally {
      await removeToken();
      setTokenState(null);
    }
  };

  const value = {
    token,
    booting,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
