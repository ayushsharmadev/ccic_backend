"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function LanguageList() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    languageId: null,
    languageName: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch languages data from API
  const fetchLanguages = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
      });

      const response = await fetch(`/api/languages?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const transformedLanguages = data.data.map((language) => ({
          id: language.id,
          name: language.name,
          shortDescription: language.shortDescription || "",
          status: language.status,
          createdAt: language.createdAt
            ? new Date(language.createdAt).toLocaleDateString("en-IN")
            : "N/A",
          updatedAt: language.updatedAt
            ? new Date(language.updatedAt).toLocaleDateString("en-IN")
            : "N/A",
        }));
        setLanguages(transformedLanguages);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch languages:", data.error);
        setLanguages([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      setLanguages([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchLanguages(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchLanguages(page, debouncedSearchTerm);
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

  const handleEdit = (language) => {
    router.push(`/admin/languages/edit/${language.id}`);
  };

  const handleDelete = async (id) => {
    const language = languages.find((l) => l.id === id);
    if (language) {
      setDeleteModal({
        isOpen: true,
        languageId: id,
        languageName: language.name,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.languageId) return;

    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/languages/${deleteModal.languageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Language deleted successfully!");
        fetchLanguages(currentPage, debouncedSearchTerm);
        setDeleteModal({ isOpen: false, languageId: null, languageName: "" });
      } else {
        showError(data.error || "Failed to delete language");
      }
    } catch (error) {
      console.error("Error deleting language:", error);
      showError("Failed to delete language. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, languageId: null, languageName: "" });
  };

  const columns = [
    {
      key: "name",
      header: "Language Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      width: "250px",
    },
    {
      key: "shortDescription",
      header: "Short Description",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      width: "400px",
      render: (item) => (
        <div className="truncate max-w-md" title={item.shortDescription}>
          {item.shortDescription || "N/A"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "100px",
      render: (item) => (
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
            item.status === "active"
              ? "bg-green-100 text-primary dark:bg-emerald-500/20 dark:text-primary"
              : "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created At",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "120px",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "150px",
      render: (item) => (
        <div className="flex gap-1 justify-center items-center">
          <Link
            href={`/admin/languages/edit/${item.id}`}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent no-underline transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-primary/20 dark:text-primary-200 dark:border-primary/60"
          >
            Edit
          </Link>
          <button
            onClick={() => handleDelete(item.id)}
            className="px-2 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-secondary-50 dark:text-secondary-200 dark:border-secondary/60 dark:hover:bg-secondary/20"
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
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="h-10 w-full sm:w-72 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-10 w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1.2fr] gap-4 px-4 py-3 bg-gray-100 dark:bg-slate-900">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1.2fr] gap-4">
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
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
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-1">
          Language Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage and organize languages
        </p>
      </div>

      {/* Search & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search languages by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <Link
          href="/admin/languages/add"
          className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-600 transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          Add New Language
        </Link>
      </div>

      {/* Selected Items Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded transition-colors duration-300">
          <p className="text-sm text-blue-900 dark:text-blue-100 transition-colors duration-300">
            {selectedItems.length} language(s) selected
          </p>
        </div>
      )}

      {/* Languages Table */}
      <ApnaTable
        data={languages}
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
        emptyMessage="No languages found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "shortDescription"]}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Language"
        message={`Are you sure you want to delete "${deleteModal.languageName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
