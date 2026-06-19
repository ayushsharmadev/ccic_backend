"use client";

import { useState, useEffect } from "react";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import ImageUpload from "@/components/utils/ImageUpload";

export default function HostelFacilityList() {
  const [facilities, setFacilities] = useState([]);
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
  const [editingFacility, setEditingFacility] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    facilityId: null,
    facilityName: "",
  });
  const [aboutModal, setAboutModal] = useState({
    isOpen: false,
    facilityName: "",
    description: "",
  });

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    description: "",
  });

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUploadSuccess = (fileData) => {
    console.log("📸 Image upload success, fileData:", fileData);

    // Extract fileUrl from the fileData object
    const fileUrl = fileData?.fileUrl || fileData;

    console.log("📸 Setting image URL:", fileUrl);

    setFormData((prev) => ({
      ...prev,
      image: fileUrl,
    }));
  };

  const handleImageUploadError = (error) => {
    showError(`Image upload failed: ${error}`);
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
  };

  const handleAddFacility = () => {
    setModalType("add");
    setFormData({ name: "", image: "", description: "" });
    setShowModal(true);
  };

  const handleEditFacility = async (facility) => {
    setModalType("edit");
    setEditingFacility(facility);
    setFormLoading(true);

    try {
      // Get access token
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Please login again to continue");
        return;
      }

      const response = await fetch(
        `/api/master/hostel-facility/${facility.id}`,
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
          image: data.data.image || "",
          description: data.data.description || "",
        });
      } else {
        showError("Failed to fetch facility data: " + data.error);
        return;
      }
    } catch (error) {
      console.error("Error fetching facility data:", error);
      showError("Error fetching facility data");
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
        // Add new facility
        const response = await fetch("/api/master/hostel-facility", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            image: formData.image,
            description: formData.description,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const newFacility = {
            id: data.data._id,
            name: data.data.name,
            description: data.data.description,
            image: data.data.image,
            status: data.data.status,
          };
          setFacilities((prev) => [...prev, newFacility]);
          showSuccess("Hostel facility added successfully!");
        } else {
          showError("Failed to add facility: " + data.error);
          return;
        }
      } else {
        // Update existing facility
        const response = await fetch(
          `/api/master/hostel-facility/${editingFacility.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.name,
              image: formData.image,
              description: formData.description,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setFacilities((prev) =>
            prev.map((facility) =>
              facility.id === editingFacility.id
                ? {
                    ...facility,
                    name: formData.name,
                    image: formData.image,
                    description: formData.description,
                  }
                : facility
            )
          );
          showSuccess("Hostel facility updated successfully!");
        } else {
          showError("Failed to update facility: " + data.error);
          return;
        }
      }

      setShowModal(false);
      setFormData({ name: "", image: "" });
      setEditingFacility(null);
    } catch (error) {
      console.error("Error saving facility:", error);
      showError("Error saving facility");
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setFormData({ name: "", image: "", description: "" });
    setEditingFacility(null);
    setFormLoading(false);
  };

  // About modal handlers
  const handleAboutClick = (facilityName, description) => {
    setAboutModal({
      isOpen: true,
      facilityName,
      description: description || "No description available for this facility.",
    });
  };

  const handleAboutClose = () => {
    setAboutModal({
      isOpen: false,
      facilityName: "",
      description: "",
    });
  };

  // Delete handlers
  const handleDeleteClick = (facility) => {
    setDeleteModal({
      isOpen: true,
      facilityId: facility.id,
      facilityName: facility.name,
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
        `/api/master/hostel-facility/${deleteModal.facilityId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setFacilities((prev) =>
          prev.filter((f) => f.id !== deleteModal.facilityId)
        );
        showSuccess("Facility deleted successfully!");
      } else {
        showError("Failed to delete facility: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting facility:", error);
      showError("Error deleting facility");
    } finally {
      setDeleteModal({
        isOpen: false,
        facilityId: null,
        facilityName: "",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      facilityId: null,
      facilityName: "",
    });
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
      header: "Facility Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      width: "minmax(250px, 2fr)", // Flexible width for facility names
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
      key: "image",
      header: "Facility Image",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "minmax(150px, 1fr)", // Width for image display
      render: (item) => (
        <div className="flex justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400 dark:text-white/50"
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
      key: "actions",
      header: "Actions",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "140px", // Fixed width for actions
      render: (item) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleEditFacility(item)}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent cursor-pointer hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteClick(item)}
            className="px-2 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary/20 transition-colors"
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

  // Fetch facilities data from API
  const fetchFacilities = async (page = 1, search = "") => {
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
        status: "active", // Only show active facilities
      });

      const response = await fetch(`/api/master/hostel-facility?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedFacilities = data.data.map((facility) => ({
          id: facility._id,
          name: facility.name,
          description: facility.description,
          image: facility.image || null,
          status: facility.status,
        }));
        setFacilities(transformedFacilities);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch facilities:", data.error);
        setFacilities([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching facilities:", error);
      setFacilities([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
    fetchFacilities(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchFacilities(page, debouncedSearchTerm);
  };

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-72 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-28 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors duration-300">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[2fr_1fr_140px] gap-4">
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
            <div className="grid grid-cols-[2fr_1fr_140px] gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-16 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Hostel Facilities Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage hostel facilities and their images for CCIC
          institutions
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
            placeholder="Search facilities..."
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
          onClick={handleAddFacility}
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
          Add Facility
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

      {/* Facilities Table */}
      <ApnaTable
        data={facilities}
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
        emptyMessage="No facilities found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name"]}
      />

      {/* Add/Edit Facility Modal */}
      <ApnaModal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalType === "add" ? "Add New Facility" : "Edit Facility"}
        onSubmit={handleModalSubmit}
        submitText={modalType === "add" ? "Add Facility" : "Update Facility"}
        cancelText="Cancel"
        size="lg"
        submitDisabled={formLoading}
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Facility Name *
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
                placeholder="Enter facility name (e.g., Common Room, Mess, Laundry, Study Hall)"
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
                placeholder="Enter facility description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
              />
            )}
          </div>

          <div>
            {formLoading ? (
              // Form loading skeleton
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            ) : (
              <ImageUpload
                uploadType="hostel-facilities"
                identifier="facility-image"
                onUploadSuccess={handleImageUploadSuccess}
                onUploadError={handleImageUploadError}
                showUploadProgress={true}
                title="Facility Image"
                preview={formData.image}
                onRemove={handleImageRemove}
                accept="image/*"
                maxSize="2MB"
                width="120px"
                height="120px"
                className="w-full"
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
        title="Delete Facility"
        message={`Are you sure you want to delete "${deleteModal.facilityName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-secondary-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600 dark:bg-slate-700 dark:hover:bg-slate-600"
        icon="danger"
      />

      {/* Description Modal */}
      <ApnaModal
        isOpen={aboutModal.isOpen}
        onClose={handleAboutClose}
        title={`${aboutModal.facilityName} - Description`}
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
