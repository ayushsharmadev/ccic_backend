"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaModal from "@/components/utils/ApnaModal";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function BlogCategoriesList() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
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
  const [editModal, setEditModal] = useState({
    isOpen: false,
    categoryId: null,
    formData: {
      name: "",
      slug: "",
      description: "",
      color: "#3b82f6",
      displayOrder: 0,
      isActive: true,
    },
  });
  const [aboutModal, setAboutModal] = useState({
    isOpen: false,
    categoryName: "",
    description: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCategories = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/blog-categories?page=${page}&limit=8&search=${search}`
      );
      const data = await response.json();

      if (data.success) {
        const transformedCategories = data.data.map((category) => ({
          id: category._id,
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          color: category.color || "#3b82f6",
          displayOrder: category.displayOrder || 0,
          isActive: category.isActive !== undefined ? category.isActive : true,
        }));
        setCategories(transformedCategories);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalCount || transformedCategories.length);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchCategories(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCategories(page, debouncedSearchTerm);
  };

  const handleAdd = () => {
    setEditModal({
      isOpen: true,
      categoryId: null,
      formData: {
        name: "",
        slug: "",
        description: "",
        color: "#3b82f6",
        displayOrder: 0,
        isActive: true,
      },
    });
  };

  const handleEdit = (category) => {
    setEditModal({
      isOpen: true,
      categoryId: category._id,
      formData: {
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        color: category.color || "#3b82f6",
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive !== undefined ? category.isActive : true,
      },
    });
  };

  const handleDelete = (id) => {
    const category = categories.find((c) => c._id === id);
    if (category) {
      setDeleteModal({
        isOpen: true,
        categoryId: id,
        categoryName: category.name,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch(`/api/blog-categories/${deleteModal.categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Category deleted successfully!");
        fetchCategories();
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" });
      } else {
        showError(data.error || "Failed to delete category");
      }
    } catch (error) {
      showError("Failed to delete category");
    }
  };

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

  const handleSave = async () => {
    try {
      const token = getAccessToken();
      const url = editModal.categoryId
        ? `/api/blog-categories/${editModal.categoryId}`
        : "/api/blog-categories";

      const response = await fetch(url, {
        method: editModal.categoryId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editModal.formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          editModal.categoryId
            ? "Category updated successfully!"
            : "Category created successfully!"
        );
        fetchCategories(currentPage, debouncedSearchTerm);
        setEditModal({ isOpen: false, categoryId: null, formData: {} });
      } else {
        showError(data.error || "Failed to save category");
      }
    } catch (error) {
      showError("Failed to save category");
    }
  };

  const handleSelectionChange = (newSelectedItems) => {
    setSelectedItems(newSelectedItems);
  };

  const handleSelectAll = (pageIds, allSelected) => {
    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedItems((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Category Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 transition-colors duration-300"
            style={{ backgroundColor: item.color }}
          ></div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
              {item.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-white/60 transition-colors duration-300">
              {item.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "color",
      header: "Color",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-6 h-6 rounded border border-gray-300 dark:border-slate-700 transition-colors duration-300"
            style={{ backgroundColor: item.color }}
          ></div>
          <span className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
            {item.color}
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <button
          onClick={() => handleAboutClick(item.name, item.description)}
          className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary/20 dark:text-primary-200 dark:border-primary/60"
        >
          View Description
        </button>
      ),
    },
    {
      key: "displayOrder",
      header: "Order",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white transition-colors duration-300",
    },
    {
      key: "isActive",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
            item.isActive
              ? "bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary-200"
              : "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-200"
          }`}
        >
          {item.isActive ? "active" : "inactive"}
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
            onClick={() => handleEdit(item)}
            className="admin-action admin-action-edit"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item._id)}
            className="admin-action admin-action-delete"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const LoadingSkeleton = () => (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-44 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>

        {/* Search & Add Button Skeleton */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="h-9 min-w-0 w-full sm:w-64 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-9 w-28 sm:w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="hidden md:block bg-gray-100 dark:bg-slate-900 px-4 py-3">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_110px] gap-4">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_110px] gap-4">
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-6 md:h-8 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-6 md:h-8 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-6 md:h-8 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-6 md:h-8 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Blog Categories Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage and organize blog categories for MBBS content
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
            placeholder="Search categories..."
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
          onClick={handleAdd}
          className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-primary dark:hover:bg-primary-600"
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
          Add Category
        </button>
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/40 rounded-lg transition-colors duration-300">
          <p className="text-sm text-primary-800 dark:text-primary-100">
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
      />

      {/* Description Modal */}
      <ApnaModal
        isOpen={aboutModal.isOpen}
        onClose={handleAboutClose}
        title={`Description - ${aboutModal.categoryName}`}
        size="lg"
        showFooter={false}
      >
        <div className="prose prose-lg max-w-none text-gray-700 dark:text-white/80 transition-colors duration-300">
          <div className="leading-relaxed text-base">
            {aboutModal.description}
          </div>
        </div>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: "" })}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${deleteModal.categoryName}"? This action cannot be undone.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        icon="danger"
        loading={false}
      />

      {/* Add/Edit Modal */}
      <ApnaModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, categoryId: null, formData: {} })}
        onSubmit={handleSave}
        title={editModal.categoryId ? "Edit Category" : "Add Category"}
        submitText={editModal.categoryId ? "Update" : "Save"}
        cancelText="Cancel"
        size="md"
        showFooter={true}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 block transition-colors duration-300">
              Name *
            </label>
            <input
              type="text"
              value={editModal.formData.name || ""}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, name: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 block transition-colors duration-300">
              Slug *
            </label>
            <input
              type="text"
              value={editModal.formData.slug || ""}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, slug: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              placeholder="e.g., ayurveda-insights"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 block transition-colors duration-300">
              Description
            </label>
            <textarea
              value={editModal.formData.description || ""}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, description: e.target.value },
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
              placeholder="Brief description of this category"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 block transition-colors duration-300">
                Color
              </label>
              <input
                type="color"
                value={editModal.formData.color || "#3b82f6"}
                onChange={(e) =>
                  setEditModal((prev) => ({
                    ...prev,
                    formData: { ...prev.formData, color: e.target.value },
                  }))
                }
              className="w-full h-10 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer bg-white dark:bg-slate-900 transition-colors duration-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 block transition-colors duration-300">
                Display Order
              </label>
              <input
                type="number"
                value={editModal.formData.displayOrder || 0}
                onChange={(e) =>
                  setEditModal((prev) => ({
                    ...prev,
                    formData: {
                      ...prev.formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editModal.formData.isActive || false}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, isActive: e.target.checked },
                }))
              }
              className="w-4 h-4 text-primary border-gray-300 dark:border-slate-700 rounded focus:ring-primary bg-white dark:bg-slate-900 transition-colors duration-300"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 dark:text-white/80 cursor-pointer transition-colors duration-300"
            >
              Active Status
            </label>
          </div>
        </div>
      </ApnaModal>
    </div>
  );
}
