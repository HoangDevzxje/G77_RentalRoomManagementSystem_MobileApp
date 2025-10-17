import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getAccessToken,
  getUser,
  getRole,
  removeTokens,
} from "../utils/storage";
import { loginApi, logoutApi } from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const [token, userData, userRole] = await Promise.all([
          getAccessToken(),
          getUser(),
          getRole(),
        ]);

        if (token && userData) {
          setUser({
            accessToken: token,
            user: userData,
            role: userRole,
          });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginApi(email, password);
      setUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await removeTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user?.accessToken,
      }}
    >
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
