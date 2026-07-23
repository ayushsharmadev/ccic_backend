"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function FooterSectionsPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionTitle: "",
  });

  // Define table columns
  const columns = [
    {
      key: "title",
      header: "Title",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      render: (item) => item.title,
    },
    {
      key: "links",
      header: "Links Count",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white transition-colors duration-300",
      render: (item) => item.links?.length || 0,
    },
    {
      key: "displayOrder",
      header: "Order",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white transition-colors duration-300",
      render: (item) => item.displayOrder || 0,
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
              ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
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
          <Link
            href={`/admin/footer-sections/edit/${item.id}`}
            className="admin-action admin-action-edit"
          >
            Edit
          </Link>
          <button
            className="admin-action admin-action-delete"
            onClick={() => handleDeleteClick(item.id, item.title)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Delete handlers
  const handleDeleteClick = (sectionId, sectionTitle) => {
    setDeleteModal({
      isOpen: true,
      sectionId,
      sectionTitle,
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
        `/api/footer-sections/${deleteModal.sectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Footer section deleted successfully!");
        setDeleteModal({ isOpen: false, sectionId: null, sectionTitle: "" });
        fetchSections(currentPage, debouncedSearchTerm);
      } else {
        showError(data.error || "Failed to delete footer section");
      }
    } catch (error) {
      console.error("Error deleting footer section:", error);
      showError("Network error. Please try again.");
    }
  };

  // Fetch sections
  const fetchSections = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });

      const response = await fetch(`/api/footer-sections?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedSections = data.data.sections.map((item) => ({
          id: item._id,
          title: item.title,
          links: item.links || [],
          displayOrder: item.displayOrder || 0,
          isActive: item.isActive,
          sectionType: item.sectionType || "links",
        }));
        setSections(transformedSections);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalItems(data.data.pagination?.totalCount || 0);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch footer sections:", data.error);
        setSections([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching footer sections:", error);
      setSections([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections(1);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchSections(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchSections(page, debouncedSearchTerm);
  };

  // Selection handlers
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

  const LoadingSkeleton = () => (
    <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm transition-colors duration-300">
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
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
        <div className="mb-2 md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
              Footer Sections
            </h1>
            <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
              Manage footer sections for mobile, tablet, and desktop views
            </p>
          </div>
          <Link
            href="/admin/footer-sections/add"
            className="hidden shrink-0 items-center whitespace-nowrap px-3 py-1.5 text-xs text-white bg-primary hover:bg-primary-700 rounded no-underline transition-colors duration-200 md:flex"
          >
            + Add Section
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:block">
        <div className="relative min-w-0 w-full max-w-md">
          <svg
            className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-2 text-xs border border-gray-300 dark:border-slate-700 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary/30 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <Link
          href="/admin/footer-sections/add"
          className="flex shrink-0 items-center whitespace-nowrap px-3 py-2 text-xs text-white bg-primary hover:bg-primary-700 rounded no-underline transition-colors duration-200 md:hidden"
        >
          + Add Section
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ApnaTable
          data={sections}
          showSearch={false}
          columns={columns}
          selectedItems={selectedItems}
          onSelectionChange={handleSelectionChange}
          onSelectAll={handleSelectAll}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, sectionId: null, sectionTitle: "" })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Footer Section"
        message={`Are you sure you want to delete "${deleteModal.sectionTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
