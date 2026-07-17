"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaModal from "@/components/utils/ApnaModal";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function StreamList() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    streamId: null,
    streamName: "",
  });
  const [aboutModal, setAboutModal] = useState({
    isOpen: false,
    streamName: "",
    about: "",
  });

  // Define table columns
  const columns = [
    {
      key: "name",
      header: "Stream Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
    },
    {
      key: "logo",
      header: "Logo",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex justify-center">
          {item.logo ? (
            <img
              src={item.logo}
              alt={`${item.name} Logo`}
              className="w-8 h-8 rounded border border-gray-200 dark:border-slate-700 object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          {!item.logo && (
            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-white/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "about",
      header: "About",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <button
          onClick={() => handleAboutClick(item.name, item.about)}
          className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
        >
          View About
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            item.status === "Active"
              ? "bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary"
              : item.status === "Inactive"
              ? "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-200"
              : "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-200"
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
            href={`/admin/master/stream/edit/${item.id}`}
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

  // About modal handlers
  const handleAboutClick = (streamName, about) => {
    setAboutModal({
      isOpen: true,
      streamName,
      about: about || "No description available for this stream.",
    });
  };

  const handleAboutClose = () => {
    setAboutModal({
      isOpen: false,
      streamName: "",
      about: "",
    });
  };

  // Delete handlers
  const handleDeleteClick = (streamId, streamName) => {
    setDeleteModal({
      isOpen: true,
      streamId,
      streamName,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/streams/${deleteModal.streamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Stream deleted successfully!");
        // Refresh the streams list
        setStreams((prev) =>
          prev.filter((stream) => stream.id !== deleteModal.streamId)
        );
      } else {
        showError(result.error || "Failed to delete stream");
      }
    } catch (error) {
      console.error("Error deleting stream:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({ isOpen: false, streamId: null, streamName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, streamId: null, streamName: "" });
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch streams data from API
  const fetchStreams = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8", // itemsPerPage
        search: search,
        status: "Active", // Only show active streams
      });

      const response = await fetch(`/api/streams?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedStreams = data.data.map((stream) => ({
          id: stream._id,
          name: stream.name,
          logo: stream.logo || null,
          about: stream.about || null,
          status: stream.status,
        }));
        setStreams(transformedStreams);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch streams:", data.error);
        setStreams([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
      setStreams([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchStreams(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchStreams(page, debouncedSearchTerm);
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
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors duration-300">
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

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Stream Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage academic streams and specializations for CCIC
          education
        </p>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-60">
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
            placeholder="Search streams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
          />
          {searchTerm !== debouncedSearchTerm && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {searchTerm && searchTerm === debouncedSearchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70"
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
          href="/admin/master/stream/add"
          className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors no-underline"
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
          Add Stream
        </Link>
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/30 rounded-lg transition-colors">
          <p className="text-sm text-primary-800 dark:text-primary-100">
            <span className="font-semibold">{selectedItems.length}</span>{" "}
            item(s) selected
            <button
              onClick={() => setSelectedItems([])}
              className="ml-4 text-primary hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100 underline text-xs"
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      {/* Streams Table */}
      <ApnaTable
        data={streams}
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
        emptyMessage="No streams found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name"]}
      />

      {/* About Modal */}
      <ApnaModal
        isOpen={aboutModal.isOpen}
        onClose={handleAboutClose}
        title={`About ${aboutModal.streamName}`}
        size="lg"
        showFooter={false}
      >
        <div className="prose prose-lg max-w-none text-gray-700 dark:text-white/80">
          <div
            className="text-gray-700 dark:text-white/80 leading-relaxed text-base"
            dangerouslySetInnerHTML={{
              __html: aboutModal.about,
            }}
          />
        </div>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Stream"
        message={`Are you sure you want to delete the stream "${deleteModal.streamName}"? This action cannot be undone.`}
        confirmText="Delete Stream"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
