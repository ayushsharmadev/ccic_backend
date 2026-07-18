"use client";

import {
  HiEye,
  HiEyeOff,
  HiUser,
  HiLockClosed,
  HiCheck,
  HiX,
  HiSparkles,
  HiShieldCheck,
  HiAcademicCap,
} from "react-icons/hi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    router.replace(
      user?.role === "admin" ? "/admin/dashboard" : "/unauthorized"
    );
  }, [authLoading, isAuthenticated, router, user?.role]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // Use AuthContext login function
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setSuccessMessage("Login successful! Redirecting...");

        // Redirect based on role
        setTimeout(() => {
          if (result.user.role === "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/unauthorized");
          }
        }, 1000);
      } else {
        setErrors({
          general:
            result.error ||
            "Login failed. Please check your credentials and try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-primary via-primary/90 to-primary/80">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          {/* Top Section - Logo & Welcome */}
          <div>
            <div className="mb-8">
              <div className="relative w-32 h-16 mb-6">
                <div
                  role="img"
                  aria-label="CCIC Logo"
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #ffffff 0%, color-mix(in srgb, var(--accent) 55%, #ffffff) 100%)",
                    WebkitMaskImage: "url(/mainLogo.png)",
                    maskImage: "url(/mainLogo.png)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </div>
              <h1 className="text-4xl font-bold mb-3">Welcome Back</h1>
              <p className="text-lg text-white/90 leading-relaxed max-w-md">
                Sign in to access your dashboard and manage your education and
                admission journey.
              </p>
            </div>
          </div>

          {/* Middle Section - Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                <HiShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Secure Access</h3>
                <p className="text-sm text-white/80">
                  Your data is protected with industry-standard encryption
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                <HiAcademicCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Expert Guidance</h3>
                <p className="text-sm text-white/80">
                  Access personalized counseling and admission support
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                <HiSparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Real-time Updates
                </h3>
                <p className="text-sm text-white/80">
                  Stay informed about your application status instantly
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section - Footer */}
          <div className="text-sm text-white/70">
            <p>© 2025 CCIC. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="relative w-36 h-16 mx-auto mb-1">
              <div
                role="img"
                aria-label="CCIC Logo"
                className="h-full w-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--primary-800), var(--primary) 62%, var(--accent))",
                  WebkitMaskImage: "url(/mainLogo.png)",
                  maskImage: "url(/mainLogo.png)",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-600 dark:text-white/70">
              Sign in to your account
            </p>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sign In
            </h2>
            <p className="text-sm text-gray-600 dark:text-white/70">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/30 rounded-lg flex items-center gap-3 transition-colors duration-300">
              <HiCheck className="h-5 w-5 text-green-600 dark:text-emerald-400 shrink-0" />
              <span className="text-sm text-green-800 dark:text-emerald-100">
                {successMessage}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/30 rounded-lg flex items-center gap-3 transition-colors duration-300">
              <HiX className="h-5 w-5 text-red-600 dark:text-rose-400 shrink-0" />
              <span className="text-sm text-red-800 dark:text-rose-100">
                {errors.general}
              </span>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg p-8 transition-colors duration-300">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 ${
                      errors.email
                        ? "border-red-400 dark:border-red-500"
                        : "border-gray-300 dark:border-slate-600"
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <HiX className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-white/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 ${
                      errors.password
                        ? "border-red-400 dark:border-red-500"
                        : "border-gray-300 dark:border-slate-600"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5" />
                    ) : (
                      <HiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <HiX className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      handleInputChange("rememberMe", e.target.checked)
                    }
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700 dark:text-white/75 cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <HiLockClosed className="h-5 w-5" />
                    Sign In
                  </span>
                )}
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <p className="text-xs text-center text-gray-500 dark:text-white/60">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Contact Admin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
