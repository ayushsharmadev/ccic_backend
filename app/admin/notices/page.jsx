"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaEditor from "@/components/utils/ApnaEditor";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function GlobalNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    noticeId: null,
    noticeTitle: "",
  });

  const [noticeModal, setNoticeModal] = useState({
    isOpen: false,
    mode: "add", // 'add' or 'edit'
    noticeId: null,
    title: "",
    content: "",
    displayOrder: 0,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch notices
  const fetchNotices = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/notices?page=${page}&limit=10&search=${search}&collegeId=global`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setNotices(result.data);
        setTotalPages(result.pagination.pages);
        setTotalItems(result.pagination.total);
        setCurrentPage(page);
      } else {
        showError(result.error || "Failed to fetch notices");
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      showError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchNotices(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchNotices(page, debouncedSearchTerm);
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

  // Add Notice Modal
  const handleAddNotice = () => {
    setNoticeModal({
      isOpen: true,
      mode: "add",
      noticeId: null,
      title: "",
      content: "",
      displayOrder: 0,
    });
  };

  // Edit Notice Modal
  const handleEditNotice = (notice) => {
    setNoticeModal({
      isOpen: true,
      mode: "edit",
      noticeId: notice._id,
      title: notice.title,
      content: notice.content || "",
      displayOrder: notice.displayOrder || 0,
    });
  };

  // Save Notice (Add/Edit)
  const handleSaveNotice = async () => {
    try {
      if (!noticeModal.title.trim()) {
        showError("Title is required");
        return;
      }

      if (!noticeModal.content.trim()) {
        showError("Content is required");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const url =
        noticeModal.mode === "add"
          ? "/api/notices"
          : `/api/notices/${noticeModal.noticeId}`;
      const method = noticeModal.mode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noticeModal.title.trim(),
          content: noticeModal.content,
          displayOrder: parseInt(noticeModal.displayOrder) || 0,
          college: null, // Global notice
          status: "active",
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess(
          noticeModal.mode === "add"
            ? "Notice added successfully!"
            : "Notice updated successfully!"
        );
        setNoticeModal({
          isOpen: false,
          mode: "add",
          noticeId: null,
          title: "",
          content: "",
          displayOrder: 0,
        });
        fetchNotices(currentPage, debouncedSearchTerm);
      } else {
        showError(result.error || "Failed to save notice");
      }
    } catch (error) {
      console.error("Error saving notice:", error);
      showError("Network error. Please try again.");
    }
  };

  const handleNoticeModalClose = () => {
    setNoticeModal({
      isOpen: false,
      mode: "add",
      noticeId: null,
      title: "",
      content: "",
      displayOrder: 0,
    });
  };

  // Delete handlers
  const handleDeleteClick = (noticeId, noticeTitle) => {
    setDeleteModal({
      isOpen: true,
      noticeId,
      noticeTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(`/api/notices/${deleteModal.noticeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        showSuccess("Notice deleted successfully!");
        fetchNotices(currentPage, debouncedSearchTerm);
      } else {
        showError(result.error || "Failed to delete notice");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({ isOpen: false, noticeId: null, noticeTitle: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, noticeId: null, noticeTitle: "" });
  };

  // Table columns
  const columns = [
    {
      key: "title",
      header: "Title",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      width: "35%",
    },
    {
      key: "content",
      header: "Content Preview",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      width: "40%",
      render: (item) => {
        if (!item.content)
          return <span className="text-gray-400 dark:text-white/50">--</span>;
        const strippedContent = item.content.replace(/<[^>]*>/g, "");
        return (
          <span className="line-clamp-2 text-gray-700 dark:text-white/80">
            {strippedContent.substring(0, 100)}
            {strippedContent.length > 100 ? "..." : ""}
          </span>
        );
      },
    },
    {
      key: "displayOrder",
      header: "Order",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "10%",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "15%",
      render: (item) => (
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={() => handleEditNotice(item)}
            className="px-3 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-primary/20 dark:border-primary/70 dark:text-primary-200"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(item._id, item.title)}
            className="px-3 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-secondary-50 dark:hover:bg-secondary/20 dark:border-secondary/70 dark:text-secondary-200"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Global Notices
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage global notices that appear on all college pages
        </p>
      </div>

      {/* Search & Add Button */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 pr-8 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/50 dark:hover:text-white/70 transition-colors duration-200"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={handleAddNotice}
          className="px-4 py-1.5 text-white rounded text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40"
          style={{
            background:
              "linear-gradient(to right, var(--primary), var(--primary-900))",
          }}
        >
          + Add Notice
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
              className="ml-4 text-primary-600 dark:text-primary-200 hover:text-primary-800 dark:hover:text-primary-100 underline text-xs transition-colors duration-200"
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      {/* Notices Table */}
      <ApnaTable
        data={notices}
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
        emptyMessage="No notices found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["title"]}
      />

      {/* Add/Edit Notice Modal */}
      <ApnaModal
        isOpen={noticeModal.isOpen}
        onClose={handleNoticeModalClose}
        onSubmit={handleSaveNotice}
        title={noticeModal.mode === "add" ? "Add New Notice" : "Edit Notice"}
        size="lg"
        submitText={noticeModal.mode === "add" ? "Add Notice" : "Update Notice"}
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
              Title *
            </label>
            <input
              type="text"
              value={noticeModal.title}
              onChange={(e) =>
                setNoticeModal({ ...noticeModal, title: e.target.value })
              }
              placeholder="Enter notice title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
              Content <span className="text-red-500">*</span>
            </label>
            <ApnaEditor
              value={noticeModal.content}
              onChange={(value) =>
                setNoticeModal({ ...noticeModal, content: value })
              }
              placeholder="Enter notice content"
              className="min-h-[200px]"
              showToolbar={true}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors duration-300">
              Display Order
            </label>
            <input
              type="number"
              value={noticeModal.displayOrder}
              onChange={(e) =>
                setNoticeModal({
                  ...noticeModal,
                  displayOrder: e.target.value,
                })
              }
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
            />
            <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
              Lower numbers appear first
            </p>
          </div>
        </div>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteModal.noticeTitle}"? This action cannot be undone.`}
        confirmText="Delete Notice"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
