"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import LocationFilterBar from "@/components/utils/LocationFilterBar";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

const formatExamFee = (amount, currency) => {
  if (amount === null || amount === undefined || amount === "") return "Not listed";
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return String(amount);
  if (!currency?.code) return numeric.toLocaleString("en-IN");

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.code,
    }).format(numeric);
  } catch {
    return `${currency.symbol || currency.code} ${numeric.toLocaleString("en-IN")}`;
  }
};
export default function ExamList() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [locationFilters, setLocationFilters] = useState({
    country: "",
    state: "",
  });

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    exam: null,
    loading: false,
  });

  // Filter exams based on search term (now handled by API)

  // Sample exam data removed - now using real API data

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch exams data from API
  const fetchExams = async (page = 1, search = "", country = "", state = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10", // itemsPerPage
        search: search,
        status: "active", // Only show active exams
      });

      if (country) params.set("country", country);
      if (state) params.set("state", state);

      const response = await fetch(`/api/exams?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedExams = data.data.map((exam) => ({
          id: exam._id,
          title: exam.title,
          examType: exam.examType?.name || exam.examType || "N/A",
          examLevel: exam.examLevel?.name || exam.examLevel || "N/A",
          stream: exam.stream?.name || exam.stream || "N/A",
          country: exam.country?.name || exam.state?.country?.name || "N/A",
          state: exam.state?.name || exam.state || "N/A",
          purpose: exam.purpose || "N/A",
          applicationDate: exam.applicationDate
            ? new Date(exam.applicationDate).toISOString().split("T")[0]
            : "N/A",
          examDate: exam.examDate
            ? new Date(exam.examDate).toISOString().split("T")[0]
            : "N/A",
          applicationFee: formatExamFee(
            exam.applicationFee,
            exam.applicationFeeCurrency
          ),
          noOfApplications: exam.noOfApplication?.toString() || "0",
          status: exam.status || "active",
          lastUpdated: exam.updatedAt
            ? new Date(exam.updatedAt).toISOString().split("T")[0]
            : "N/A",
        }));
        setExams(transformedExams);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch exams:", data.error);
        setExams([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      setExams([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchExams(
      1,
      debouncedSearchTerm,
      locationFilters.country,
      locationFilters.state
    );
  }, [debouncedSearchTerm, locationFilters]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchExams(
      page,
      debouncedSearchTerm,
      locationFilters.country,
      locationFilters.state
    );
  };

  const handleEdit = (item) => {
    router.push(`/admin/exam/edit/${item.id}`);
  };

  const handleDelete = (exam) => {
    setDeleteModal({
      isOpen: true,
      exam,
      loading: false,
    });
  };

  const confirmDelete = async () => {
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/exams/${deleteModal.exam.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Exam deleted successfully");
        setExams((prev) =>
          prev.filter((exam) => exam.id !== deleteModal.exam.id)
        );
        setDeleteModal({ isOpen: false, exam: null, loading: false });
      } else {
        showError("Failed to delete exam: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      showError("Error deleting exam");
    } finally {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, exam: null, loading: false });
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

  const columns = [
    {
      key: "title",
      header: "Exam Title",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      width: "250px",
    },

    {
      key: "examType",
      header: "Exam Type",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "examLevel",
      header: "Level",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "80px",
    },
    {
      key: "stream",
      header: "Stream",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "country",
      header: "Country",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "state",
      header: "State",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "purpose",
      header: "Purpose",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "150px",
      render: (item) => (
        <span
          className="truncate block max-w-[140px] text-gray-600 dark:text-white/70 transition-colors duration-300"
          title={item.purpose}
        >
          {item.purpose}
        </span>
      ),
    },
    {
      key: "applicationDate",
      header: "App Deadline",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "examDate",
      header: "Exam Date",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "applicationFee",
      header: "Fee",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "80px",
    },
    {
      key: "noOfApplications",
      header: "Applications",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "100px",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
            item.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200"
              : item.status === "inactive"
              ? "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200"
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
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "120px",
      render: (item) => (
        <div className="flex gap-1 justify-center">
          <button
            onClick={() => handleEdit(item)}
            className="px-2 py-1 text-xs text-primary dark:text-primary-200 border border-primary dark:border-primary/60 rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary/20"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="px-2 py-1 text-xs text-secondary dark:text-secondary-200 border border-secondary dark:border-secondary/60 rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-secondary-50 dark:hover:bg-secondary/20"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const LoadingSkeleton = () => (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-96 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="h-9 min-w-0 w-full sm:w-60 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-9 w-24 sm:w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-14 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        {/* Table Header Skeleton */}
        <div className="hidden md:block bg-gray-100 dark:bg-slate-900 px-4 py-3">
          <div className="grid grid-cols-[250px_100px_80px_100px_100px_150px_100px_100px_80px_100px_100px_120px] gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"
              ></div>
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
              <div className="grid grid-cols-1 md:grid-cols-[250px_100px_80px_100px_100px_150px_100px_100px_80px_100px_100px_120px] gap-4 items-center">
                {[...Array(12)].map((_, j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"
                  ></div>
                ))}
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
          Examination Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage all examinations and entrance tests for CCIC
          education
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
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
            placeholder="Search exams..."
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
          href="/admin/exam/add"
          className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
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
          Add Exam
        </Link>
        </div>

        <LocationFilterBar
          className="grid grid-cols-2 gap-3 items-end"
          itemClassName="min-w-0 w-full"
          country={locationFilters.country}
          state={locationFilters.state}
          onCountryChange={(value) =>
            setLocationFilters({ country: value, state: "" })
          }
          onStateChange={(value) =>
            setLocationFilters((prev) => ({ ...prev, state: value }))
          }
          countryApiUrl="/api/locations/countries"
          showDistrict={false}
        />
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

      {/* Exams Table */}
      <ApnaTable
        data={exams}
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
        emptyMessage="No exams found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["title", "examType", "country", "state", "stream", "purpose"]}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Exam"
        message={`Are you sure you want to delete "${deleteModal.exam?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon="warning"
        loading={deleteModal.loading}
      />
    </div>
  );
}
