"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaModal from "@/components/utils/ApnaModal";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function NewsCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });
  const [aboutModal, setAboutModal] = useState({
    isOpen: false,
    categoryName: "",
    description: "",
  });

  // About modal handlers
  const handleAboutClick = (categoryName, description) => {
    setAboutModal({
      isOpen: true,
      categoryName,
      description: description || "No description available for this category.",
    });
  };

  const handleAboutClose = () => {
    setAboutModal({
      isOpen: false,
      categoryName: "",
      description: "",
    });
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
        `/api/news-categories/${deleteModal.categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("Category deleted successfully!");
        // Refresh the categories list
        setCategories((prev) =>
          prev.filter((category) => category.id !== deleteModal.categoryId)
        );
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
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/news-categories?page=${page}&limit=8&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedCategories = data.data.map((category) => ({
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          color: category.color || "#6B7280",
          displayOrder: category.displayOrder || 0,
          status: category.status || "active",
        }));
        setCategories(transformedCategories);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalCount || 0);
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

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-70 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`p-3 ${
              i < 7 ? "border-b border-gray-200 dark:border-slate-800" : ""
            }`}
          >
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
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
    "bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const selectedBannerClass =
    "mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/30 rounded-lg transition-colors";
  const selectedTextClass = "text-sm text-primary-800 dark:text-primary-100";
  const clearButtonClass =
    "ml-4 text-primary hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100 underline text-xs";
  const modalBodyClass =
    "text-gray-700 dark:text-white/80 leading-relaxed text-base transition-colors";
  const tableWrapperClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm transition-colors";
  const rowClassName = "text-gray-900 dark:text-white/80 transition-colors";
  const columns = [
    {
      key: "name",
      header: "Category Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700"
            style={{ backgroundColor: item.color }}
          ></div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
              {item.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-white/60 transition-colors">
              {item.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "color",
      header: "Color",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300 dark:border-slate-700"
            style={{ backgroundColor: item.color }}
          ></div>
          <span className="text-xs text-gray-600 dark:text-white/70 transition-colors">
            {item.color}
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <button
          onClick={() => handleAboutClick(item.name, item.description)}
          className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
        >
          View Description
        </button>
      ),
    },
    {
      key: "displayOrder",
      header: "Order",
      headerClassName: "text-center",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white/80 transition-colors",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
            item.status === "active"
              ? "bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary-100"
              : "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-100"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <Link
            href={`/admin/news-categories/edit/${item.id}`}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent no-underline hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
          >
            Edit
          </Link>
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

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <h1 className={headerTitleClass}>News Categories Management</h1>
        <p className={headerSubtitleClass}>
          Manage news categories and classifications for CCIC news
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-60">
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
        <Link href="/admin/news-categories/add" className={buttonPrimaryClass}>
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
        </Link>
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
        emptyMessage="No categories found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name"]}
        tableClassName={tableWrapperClass}
        rowClassName={rowClassName}
      />

      {/* Description Modal */}
      <ApnaModal
        isOpen={aboutModal.isOpen}
        onClose={handleAboutClose}
        title={`Description - ${aboutModal.categoryName}`}
        size="lg"
        showFooter={false}
      >
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className={modalBodyClass}>{aboutModal.description}</div>
        </div>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deleteModal.categoryName}"? This action cannot be undone.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
