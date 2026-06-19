"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const accessToken = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (accessToken && userData) {
        const user = JSON.parse(userData);
        setUser(user);
        setIsAuthenticated(true);
      } else {
        console.log("❌ No valid auth data found");
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("🔐 Attempting login for:", email);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("📡 Login response:", data);

      if (data.success) {
        const { user, token, refreshToken } = data;
        console.log("✅ Login successful, user:", user);

        // Store tokens and user data
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);

        console.log("💾 Auth state updated, isAuthenticated:", true);
        return { success: true, user };
      } else {
        console.log("❌ Login failed:", data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        const { user, tokens } = data.data;

        // Store tokens and user data
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);

        return { success: true, user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const createAdmin = async (userData) => {
    try {
      const response = await fetch("/api/auth/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        const { user, tokens } = data.data;

        // Store tokens and user data
        localStorage.setItem("token", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);

        return { success: true, user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Admin creation error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Reset state
    setUser(null);
    setIsAuthenticated(false);

    // Redirect to login
    router.push("/login");
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        const { accessToken } = data.data;
        localStorage.setItem("accessToken", accessToken);
        return accessToken;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return null;
    }
  };

  const getAccessToken = () => {
    return localStorage.getItem("token");
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isModerator = () => {
    return user?.role === "moderator";
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const requireAuth = (redirectTo = "/login") => {
    if (!isAuthenticated && !loading) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const requireAdmin = (redirectTo = "/login") => {
    if (!requireAuth(redirectTo)) return false;

    if (!isAdmin()) {
      router.push("/unauthorized");
      return false;
    }
    return true;
  };

  const requireRole = (role, redirectTo = "/login") => {
    if (!requireAuth(redirectTo)) return false;

    if (!hasRole(role)) {
      router.push("/unauthorized");
      return false;
    }
    return true;
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem("user", JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    createAdmin,
    logout,
    refreshToken,
    getAccessToken,
    isAdmin,
    isModerator,
    hasRole,
    hasAnyRole,
    requireAuth,
    requireAdmin,
    requireRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
