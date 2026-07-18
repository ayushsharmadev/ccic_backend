"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiUser,
  HiPhone,
  HiShieldCheck,
  HiX,
} from "react-icons/hi";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users data from API
  const fetchUsers = async (page = 1, search = "", role = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8", // itemsPerPage
        search: search,
        role: role !== "all" ? role : "",
      });

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedUsers = data.users.map((user) => ({
          id: user._id,
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isActive: user.isActive,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));
        setUsers(transformedUsers);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch users:", data.error);
        showError("Failed to fetch users");
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showError("Error fetching users");
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search or role changes
    fetchUsers(1, debouncedSearchTerm, selectedRole);
  }, [debouncedSearchTerm, selectedRole]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchUsers(page, debouncedSearchTerm, selectedRole);
  };

  const handleSelectionChange = (newSelectedItems) => {
    setSelectedItems(newSelectedItems);
  };

  const handleSelectAll = (pageIds, allSelected) => {
    if (allSelected) {
      // If all are selected, deselect all current page items
      setSelectedItems((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      // If not all are selected, select all current page items
      setSelectedItems((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleEdit = (user) => {
    router.push(`/admin/users/edit/${user.id}`);
  };

  const handleView = (user) => {
    router.push(`/admin/users/view/${user.id}`);
  };

  const handleDelete = (user) => {
    setDeleteModal({ isOpen: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteModal.user) return;

    try {
      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/users/${deleteModal.user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("User deleted successfully");
        setUsers(users.filter((user) => user.id !== deleteModal.user.id));
        setSelectedItems(
          selectedItems.filter((id) => id !== deleteModal.user.id)
        );
      } else {
        showError("Failed to delete user: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showError("Error deleting user");
    } finally {
      setDeleteModal({ isOpen: false, user: null });
    }
  };

  const getRoleBadge = (role) => {
    const safeRole = role || "user";
    const roleConfig = {
      admin: {
        color: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
        icon: HiShieldCheck,
      },
      moderator: {
        color:
          "bg-blue-100 text-primary-800 dark:bg-blue-500/20 dark:text-blue-200",
        icon: HiShieldCheck,
      },
      user: {
        color: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-white",
        icon: HiUser,
      },
    };

    const config = roleConfig[safeRole] || roleConfig.user;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {safeRole.charAt(0).toUpperCase() + safeRole.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  // Define table columns with proper structure
  const columns = [
    {
      key: "user",
      header: "User",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      width: "250px",
      render: (user) => (
        <div className="flex items-center">
          <div className="shrink-0 h-10 w-10">
            {user.avatar ? (
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={user.avatar}
                alt={user.username}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-slate-800 flex items-center justify-center">
                <HiUser className="w-5 h-5 text-gray-600 dark:text-white/60" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username}
            </div>
            <div className="text-sm text-gray-500 dark:text-white/60">
              @{user.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
      width: "200px",
      render: (user) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {user.email}
          </div>
          {user.phoneNumber && (
            <div className="text-sm text-gray-500 dark:text-white/60 flex items-center">
              <HiPhone className="w-3 h-3 mr-1" />
              {user.phoneNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "120px",
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "100px",
      render: (user) => getStatusBadge(user.isActive),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "120px",
      render: (user) => (
        <span className="text-sm text-gray-500 dark:text-white/60">
          {user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString()
            : "Never"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "220px",
      render: (user) => (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => handleView(user)}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/15 transition-colors"
          >
            <HiEye className="w-3 h-3 mr-1 inline" />
            View
          </button>
          <button
            onClick={() => handleEdit(user)}
            className="px-2 py-1 text-xs text-primary-600 border border-primary-600 rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/15 transition-colors"
          >
            <HiPencil className="w-3 h-3 mr-1 inline" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(user)}
            className="px-2 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary/15 transition-colors"
          >
            <HiTrash className="w-3 h-3 mr-1 inline" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Users Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage all users in the CCIC system
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="grid grid-cols-[3fr_1fr] gap-3 mb-4 lg:flex lg:items-center lg:justify-between">
        <div className="relative min-w-0 w-full lg:w-60">
          <svg
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {searchTerm && searchTerm === debouncedSearchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white/80"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="contents lg:flex lg:shrink-0 lg:items-center lg:gap-3">
          <div className="min-w-0 w-full lg:w-48">
            <ApnaSelect
              value={selectedRole}
              onChange={(value) => setSelectedRole(value)}
              options={[
                { value: "all", label: "All Roles" },
                { value: "admin", label: "Admin" },
                { value: "moderator", label: "Moderator" },
                { value: "user", label: "User" },
              ]}
              placeholder="Select Role"
              title=""
              className="w-full"
              buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
            />
          </div>

          <Link
            href="/admin/users/add"
            className="col-start-2 flex w-auto shrink-0 justify-self-end items-center gap-1 whitespace-nowrap rounded bg-primary px-3 py-1.5 text-xs font-medium text-white no-underline transition-colors hover:bg-primary-700 lg:col-auto lg:justify-self-auto"
          >
            <HiPlus className="w-3.5 h-3.5" />
            Add User
          </Link>
        </div>
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/25 rounded-lg transition-colors">
          <p className="text-sm text-primary-800 dark:text-primary-100">
            <span className="font-semibold">{selectedItems.length}</span>{" "}
            item(s) selected
            <button
              onClick={() => setSelectedItems([])}
              className="ml-4 text-primary-600 dark:text-primary-200 hover:text-primary-800 dark:hover:text-primary-100 underline text-xs"
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      {/* Users Table */}
      <ApnaTable
        data={users}
        columns={columns}
        loading={loading}
        showSearch={false}
        showPagination={true}
        itemsPerPage={8}
        maxPageButtons={5}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        striped={true}
        hover={true}
        bordered={false}
        compact={true}
        showHeader={true}
        stickyHeader={false}
        emptyMessage="No users found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["username", "email", "firstName", "lastName"]}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteModal.user?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
