import React, { createContext, useContext, useState, useEffect } from "react";

/* =========================
   Types
========================= */

type User = any; // 🔥 Replace with your real User type later

type AcademicYear = any; // Replace with proper type if you have one

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  academicYear: AcademicYear | null;
  authLoading: boolean;
  justLoggedIn: boolean;

  login: (userData: User, tokenValue: string) => void;
  logout: () => void;
  setJustLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  handleAcademicYearChange: (option: AcademicYear) => void;
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

    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);

    setJustLoggedIn(true);
  };

  // Logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    sessionStorage.clear();
  };

  // Restore session
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const storedAccessToken = sessionStorage.getItem("accessToken");
    const storedRefreshToken = sessionStorage.getItem("accessToken");

    if (storedAccessToken && storedRefreshToken && storedUser) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
    }

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,

        authLoading,
        justLoggedIn,
        login,
        logout,
        setJustLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
