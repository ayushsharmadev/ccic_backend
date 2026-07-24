"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaModal from "@/components/utils/ApnaModal";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { sanitizeRichText } from "@/lib/utils/sanitizeRichText";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: "",
  });
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    newsTitle: "",
    content: "",
  });

  // View modal handlers
  const handleViewClick = (newsTitle, content) => {
    setViewModal({
      isOpen: true,
      newsTitle,
      content: content || "No content available for this news article.",
    });
  };

  const handleViewClose = () => {
    setViewModal({
      isOpen: false,
      newsTitle: "",
      content: "",
    });
  };

  // Delete handlers
  const handleDeleteClick = (newsId, newsTitle) => {
    setDeleteModal({
      isOpen: true,
      newsId,
      newsTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/news/${deleteModal.newsId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("News article deleted successfully!");
        // Refresh the news list
        setNews((prev) =>
          prev.filter((item) => item.id !== deleteModal.newsId)
        );
      } else {
        showError(result.error || "Failed to delete news article");
      }
    } catch (error) {
      console.error("Error deleting news article:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({ isOpen: false, newsId: null, newsTitle: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, newsId: null, newsTitle: "" });
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch news data from API
  const fetchNews = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/news?page=${page}&limit=8&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedNews = data.data.news.map((item) => ({
          id: item.id,
          title: item.title,
          shortDescription: item.shortDescription,
          content: item.content,
          category: item.category,
          author: item.author,
          status: item.status,
          publishedAt: item.publishedAt,
          createdAt: item.createdAt,
        }));
        setNews(transformedNews);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalItems(data.data.pagination?.totalCount || 0);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch news:", data.error);
        setNews([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setNews([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchNews(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchNews(page, debouncedSearchTerm);
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
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:justify-between">
        <div className="h-7 min-w-0 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse md:w-60"></div>
        <div className="h-7 w-24 shrink-0 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
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
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 items-center">
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
    "shrink-0 whitespace-nowrap bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const selectedBannerClass =
    "mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/30 rounded-lg transition-colors";
  const selectedTextClass = "text-sm text-primary-800 dark:text-primary-100";
  const clearButtonClass =
    "ml-4 text-primary hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100 underline text-xs";
  const tableWrapperClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm transition-colors";
  const rowClassName = "text-gray-900 dark:text-white/80 transition-colors";
  const columns = [
    {
      key: "title",
      header: "News Title",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
            {item.title}
          </div>
          <div className="text-xs text-gray-500 dark:text-white/60 transition-colors">
            {item.shortDescription}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-3 h-3 rounded-full border border-gray-300 dark:border-slate-700"
            style={{ backgroundColor: item.category?.color || "#6B7280" }}
          ></div>
          <span className="text-xs text-gray-700 dark:text-white/70 transition-colors">
            {item.category?.name || "No Category"}
          </span>
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-900 dark:text-white/80 transition-colors",
      render: (item) => item.author?.name || "Unknown",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
            item.status === "published"
              ? "bg-primary-100 text-primary-800 dark:bg-primary/20 dark:text-primary-100"
              : item.status === "draft"
              ? "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-100"
              : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/70"
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
        "text-center text-sm text-gray-900 dark:text-white/80 transition-colors",
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
            onClick={() => handleViewClick(item.title, item.content)}
            className="admin-action admin-action-view"
          >
            View
          </button>
          <Link
            href={`/admin/news/edit/${item.id}`}
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

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <h1 className={headerTitleClass}>News Management</h1>
        <p className={headerSubtitleClass}>
          Manage news articles and publications for CCIC
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
            placeholder="Search news articles..."
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
        <Link href="/admin/news/add" className={buttonPrimaryClass}>
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
          Add News
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

      {/* News Table */}
      <ApnaTable
        data={news}
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
        emptyMessage="No news articles found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["title"]}
        tableClassName={tableWrapperClass}
        rowClassName={rowClassName}
      />

      {/* Content View Modal */}
      <ApnaModal
        isOpen={viewModal.isOpen}
        onClose={handleViewClose}
        title={`Content - ${viewModal.newsTitle}`}
        size="lg"
        showFooter={false}
      >
        <div
          className="college-richtext text-gray-700 dark:text-white/80 leading-relaxed text-base transition-colors"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(
              viewModal.content || "No content available for this news article."
            ),
          }}
        ></div>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete News Article"
        message={`Are you sure you want to delete the news article "${deleteModal.newsTitle}"? This action cannot be undone.`}
        confirmText="Delete Article"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
