import React, { createContext, useContext, useState, useEffect } from "react";
import { apiEndpoints } from "../services/api";

/* =========================
   Types
========================= */

type User = any; // 🔥 Replace with your real User type later

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction>;
  accessToken: string | null;
  refreshToken: string | null;

  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;

  authLoading: boolean;
  justLoggedIn: boolean;
  setJustLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);
  const [authLoading, setLoading] = useState<boolean>(true);

  // Login
  const login = (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    setJustLoggedIn(true);
  };

  // Logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.clear();
  };

  const restoreSession = async () => {
    try {
      const res = await apiEndpoints.refreshAccessToken({
        refreshToken: localStorage.getItem("refreshToken"),
      });

      const data = res.data;

      login(data?.user, data?.accessToken, data?.refreshToken);
      // console.log("Refreshed User Data: ", data?.user)
    } catch (error) {
      console.error("Error refreshing session: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        accessToken,
        refreshToken,

        login,
        logout,

        authLoading,
        justLoggedIn,
        setJustLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
