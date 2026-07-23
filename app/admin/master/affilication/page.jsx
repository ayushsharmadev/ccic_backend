"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function AffiliationNameList() {
  const [affiliationNames, setAffiliationNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // "add" or "edit"
  const [editingAffiliationName, setEditingAffiliationName] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    affiliationId: null,
    affiliationName: "",
  });
  const [aboutModal, setAboutModal] = useState({
    isOpen: false,
    affiliationName: "",
    description: "",
  });

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAffiliationName = () => {
    setModalType("add");
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const handleEditAffiliationName = async (affiliationName) => {
    setModalType("edit");
    setEditingAffiliationName(affiliationName);
    setFormLoading(true);

    try {
      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/master/affiliation/${affiliationName.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setFormData({
          name: data.data.name,
          description: data.data.description || "",
        });
      } else {
        showError("Failed to fetch affiliation name data: " + data.error);
        return;
      }
    } catch (error) {
      console.error("Error fetching affiliation name data:", error);
      showError("Error fetching affiliation name data");
      return;
    } finally {
      setFormLoading(false);
    }

    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    try {
      setFormLoading(true);

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      if (modalType === "add") {
        // Add new affiliation name
        const response = await fetch("/api/master/affiliation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const newAffiliationName = {
            id: data.data._id,
            name: data.data.name,
            description: data.data.description,
            status: data.data.status,
          };
          setAffiliationNames((prev) => [...prev, newAffiliationName]);
          showSuccess("Affiliation name added successfully!");
        } else {
          showError("Failed to add affiliation name: " + data.error);
          return;
        }
      } else {
        // Update existing affiliation name
        const response = await fetch(
          `/api/master/affiliation/${editingAffiliationName.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.name,
              description: formData.description,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setAffiliationNames((prev) =>
            prev.map((affiliationName) =>
              affiliationName.id === editingAffiliationName.id
                ? {
                    ...affiliationName,
                    name: formData.name,
                    description: formData.description,
                  }
                : affiliationName
            )
          );
          showSuccess("Affiliation name updated successfully!");
        } else {
          showError("Failed to update affiliation name: " + data.error);
          return;
        }
      }

      setShowModal(false);
      setFormData({ name: "" });
      setEditingAffiliationName(null);
    } catch (error) {
      console.error("Error saving affiliation name:", error);
      showError("Error saving affiliation name");
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ name: "", description: "" });
    setEditingAffiliationName(null);
    setFormLoading(false);
  };

  // About modal handlers
  const handleAboutClick = (affiliationName, description) => {
    setAboutModal({
      isOpen: true,
      affiliationName,
      description:
        description || "No description available for this affiliation.",
    });
  };

  const handleAboutClose = () => {
    setAboutModal({
      isOpen: false,
      affiliationName: "",
      description: "",
    });
  };

  // Delete handlers
  const handleDeleteClick = (affiliationName) => {
    setDeleteModal({
      isOpen: true,
      affiliationId: affiliationName.id,
      affiliationName: affiliationName.name,
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
        `/api/master/affiliation/${deleteModal.affiliationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setAffiliationNames((prev) =>
          prev.filter((an) => an.id !== deleteModal.affiliationId)
        );
        showSuccess("Affiliation name deleted successfully!");
      } else {
        showError("Failed to delete affiliation name: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting affiliation name:", error);
      showError("Error deleting affiliation name");
    } finally {
      setDeleteModal({
        isOpen: false,
        affiliationId: null,
        affiliationName: "",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, affiliationId: null, affiliationName: "" });
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

  const columns = [
    {
      key: "name",
      header: "Affiliation Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
    },
    {
      key: "description",
      header: "Description",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <button
          onClick={() => handleAboutClick(item.name, item.description)}
          className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
        >
          View Description
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEditAffiliationName(item)}
            className="admin-action admin-action-edit"
          >
            Edit
          </button>
          <button
            className="admin-action admin-action-delete"
            onClick={() => handleDeleteClick(item)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch affiliation names data from API
  const fetchAffiliationNames = async (page = 1, search = "") => {
    try {
      setLoading(true);

      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8", // itemsPerPage
        search: search,
        status: "active", // Only show active affiliations
      });

      const response = await fetch(`/api/master/affiliation?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedAffiliationNames = data.data.map((affiliation) => ({
          id: affiliation._id,
          name: affiliation.name,
          description: affiliation.description,
          status: affiliation.status,
        }));
        setAffiliationNames(transformedAffiliationNames);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch affiliation names:", data.error);
        setAffiliationNames([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching affiliation names:", error);
      setAffiliationNames([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchAffiliationNames(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchAffiliationNames(page, debouncedSearchTerm);
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
          <div className="grid grid-cols-[2fr_100px] gap-4">
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
            <div className="grid grid-cols-[2fr_100px] gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
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
          Affiliation Name Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage affiliation names for CCIC education institutions
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
            placeholder="Search affiliation names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
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
        <button
          onClick={handleAddAffiliationName}
          className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
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
          Add Affiliation
        </button>
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

      {/* Affiliation Names Table */}
      <ApnaTable
        data={affiliationNames}
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
        emptyMessage="No affiliation names found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name"]}
      />

      {/* Add/Edit Affiliation Name Modal */}
      <ApnaModal
        isOpen={showModal}
        onClose={handleModalClose}
        title={
          modalType === "add"
            ? "Add New Affiliation Name"
            : "Edit Affiliation Name"
        }
        onSubmit={handleModalSubmit}
        submitText={
          modalType === "add" ? "Add Affiliation" : "Update Affiliation"
        }
        cancelText="Cancel"
        size="md"
        submitDisabled={formLoading}
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Affiliation Name *
            </label>
            {formLoading ? (
              // Form loading skeleton
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter affiliation name (e.g., Ayush, Medical Council)"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Description
            </label>
            {formLoading ? (
              // Form loading skeleton
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-20 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter affiliation description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
              />
            )}
          </div>
        </form>
      </ApnaModal>

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Affiliation Name"
        message={`Are you sure you want to delete "${deleteModal.affiliationName}"? This action cannot be undone.`}
        confirmText="Delete Affiliation"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
        size="md"
      />

      {/* Description Modal */}
      <ApnaModal
        isOpen={aboutModal.isOpen}
        onClose={handleAboutClose}
        title={`${aboutModal.affiliationName} - Description`}
        size="md"
        showFooter={false}
      >
        <div className="p-4">
          <p className="text-gray-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
            {aboutModal.description}
          </p>
        </div>
      </ApnaModal>
    </div>
  );
}
