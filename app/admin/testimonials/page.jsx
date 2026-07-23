"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaModal from "@/components/utils/ApnaModal";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    testimonialId: null,
    testimonialName: "",
  });
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    testimonialName: "",
    testimonial: "",
  });

  // Define table columns
  const columns = [
    {
      key: "name",
      header: "Name & Designation",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
            {item.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-white/60 transition-colors duration-300">
            {item.designation}
          </div>
        </div>
      ),
    },
    {
      key: "college",
      header: "College",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white transition-colors duration-300",
      render: (item) => item.college,
    },
    {
      key: "rating",
      header: "Rating",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          {[...Array(item.rating)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-xs">
              ★
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
            item.status === "published"
              ? "bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary-200"
              : item.status === "draft"
              ? "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "publishedAt",
      header: "Published",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white/80 transition-colors duration-300",
      render: (item) =>
        item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString()
          : "-",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleViewClick(item.name, item.testimonial)}
            className="admin-action admin-action-view"
          >
            View
          </button>
          <Link
            href={`/admin/testimonials/edit/${item.id}`}
            className="admin-action admin-action-edit"
          >
            Edit
          </Link>
          <button
            className="admin-action admin-action-delete"
            onClick={() => handleDeleteClick(item.id, item.name)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // View modal handlers
  const handleViewClick = (testimonialName, testimonial) => {
    setViewModal({
      isOpen: true,
      testimonialName,
      testimonial: testimonial || "No testimonial content available.",
    });
  };

  const handleViewClose = () => {
    setViewModal({
      isOpen: false,
      testimonialName: "",
      testimonial: "",
    });
  };

  // Delete handlers
  const handleDeleteClick = (testimonialId, testimonialName) => {
    setDeleteModal({
      isOpen: true,
      testimonialId,
      testimonialName,
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
        `/api/testimonials/${deleteModal.testimonialId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("Testimonial deleted successfully!");
        // Refresh the testimonials list
        setTestimonials((prev) =>
          prev.filter((item) => item.id !== deleteModal.testimonialId)
        );
      } else {
        showError(result.error || "Failed to delete testimonial");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({
        isOpen: false,
        testimonialId: null,
        testimonialName: "",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, testimonialId: null, testimonialName: "" });
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch testimonials data from API
  const fetchTestimonials = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/testimonials?page=${page}&limit=8&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedTestimonials = data.data.testimonials.map((item) => ({
          id: item._id,
          name: item.name,
          designation: item.designation,
          college: item.college,
          testimonial: item.testimonial,
          rating: item.rating,
          avatar: item.avatar,
          status: item.status,
          publishedAt: item.publishedAt,
          createdAt: item.createdAt,
        }));
        setTestimonials(transformedTestimonials);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalItems(data.data.pagination?.totalCount || 0);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch testimonials:", data.error);
        setTestimonials([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setTestimonials([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchTestimonials(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchTestimonials(page, debouncedSearchTerm);
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
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-64 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4 sm:flex sm:justify-between">
        <div className="h-9 min-w-0 w-full sm:w-60 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        <div className="h-9 w-30 sm:w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        {/* Table Header Skeleton */}
        <div className="hidden md:block bg-gray-100 dark:bg-slate-900 px-4 py-3">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-gray-200 dark:divide-slate-800">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 items-center">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
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
          Testimonials Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage student testimonials and reviews for CCIC
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
            placeholder="Search testimonials..."
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
        <Link
          href="/admin/testimonials/add"
          className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          Add Testimonial
        </Link>
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

      {/* Testimonials Table */}
      <ApnaTable
        data={testimonials}
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
        emptyMessage="No testimonials found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "college"]}
      />

      {/* Testimonial View Modal */}
      <ApnaModal
        isOpen={viewModal.isOpen}
        onClose={handleViewClose}
        title={`Testimonial - ${viewModal.testimonialName}`}
        size="lg"
        showFooter={false}
      >
        <div className="prose prose-lg max-w-none text-gray-700 dark:text-white/80 transition-colors duration-300">
          <div className="leading-relaxed text-base">
            "{viewModal.testimonial}"
          </div>
        </div>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from "${deleteModal.testimonialName}"? This action cannot be undone.`}
        confirmText="Delete Testimonial"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
