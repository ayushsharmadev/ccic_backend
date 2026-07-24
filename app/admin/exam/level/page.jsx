"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";

export default function ExamLevelList() {
  const [examLevels, setExamLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingExamLevel, setEditingExamLevel] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    examLevel: null,
    loading: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
  });

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExamLevel = () => {
    setModalType("add");
    setFormData({ name: "", status: "active" });
    setShowModal(true);
  };

  const handleEditExamLevel = async (examLevel) => {
    setModalType("edit");
    setEditingExamLevel(examLevel);
    setFormLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/master/exam-level/${examLevel._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setFormData({
          name: result.data.name,
          status: result.data.status || "active",
        });
      } else {
        showError("Failed to fetch exam level data");
      }
    } catch (error) {
      console.error("Error fetching exam level data:", error);
      showError("Failed to fetch exam level data");
    } finally {
      setFormLoading(false);
    }

    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem("token");

      if (modalType === "add") {
        // Add new exam level
        const response = await fetch("/api/master/exam-level", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            status: formData.status,
          }),
        });

        const result = await response.json();

        if (result.success) {
          showSuccess("Exam level added successfully");
          setShowModal(false);
          setFormData({
            name: "",
            status: "active",
          });
          fetchExamLevels();
        } else {
          showError(result.error || "Failed to add exam level");
        }
      } else {
        // Update existing exam level
        const response = await fetch(
          `/api/master/exam-level/${editingExamLevel._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.name,
              status: formData.status,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          showSuccess("Exam level updated successfully");
          setShowModal(false);
          setFormData({
            name: "",
            status: "active",
          });
          setEditingExamLevel(null);
          fetchExamLevels();
        } else {
          showError(result.error || "Failed to update exam level");
        }
      }
    } catch (error) {
      console.error("Error saving exam level:", error);
      showError("Failed to save exam level");
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ name: "", status: "active" });
    setEditingExamLevel(null);
    setFormLoading(false);
  };

  // Delete handlers
  const handleDeleteClick = (examLevel) => {
    setDeleteModal({
      isOpen: true,
      examLevel,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/master/exam-level/${deleteModal.examLevel._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("Exam level deleted successfully");
        setDeleteModal({ isOpen: false, examLevel: null, loading: false });
        fetchExamLevels();
      } else {
        showError(result.error || "Failed to delete exam level");
      }
    } catch (error) {
      console.error("Error deleting exam level:", error);
      showError("Failed to delete exam level");
    } finally {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, examLevel: null, loading: false });
  };

  // Selection handlers
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

  const columns = [
    {
      key: "name",
      header: "Exam Level Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
            item.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200"
              : "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEditExamLevel(item)}
            className="admin-action admin-action-edit"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(item)}
            className="admin-action admin-action-delete"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch exam levels data from API
  const fetchExamLevels = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8", // itemsPerPage
        search: search,
        status: "active", // Only show active exam levels
      });

      const response = await fetch(`/api/master/exam-level?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Transform data to include id field for ApnaTable
        const transformedData = (result.data || []).map((item) => ({
          ...item,
          id: item._id,
        }));
        setExamLevels(transformedData);
        setTotalPages(result.pagination.pages);
        setTotalItems(result.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch exam levels");
        setExamLevels([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error loading exam levels:", error);
      setExamLevels([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchExamLevels(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchExamLevels(page, debouncedSearchTerm);
  };

  const LoadingSkeleton = () => (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4 sm:flex sm:justify-between">
        <div className="h-9 min-w-0 w-full sm:w-60 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        <div className="h-9 w-32 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        {/* Table Header Skeleton */}
        <div className="hidden md:block bg-gray-100 dark:bg-slate-900 px-4 py-3">
          <div className="grid grid-cols-[2fr_100px_120px] gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-gray-200 dark:divide-slate-800">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-[2fr_100px_120px] gap-4 items-center">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Exam Level Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage exam levels for CCIC education
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4 sm:flex sm:justify-between">
        <div className="relative min-w-0 w-full sm:w-60">
          <svg
            className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/50 transition-colors duration-300"
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
            placeholder="Search exam levels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {searchTerm && searchTerm === debouncedSearchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/60 dark:hover:text-white/80 transition-colors duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleAddExamLevel}
          className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Exam Level
        </button>
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/40 rounded-lg transition-colors duration-300">
          <p className="text-sm text-primary-800 dark:text-primary-100 transition-colors duration-300">
            <span className="font-semibold">{selectedItems.length}</span>{" "}
            item(s) selected
            <button
              onClick={() => setSelectedItems([])}
              className="ml-4 text-primary hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100 underline text-xs transition-colors duration-200"
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      {/* Exam Levels Table */}
      <ApnaTable
        data={examLevels}
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
        emptyMessage="No exam levels found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name"]}
      />

      {/* Add/Edit Exam Level Modal */}
      <ApnaModal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalType === "add" ? "Add New Exam Level" : "Edit Exam Level"}
        onSubmit={handleModalSubmit}
        submitText={
          modalType === "add" ? "Add Exam Level" : "Update Exam Level"
        }
        cancelText="Cancel"
        size="md"
        submitDisabled={formLoading}
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Level Name *
            </label>
            {formLoading ? (
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter exam level name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2 transition-colors duration-300">
              Status
            </label>
            {formLoading ? (
              <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            ) : (
              <ApnaSelect
                title=""
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
                placeholder="Select status"
                searchable={false}
                required={false}
                buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors flex items-center justify-between text-left cursor-pointer"
              />
            )}
          </div>
        </form>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Exam Level"
        message={`Are you sure you want to delete "${deleteModal.examLevel?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon="warning"
        loading={deleteModal.loading}
      />
    </div>
  );
}
