"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "@/components/utils/ImageUpload";
import {
  HiUser,
  HiKey,
  HiEye,
  HiEyeOff,
  HiCheck,
  HiX,
  HiShieldCheck,
  HiClock,
  HiBadgeCheck,
  HiCamera,
} from "react-icons/hi";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // General loading, though more specific ones are used
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0); // For cache busting
  const [initialLoading, setInitialLoading] = useState(true); // For minimum loading time

  // Profile form state - based on User model
  const [profileData, setProfileData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Validation state
  const [errors, setErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });
  const [avatarMessage, setAvatarMessage] = useState({ type: "", text: "" });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  // Minimum loading time effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2500); // 2.5 seconds minimum loading time

    return () => clearTimeout(timer);
  }, []);

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (profileData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (profileData.username.trim().length > 30) {
      newErrors.username = "Username cannot exceed 30 characters";
    }

    if (!profileData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (profileData.firstName.trim().length > 50) {
      newErrors.firstName = "First name cannot exceed 50 characters";
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (profileData.lastName.trim().length > 50) {
      newErrors.lastName = "Last name cannot exceed 50 characters";
    }

    if (profileData.phoneNumber && profileData.phoneNumber.trim().length > 20) {
      newErrors.phoneNumber = "Phone number cannot exceed 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfile()) return;

    setProfileLoading(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        setProfileMessage({ type: "success", text: data.message });
        updateUser(data.user);
        // Update form with new data
        setProfileData({
          username: data.user.username || "",
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          phoneNumber: data.user.phoneNumber || "",
        });
        // Clear message after 3 seconds
        setTimeout(() => setProfileMessage({ type: "", text: "" }), 3000);
      } else {
        setProfileMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordMessage({ type: "success", text: data.message });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Clear message after 3 seconds
        setTimeout(() => setPasswordMessage({ type: "", text: "" }), 3000);
      } else {
        setPasswordMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Password change error:", error);
      setPasswordMessage({
        type: "error",
        text: "Failed to change password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (file, previewUrl) => {
    // This is now handled by the ImageUpload component
    // Just update the preview if needed
    if (previewUrl) {
      setAvatarVersion((prev) => prev + 1); // Increment version to bust cache
    }
  };

  const handleAvatarUploadSuccess = (uploadedFile) => {
    if (uploadedFile) {
      setAvatarMessage({
        type: "success",
        text: "Avatar uploaded successfully!",
      });
      setAvatarVersion((prev) => prev + 1); // Increment version to bust cache

      // Update user with new avatar
      if (user) {
        updateUser({ ...user, avatar: uploadedFile.fileUrl });
      }

      // Clear message after 1.5 seconds
      setTimeout(() => setAvatarMessage({ type: "", text: "" }), 1500);
    }
  };

  const handleAvatarUploadError = (error) => {
    setAvatarMessage({ type: "error", text: error.message || "Upload failed" });
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(
        0
      )}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (user?.username) {
      return user.username;
    }
    return "User";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get account status
  const getAccountStatus = () => {
    if (user?.lockUntil && new Date(user.lockUntil) > new Date()) {
      return {
        status: "locked",
        text: "Account Locked",
        color: "text-secondary",
        bgColor: "bg-red-100",
        icon: <HiClock className="w-4 h-4" />,
      };
    }
    if (user?.isActive) {
      return {
        status: "active",
        text: "Active",
        color: "text-primary",
        bgColor: "bg-green-100",
        icon: <HiBadgeCheck className="w-4 h-4" />,
      };
    }
    return {
      status: "inactive",
      text: "Inactive",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      icon: <HiClock className="w-4 h-4" />,
    };
  };

  const accountStatus = getAccountStatus();

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="h-full p-6">
      {/* Page Header Skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse mb-2"></div>
        <div className="h-4 bg-muted rounded w-80 animate-pulse"></div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Profile Information Skeleton */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            {/* Profile Information Header */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
            </div>

            {/* Profile Form Skeleton */}
            <div className="space-y-6">
              {/* Username Field */}
              <div>
                <div className="h-4 bg-muted rounded w-20 animate-pulse mb-2"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>

              {/* Name Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse mb-2"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse mb-2"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              </div>

              {/* Phone Number Field */}
              <div>
                <div className="h-4 bg-muted rounded w-24 animate-pulse mb-2"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Security Tips Skeleton */}
          <div className="mt-6 bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="h-6 bg-muted rounded w-32 animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Right Side Skeleton */}
        <div className="space-y-6">
          {/* Avatar Upload Skeleton */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
            </div>

            {/* Avatar Upload Area */}
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 bg-muted rounded-full animate-pulse"></div>
              <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Password Change Skeleton */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-36 animate-pulse"></div>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <div className="h-4 bg-muted rounded w-28 animate-pulse mb-2"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>

              {/* New Password */}
              <div>
                <div className="h-4 bg-muted rounded w-24 animate-pulse mb-2"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="h-4 bg-muted rounded w-32 animate-pulse mb-2"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <div className="h-10 bg-muted rounded w-28 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Account Information Skeleton */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
            </div>

            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Show skeleton while user data is loading or during minimum loading time
  if (!user || initialLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and account security
        </p>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="mb-6 p-4 bg-secondary-50 border border-red-200 rounded-lg flex items-center gap-2">
          <HiX className="h-5 w-5 text-secondary" />
          <span className="text-sm text-red-800">{errors.general}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <HiUser className="h-5 w-5 text-primary" />
              Profile Information
            </h2>

            <form onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Username */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) =>
                      handleProfileChange("username", e.target.value)
                    }
                    className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.username ? "border-red-300" : "border-input"
                    }`}
                    placeholder="Enter username"
                    minLength={3}
                    maxLength={30}
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.username}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Username must be 3-30 characters long and unique
                  </p>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) =>
                      handleProfileChange("firstName", e.target.value)
                    }
                    className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.firstName ? "border-red-300" : "border-input"
                    }`}
                    placeholder="Enter first name"
                    maxLength={50}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) =>
                      handleProfileChange("lastName", e.target.value)
                    }
                    className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.lastName ? "border-red-300" : "border-input"
                    }`}
                    placeholder="Enter last name"
                    maxLength={50}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={(e) =>
                      handleProfileChange("phoneNumber", e.target.value)
                    }
                    className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.phoneNumber ? "border-red-300" : "border-input"
                    }`}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-primary hover:bg-primary-700 disabled:bg-primary-400 text-white px-8 py-3 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                  {profileLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </div>
            </form>

            {/* Profile Message */}
            {profileMessage.text && (
              <div
                className={`mt-4 p-3 rounded text-sm ${
                  profileMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {profileMessage.text}
              </div>
            )}
          </div>

          {/* Additional Info Card */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <HiShieldCheck className="h-5 w-5 text-primary" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-medium text-primary mb-2">
                  Profile Picture
                </h4>
                <p className="text-sm text-primary/80 mb-3">
                  Upload a new profile picture to personalize your account
                </p>
                <button
                  onClick={() =>
                    document.querySelector('input[type="file"]').click()
                  }
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Upload Now →
                </button>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <h4 className="font-medium text-emerald-400 mb-2">Security</h4>
                <p className="text-sm text-emerald-500/90 mb-3">
                  Change your password regularly to keep your account secure
                </p>
                <span className="text-primary text-sm font-medium">
                  Password form available on the right
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Avatar Upload and Password Change */}
        <div className="space-y-6">
          {/* Top - Avatar Upload */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <HiUser className="h-5 w-5 text-primary" />
              Profile Picture
            </h3>

            <ImageUpload
              title="Profile Picture"
              preview={
                user?.avatar ? `${user.avatar}?t=${avatarVersion}` : null
              }
              onFileChange={handleAvatarUpload}
              onRemove={() => {
                // Handle avatar removal if needed
                setAvatarMessage({ type: "success", text: "Avatar removed" });
              }}
              accept="image/*"
              maxSize="5MB"
              width="96px"
              height="96px"
              uploadType="avatars"
              identifier={user?._id}
              onUploadSuccess={handleAvatarUploadSuccess}
              onUploadError={handleAvatarUploadError}
              showUploadProgress={true}
            />

            {/* Avatar Message */}
            {avatarMessage.text && (
              <div
                className={`mt-3 p-2 rounded text-sm ${
                  avatarMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {avatarMessage.text}
              </div>
            )}
          </div>

          {/* Bottom - Password Change */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <HiKey className="h-5 w-5 text-primary" />
              Change Password
            </h3>

            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.currentPassword
                          ? "border-red-300"
                          : "border-input"
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <HiEyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <HiEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.newPassword
                          ? "border-red-300"
                          : "border-input"
                      }`}
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <HiEyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <HiEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.newPassword}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      className={`w-full bg-surface-elevated text-foreground placeholder:text-muted-foreground px-3 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.confirmPassword
                          ? "border-red-300"
                          : "border-input"
                      }`}
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <HiEyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <HiEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-secondary">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-primary hover:bg-primary-700 disabled:bg-primary-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Password Message */}
            {passwordMessage.text && (
              <div
                className={`mt-3 p-2 rounded text-sm ${
                  passwordMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {passwordMessage.text}
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <HiShieldCheck className="h-5 w-5 text-primary" />
              Account Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-foreground/80">Email:</span>
                <span className="ml-2 text-foreground">{user?.email}</span>
              </div>
              <div>
                <span className="font-medium text-foreground/80">Role:</span>
                <span className="ml-2 text-foreground capitalize">
                  {user?.role}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground/80">Member Since:</span>
                <span className="ml-2 text-foreground">
                  {formatDate(user?.createdAt)}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground/80">Last Login:</span>
                <span className="ml-2 text-foreground">
                  {formatDate(user?.lastLogin)}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground/80">Last Updated:</span>
                <span className="ml-2 text-foreground">
                  {formatDate(user?.updatedAt)}
                </span>
              </div>
              <div>
                <span className="font-medium text-foreground/80">
                  Account Status:
                </span>
                <span className={`ml-2 ${accountStatus.color}`}>
                  {accountStatus.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
