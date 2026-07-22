"use client";

import { useState, useEffect } from "react";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function PageCategoryList() {
  const [categories, setCategories] = useState([]);
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
  const [editingCategory, setEditingCategory] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
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

  const handleAddCategory = () => {
    setModalType("add");
    setFormData({ name: "", status: "active" });
    setShowModal(true);
  };

  const handleEditCategory = async (category) => {
    setModalType("edit");
    setEditingCategory(category);
    setFormLoading(true);

    try {
      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/page-categories/${category.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setFormData({
          name: data.data.name,
          status: data.data.status || "active",
        });
      } else {
        showError(data.error || "Failed to fetch category data");
        return;
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      showError("Network error. Please try again.");
      return;
    } finally {
      setFormLoading(false);
    }

    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    try {
      setFormLoading(true);

      // Validation
      if (!formData.name.trim()) {
        showError("Category name is required");
        return;
      }

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      if (modalType === "add") {
        // Add new category
        const response = await fetch("/api/page-categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            status: formData.status,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const newCategory = {
            id: data.data._id,
            name: data.data.name,
            slug: data.data.slug,
            status: data.data.status,
          };
          setCategories((prev) => [...prev, newCategory]);
          setTotalItems((prev) => prev + 1);
          showSuccess("Page category added successfully!");
        } else {
          showError(data.error || "Failed to add category");
          return;
        }
      } else {
        // Update existing category
        const response = await fetch(
          `/api/page-categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.name.trim(),
              status: formData.status,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setCategories((prev) =>
            prev.map((category) =>
              category.id === editingCategory.id
                ? {
                    ...category,
                    name: data.data.name,
                    slug: data.data.slug,
                    status: data.data.status,
                  }
                : category
            )
          );
          showSuccess("Page category updated successfully!");
        } else {
          showError(data.error || "Failed to update category");
          return;
        }
      }

      setShowModal(false);
      setFormData({ name: "", status: "active" });
      setEditingCategory(null);
    } catch (error) {
      console.error("Error saving category:", error);
      showError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ name: "", status: "active" });
    setEditingCategory(null);
    setFormLoading(false);
  };

  // Delete handlers
  const handleDeleteClick = (categoryId, categoryName) => {
    setDeleteModal({
      isOpen: true,
      categoryId,
      categoryName,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/page-categories/${deleteModal.categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("Page category deleted successfully!");
        // Remove from local state
        setCategories((prev) =>
          prev.filter((category) => category.id !== deleteModal.categoryId)
        );
        setTotalItems((prev) => prev - 1);
      } else {
        showError(result.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" });
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
      header: "Category Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
    },
    {
      key: "slug",
      header: "Slug",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
            item.status === "active"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100"
              : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/70"
          }`}
        >
          {item.status === "active" ? "Active" : "Inactive"}
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
            onClick={() => handleEditCategory(item)}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
          >
            Edit
          </button>
          <button
            className="px-2 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary/20 transition-colors"
            onClick={() => handleDeleteClick(item.id, item.name)}
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

  // Fetch categories data from API
  const fetchCategories = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
      });

      const response = await fetch(`/api/page-categories?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedCategories = data.data.map((category) => ({
          id: category._id,
          name: category.name,
          slug: category.slug,
          status: category.status,
        }));
        setCategories(transformedCategories);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch categories:", data.error);
        setCategories([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchCategories(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchCategories(page, debouncedSearchTerm);
  };

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-72 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:justify-between">
        <div className="h-7 min-w-0 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse md:w-60"></div>
        <div className="h-7 w-28 shrink-0 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[2fr_1.5fr_100px_100px] gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`p-3 ${
              i < 9 ? "border-b border-gray-200 dark:border-slate-800" : ""
            }`}
          >
            <div className="grid grid-cols-[2fr_1.5fr_100px_100px] gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const pageWrapperClass =
    "h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300";
  const headerTitleClass =
    "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const searchIconClass =
    "absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40";
  const searchInputClass =
    "w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const buttonPrimaryClass =
    "shrink-0 whitespace-nowrap bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const selectedBannerClass =
    "mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/30 rounded-lg transition-colors";
  const selectedTextClass = "text-sm text-primary-800 dark:text-primary-100";
  const clearButtonClass =
    "ml-4 text-primary hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100 underline text-xs";
  const tableWrapperClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm transition-colors";
  const rowClassName = "text-gray-900 dark:text-white/80 transition-colors";
  const modalLabelClass =
    "block text-sm font-medium text-gray-700 dark:text-white/80 mb-2 transition-colors";
  const modalInputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <h1 className={headerTitleClass}>Page Category Management</h1>
        <p className={headerSubtitleClass}>
          Manage page categories for organizing dynamic pages
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:justify-between">
        <div className="relative min-w-0 w-full md:w-60">
          <svg
            className={searchIconClass}
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
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={searchInputClass}
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {searchTerm && searchTerm === debouncedSearchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
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
        <button onClick={handleAddCategory} className={buttonPrimaryClass}>
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
          Add Category
        </button>
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className={selectedBannerClass}>
          <p className={selectedTextClass}>
            <span className="font-semibold">{selectedItems.length}</span>{" "}
            item(s) selected
            <button
              onClick={() => setSelectedItems([])}
              className={clearButtonClass}
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      {/* Categories Table */}
      <ApnaTable
        data={categories}
        columns={columns}
        loading={loading}
        showSearch={false}
        showPagination={true}
        itemsPerPage={10}
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
        emptyMessage="No page categories found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "slug"]}
        tableClassName={tableWrapperClass}
        rowClassName={rowClassName}
      />

      {/* Add/Edit Category Modal */}
      <ApnaModal
        isOpen={showModal}
        onClose={handleModalClose}
        title={
          modalType === "add" ? "Add New Page Category" : "Edit Page Category"
        }
        onSubmit={handleModalSubmit}
        submitText={modalType === "add" ? "Add Category" : "Update Category"}
        cancelText="Cancel"
        size="md"
        submitDisabled={formLoading || !formData.name.trim()}
      >
        <form className="space-y-4">
          <div>
            <label className={modalLabelClass}>Category Name *</label>
            {formLoading ? (
              // Form loading skeleton
              <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            ) : (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter category name"
                required
                className={modalInputClass}
              />
            )}
          </div>

          <div>
            <label className={modalLabelClass}>Status *</label>
            {formLoading ? (
              // Form loading skeleton
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
                required={true}
                buttonClassName={`${modalInputClass} flex items-center justify-between text-left cursor-pointer`}
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
        title="Delete Page Category"
        message={`Are you sure you want to delete the category "${deleteModal.categoryName}"? This action cannot be undone.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-red-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
