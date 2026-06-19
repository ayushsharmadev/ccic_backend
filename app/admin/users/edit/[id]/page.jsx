"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  HiArrowLeft,
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiEye,
  HiEyeOff,
  HiCheck,
  HiX,
} from "react-icons/hi";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "user",
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setFetching(true);

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        router.push("/admin/users");
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const user = data.data;
        setFormData({
          username: user.username || "",
          email: user.email || "",
          password: "", // Don't pre-fill password
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          role: user.role || "user",
          isActive: user.isActive !== undefined ? user.isActive : true,
        });
      } else {
        showError("Failed to fetch user: " + data.error);
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      showError("Error fetching user");
      router.push("/admin/users");
    } finally {
      setFetching(false);
    }
  };

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

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password is optional for updates, but if provided, must be valid
    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (
      formData.phoneNumber &&
      !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)
    ) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        setErrors({ general: "Please login again to continue" });
        return;
      }

      // Remove empty password from update data
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("User updated successfully!");
        router.push("/admin/users");
      } else {
        if (data.details && Array.isArray(data.details)) {
          const fieldErrors = {};
          data.details.forEach((error) => {
            if (error.includes("username")) fieldErrors.username = error;
            else if (error.includes("email")) fieldErrors.email = error;
            else if (error.includes("password")) fieldErrors.password = error;
            else fieldErrors.general = error;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || "Failed to update user" });
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors duration-300">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 border-b border-gray-200 dark:border-slate-800 pb-2 animate-pulse"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 border-b border-gray-200 dark:border-slate-800 pb-2 animate-pulse"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Form Actions Skeleton */}
        <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2 mt-6">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (fetching) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/admin/users"
            className="flex items-center text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 mr-1" />
            Back to Users
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Edit User
        </h1>
        <p className="text-gray-600 dark:text-white/70">
          Update user account information for the CCIC system
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errors.general && (
            <div className="p-4 bg-red-50 dark:bg-rose-500/20 border border-red-200 dark:border-rose-500/40 rounded-lg flex items-center gap-2">
              <HiX className="h-5 w-5 text-red-600 dark:text-rose-200" />
              <span className="text-sm text-red-800 dark:text-rose-100">
                {errors.general}
              </span>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-gray-400 dark:text-white/40" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.username
                        ? "border-red-300 dark:border-red-400"
                        : "border-gray-300 dark:border-slate-700"
                    } bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40`}
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-rose-300">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-gray-400 dark:text-white/40" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email
                        ? "border-red-300 dark:border-red-400"
                        : "border-gray-300 dark:border-slate-700"
                    } bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40`}
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-rose-300">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40"
                  placeholder="Enter last name"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiPhone className="h-5 w-5 text-gray-400 dark:text-white/40" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    className={`w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phoneNumber
                        ? "border-red-300 dark:border-red-400"
                        : "border-gray-300 dark:border-slate-700"
                    } bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40`}
                    placeholder="Enter phone number"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-rose-300">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  New Password (Leave blank to keep current)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400 dark:text-white/40" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full pl-10 pr-10 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password
                        ? "border-red-300 dark:border-red-400"
                        : "border-gray-300 dark:border-slate-700"
                    } bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5" />
                    ) : (
                      <HiEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-rose-300">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Account Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Role
                </label>
                <ApnaSelect
                  value={formData.role}
                  onChange={(value) => handleInputChange("role", value)}
                  options={[
                    { value: "user", label: "User" },
                    { value: "moderator", label: "Moderator" },
                    { value: "admin", label: "Admin" },
                  ]}
                  placeholder="Select role"
                  title=""
                  buttonClassName="w-full px-3 py-2 rounded-md text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/80 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
                  Status
                </label>
                <ApnaSelect
                  value={formData.isActive ? "active" : "inactive"}
                  onChange={(value) =>
                    handleInputChange("isActive", value === "active")
                  }
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  placeholder="Select status"
                  title=""
                  buttonClassName="w-full px-3 py-2 rounded-md text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/80 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-800">
            <Link
              href="/admin/users"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-white/80 bg-white dark:bg-slate-900/70 border border-gray-300 dark:border-slate-700 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <HiCheck className="h-4 w-4" />
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
