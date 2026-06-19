"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function CollegeNoticesPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getAccessToken } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collegeName, setCollegeName] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    noticeId: null,
    noticeTitle: "",
  });

  // Fetch college name
  useEffect(() => {
    const fetchCollegeName = async () => {
      try {
        const response = await fetch(
          `/api/colleges/${resolvedParams.collegeId}`
        );
        const data = await response.json();
        if (data.success) {
          setCollegeName(data.data.name);
        }
      } catch (error) {
        console.error("Error fetching college name:", error);
      }
    };
    fetchCollegeName();
  }, [resolvedParams.collegeId]);

  // Fetch notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(
        `/api/notices?collegeId=${resolvedParams.collegeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotices(data.data);
      } else {
        showError(data.error || "Failed to fetch notices");
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      showError("Error fetching notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [resolvedParams.collegeId]);

  const handleEdit = (notice) => {
    router.push(
      `/admin/college/notices/${resolvedParams.collegeId}/edit/${notice._id}`
    );
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
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/notices/${deleteModal.noticeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Notice deleted successfully!");
        fetchNotices();
      } else {
        showError(data.error || "Failed to delete notice");
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      showError("Error deleting notice");
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
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      width: "35%",
    },
    {
      key: "content",
      header: "Content Preview",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
      width: "50%",
      render: (item) => {
        if (!item.content)
          return <span className="text-gray-400 dark:text-white/40">--</span>;
        const strippedContent = item.content.replace(/<[^>]*>/g, "");
        return (
          <span className="line-clamp-2 text-gray-700 dark:text-white/80 transition-colors">
            {strippedContent.substring(0, 100)}
            {strippedContent.length > 100 ? "..." : ""}
          </span>
        );
      },
    },
    {
      key: "displayOrder",
      header: "Order",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "7%",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "8%",
      render: (item) => (
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={() => handleEdit(item)}
            className="px-3 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-blue-50 dark:hover:bg-primary/20 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(item._id, item.title)}
            className="px-3 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary/20 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const pageWrapperClass =
    "h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300";
  const headerLinkClass =
    "text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors";
  const headerIconClass = "w-3.5 h-3.5 text-gray-500 dark:text-white/60";
  const headerTitleClass =
    "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const primaryButtonClass =
    "px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-700 rounded shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 no-underline";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href="/admin/college" className={headerLinkClass}>
            <svg
              className={headerIconClass}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Colleges
          </Link>
        </div>
        <h1 className={headerTitleClass}>College Notices - {collegeName}</h1>
        <p className={headerSubtitleClass}>Manage college-specific notices</p>
      </div>

      {/* Add Notice Button */}
      <div className="flex justify-end mb-4">
        <Link
          href={`/admin/college/notices/${resolvedParams.collegeId}/add`}
          className={primaryButtonClass}
        >
          + Add Notice
        </Link>
      </div>

      {/* Notices Table */}
      <ApnaTable
        data={notices}
        columns={columns}
        loading={loading}
        showSearch={false}
        showPagination={false}
        striped={true}
        hover={true}
        bordered={false}
        compact={true}
        showHeader={true}
        stickyHeader={false}
        emptyMessage="No notices found. Click 'Add Notice' to create one."
        showSerialNumbers={true}
        showCheckboxes={false}
      />

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
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
