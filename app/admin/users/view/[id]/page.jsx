"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  HiArrowLeft,
  HiUser,
  HiMail,
  HiPhone,
  HiShieldCheck,
  HiCalendar,
  HiClock,
  HiPencil,
  HiTrash,
} from "react-icons/hi";
import { showError } from "@/components/utils/ApnaNotify";

export default function ViewUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);

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
        setUser(data.data);
      } else {
        showError("Failed to fetch user: " + data.error);
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      showError("Error fetching user");
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors duration-300">
            <div className="text-center">
              <div className="mx-auto mb-4">
                <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-slate-800 animate-pulse mx-auto"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-32 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 mx-auto mb-4 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-16 mx-auto animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-20 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Skeleton */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors duration-300">
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-40 mb-6 animate-pulse"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information Skeleton */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 border-b border-gray-200 dark:border-slate-800 pb-2 animate-pulse"></div>

                <div className="space-y-3">
                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Account Information Skeleton */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-36 border-b border-gray-200 dark:border-slate-800 pb-2 animate-pulse"></div>

                <div className="space-y-3">
                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-8 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-12 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                  </div>

                  <div>
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-20 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Show skeleton immediately, no authentication checking text
  if (loading) {
    return <LoadingSkeleton />;
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: {
        color: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
        icon: HiShieldCheck,
      },
      moderator: {
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
        icon: HiShieldCheck,
      },
      user: {
        color: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white",
        icon: HiUser,
      },
    };

    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User Not Found
          </h1>
          <p className="text-gray-600 dark:text-white/70 mb-6">
            The user you're looking for doesn't exist.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <HiArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/admin/users"
            className="flex items-center text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >
            <HiArrowLeft className="w-4 h-4 mr-1" />
            Back to Users
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
              User Details
            </h1>
            <p className="text-xs text-gray-600 dark:text-white/70">
              View detailed information about{" "}
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/users/edit/${user._id}`}
              className="inline-flex items-center px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary-700 transition-colors"
            >
              <HiPencil className="w-3.5 h-3.5 mr-1" />
              Edit User
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-5 transition-colors duration-300">
            <div className="text-center">
              <div className="mx-auto mb-4">
                {user.avatar ? (
                  <img
                    className="h-20 w-20 rounded-full object-cover mx-auto border-2 border-gray-200 dark:border-slate-700"
                    src={user.avatar}
                    alt={user.username}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto border-2 border-gray-200 dark:border-slate-700">
                    <HiUser className="w-10 h-10 text-gray-400 dark:text-white/60" />
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/60 mb-4">
                @{user.username}
              </p>
              <div className="space-y-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.isActive)}
              </div>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900/70 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-5 transition-colors duration-300">
            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-5">
              User Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-white/80 border-b border-gray-200 dark:border-slate-800 pb-2">
                  Basic Information
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Username
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {user.username}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center">
                      <HiMail className="w-3 h-3 text-gray-400 dark:text-white/50 mr-2" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      First Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.firstName || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Last Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.lastName || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <HiPhone className="w-3 h-3 text-gray-400 dark:text-white/50 mr-2" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-white/80 border-b border-gray-200 dark:border-slate-800 pb-2">
                  Account Information
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Role
                    </label>
                    <div className="flex items-center">
                      <HiShieldCheck className="w-3 h-3 text-gray-400 dark:text-white/50 mr-2" />
                      <p className="text-sm text-gray-900 dark:text-white capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Status
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Last Login
                    </label>
                    <div className="flex items-center">
                      <HiClock className="w-3 h-3 text-gray-400 dark:text-white/50 mr-2" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Account Created
                    </label>
                    <div className="flex items-center">
                      <HiCalendar className="w-3 h-3 text-gray-400 dark:text-white/50 mr-2" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/60 mb-1">
                      Last Updated
                    </label>
                    <div className="flex items-center">
                      <HiCalendar className="w-3 h-3 text-gray-400 dark:text-white/50 mr-2" />
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
