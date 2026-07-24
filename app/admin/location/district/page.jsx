"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LocationFilterBar from "@/components/utils/LocationFilterBar";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function DistrictsPage() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    districtId: null,
    districtName: "",
  });

  // Define table columns
  const columns = [
    {
      key: "name",
      header: "District Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
    },
    {
      key: "countryName",
      header: "Country",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
    },
    {
      key: "stateName",
      header: "State",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
            item.status === "active"
              ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
              : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-white/60"
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
        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
          <Link
            href={`/admin/location/district/edit/${item.id}`}
            className="admin-action admin-action-edit"
          >
            Edit
          </Link>
          <button
            className="admin-action admin-action-delete"
            onClick={() => handleDeleteClick(item.id, item.name)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // Fetch districts data from API
  const fetchDistricts = async (
    page = 1,
    search = "",
    country = "",
    state = "",
    status = ""
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8", // itemsPerPage
        search: search,
      });

      if (status) params.set("status", status);

      if (state) {
        params.set("state", state);
      } else if (country) {
        params.set("country", country);
      }

      const response = await fetch(`/api/locations/districts?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedDistricts = data.data.map((district) => ({
          id: district._id,
          name: district.name,
          stateCode: district.state?._id,
          stateName: district.state?.name || "Unknown State",
          countryName: district.state?.country?.name || "—",
          status: district.status,
        }));
        setDistricts(transformedDistricts);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch districts:", data.error);
        setDistricts([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      setDistricts([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search or filters change
    fetchDistricts(
      1,
      debouncedSearchTerm,
      selectedCountry,
      selectedState,
      statusFilter
    );
  }, [debouncedSearchTerm, selectedCountry, selectedState, statusFilter]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchDistricts(
      page,
      debouncedSearchTerm,
      selectedCountry,
      selectedState,
      statusFilter
    );
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

  // Delete handlers
  const handleDeleteClick = (districtId, districtName) => {
    setDeleteModal({
      isOpen: true,
      districtId,
      districtName,
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
        `/api/locations/districts/${deleteModal.districtId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("District deleted successfully!");
        // Refresh the districts list
        setDistricts((prev) =>
          prev.filter((district) => district.id !== deleteModal.districtId)
        );
      } else {
        showError(result.error || "Failed to delete district");
      }
    } catch (error) {
      console.error("Error deleting district:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({ isOpen: false, districtId: null, districtName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, districtId: null, districtName: "" });
  };

  const LoadingSkeleton = () => (
    <div className="min-h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-80 animate-pulse"></div>
      </div>

      {/* Controls skeleton */}
      <div className="grid grid-cols-4 gap-3 mb-4 lg:flex lg:items-end lg:justify-between">
        <div className="contents lg:flex lg:items-end lg:gap-3">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-48 animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-30 animate-pulse"></div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors duration-300">
        {/* Table header skeleton */}
        <div className="grid grid-cols-[1fr_1fr_120px] gap-3 p-3 bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-800">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Table rows skeleton */}
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className={`grid grid-cols-[1fr_1fr_120px] gap-3 p-3 ${
              index < 7 ? "border-b border-gray-200 dark:border-slate-800" : ""
            }`}
          >
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="flex gap-1">
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-10 animate-pulse"></div>
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-12 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Removed early return for LoadingSkeleton so that the filter bar doesn't unmount and reset its internal state on every table fetch.
  return (
    <div className="min-h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Districts Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage district information for VidyaVidhi colleges
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-4 gap-3 mb-4 lg:flex lg:items-end lg:justify-between">
        <div className="contents lg:flex lg:items-end lg:gap-3">
          <div className="relative col-span-3 col-start-1 row-start-1 min-w-0 w-full self-end lg:col-auto lg:row-auto lg:w-60 lg:self-auto">
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
              placeholder="Search districts..."
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
          <LocationFilterBar
            country={selectedCountry}
            state={selectedState}
            onCountryChange={setSelectedCountry}
            onStateChange={setSelectedState}
            showDistrict={false}
            className="contents lg:flex lg:items-end lg:gap-3"
            itemClassName="col-span-2 min-w-0 w-full lg:col-auto lg:min-w-48"
          />
          <ApnaSelect
            title="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All"
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="col-start-4 row-start-1 w-full lg:col-auto lg:row-auto lg:w-32"
            buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
          />
        </div>

        <Link
          href="/admin/location/district/add"
          className="col-start-4 row-start-3 flex w-auto shrink-0 justify-self-end self-end items-center gap-1 whitespace-nowrap bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors no-underline lg:col-auto lg:row-auto lg:justify-self-auto lg:self-auto"
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
          Add District
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

      {/* Districts Table */}
      <ApnaTable
        data={districts}
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
        emptyMessage={
          selectedState
            ? "No districts found for selected state"
            : selectedCountry
              ? "No districts found for selected country"
              : "No districts found"
        }
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "stateName", "countryName"]}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete District"
        message={`Are you sure you want to delete the district "${deleteModal.districtName}"? This action cannot be undone.`}
        confirmText="Delete District"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-red-700"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
