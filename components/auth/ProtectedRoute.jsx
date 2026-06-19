"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireRole = null,
  requireAnyRole = null,
  redirectTo = "/login",
}) => {
  const { user, loading, isAuthenticated, isAdmin, hasRole, hasAnyRole } =
    useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("🛡️ ProtectedRoute check:", {
      loading,
      isAuthenticated,
      user: user?.email,
      requireAdmin,
      requireRole,
      requireAnyRole,
    });

    if (!loading) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log("❌ User not authenticated, redirecting to:", redirectTo);
        router.push(redirectTo);
        return;
      }

      // Check admin requirement
      if (requireAdmin && !isAdmin()) {
        console.log("❌ User not admin, redirecting to unauthorized");
        router.push("/unauthorized");
        return;
      }

      // Check specific role requirement
      if (requireRole && !hasRole(requireRole)) {
        console.log("❌ User doesn't have required role:", requireRole);
        router.push("/unauthorized");
        return;
      }

      // Check any role requirement
      if (requireAnyRole && !hasAnyRole(requireAnyRole)) {
        console.log(
          "❌ User doesn't have any of required roles:",
          requireAnyRole
        );
        router.push("/unauthorized");
        return;
      }

      console.log("✅ All checks passed, rendering protected content");
    }
  }, [
    loading,
    isAuthenticated,
    user,
    requireAdmin,
    requireRole,
    requireAnyRole,
    router,
    redirectTo,
  ]);

  // Show loading while checking authentication (only after mounted)
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            CCIC
          </h3>
        </div>
      </div>
    );
  }

  // Show unauthorized message if requirements not met
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (requireAdmin && !isAdmin()) {
    return null; // Will redirect to unauthorized
  }

  if (requireRole && !hasRole(requireRole)) {
    return null; // Will redirect to unauthorized
  }

  if (requireAnyRole && !hasAnyRole(requireAnyRole)) {
    return null; // Will redirect to unauthorized
  }

  // Render children if all requirements are met
  return children;
};

export default ProtectedRoute;
