"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function CountrySectionsPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getAccessToken } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryName, setCountryName] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionTitle: "",
  });

  // Fetch country name
  useEffect(() => {
    const fetchCountryName = async () => {
      try {
        const response = await fetch(
          `/api/countries/${resolvedParams.countryId}`
        );
        const data = await response.json();
        if (data.success) {
          setCountryName(data.data.name);
        }
      } catch (error) {
        console.error("Error fetching country name:", error);
      }
    };
    fetchCountryName();
  }, [resolvedParams.countryId]);

  // Fetch sections
  const fetchSections = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(
        `/api/country-sections?countryId=${resolvedParams.countryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSections(data.data);
      } else {
        showError(data.error || "Failed to fetch sections");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      showError("Error fetching sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [resolvedParams.countryId]);

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
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(
        `/api/country-sections/${deleteModal.sectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Section deleted successfully!");
        fetchSections();
      } else {
        showError(data.error || "Failed to delete section");
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      showError("Error deleting section");
    } finally {
      setDeleteModal({ isOpen: false, sectionId: null, sectionTitle: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, sectionId: null, sectionTitle: "" });
  };

  const handleEdit = (section) => {
    router.push(
      `/admin/country/sections/${resolvedParams.countryId}/edit/${section._id}`
    );
  };

  // Table columns
  const columns = [
    {
      key: "tabName",
      header: "Tab Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      width: "25%",
      render: (item) =>
        item.tabName || (
          <span className="text-gray-400 dark:text-white/40">-</span>
        ),
    },
    {
      key: "title",
      header: "Section Title",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-900 dark:text-white/90 transition-colors",
      width: "30%",
    },
    {
      key: "content",
      header: "Content Preview",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
      width: "35%",
      render: (item) => {
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
      width: "10%",
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "10%",
      render: (item) => (
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={() => handleEdit(item)}
            className="admin-action admin-action-edit"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(item._id, item.title)}
            className="admin-action admin-action-delete"
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
  const headerTitleClass = "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const primaryButtonClass =
    "px-4 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-700 rounded shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30 no-underline";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/country"
            className={headerLinkClass}
          >
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
            Back to Countrys
          </Link>
        </div>
        <h1 className={headerTitleClass}>
          Sections - {countryName}
        </h1>
        <p className={headerSubtitleClass}>
          Manage dynamic sections for this country
        </p>
      </div>

      {/* Add Section Button */}
      <div className="flex justify-end mb-4">
        <Link
          href={`/admin/country/sections/${resolvedParams.countryId}/add`}
          className={primaryButtonClass}
        >
          + Add Section
        </Link>
      </div>

      {/* Sections Table */}
      <ApnaTable
        data={sections}
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
        emptyMessage="No sections found. Click 'Add Section' to create one."
        showSerialNumbers={true}
        showCheckboxes={false}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteModal.sectionTitle}"? This action cannot be undone.`}
        confirmText="Delete Section"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
