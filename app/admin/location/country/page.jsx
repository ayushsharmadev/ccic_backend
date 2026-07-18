"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function CountriesPage() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    countryId: null,
    countryName: "",
  });

  const columns = [
    {
      key: "name",
      header: "Country Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
    },
    {
      key: "code",
      header: "Country Code",
      headerClassName: "text-left",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors",
    },
    {
      key: "logo",
      header: "Logo",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => {
        const logoErrorKey = `logo-${item.id}`;
        const hasLogoError = imageErrors[logoErrorKey];

        if (!item.logo || hasLogoError) {
          return (
            <div className="w-8 h-8 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
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
          );
        }

        return (
          <img
            src={item.logo}
            alt={`${item.name} Logo`}
            className="w-8 h-8 rounded border border-gray-200 dark:border-slate-700 object-cover mx-auto"
            onError={() => {
              setImageErrors((prev) => ({
                ...prev,
                [logoErrorKey]: true,
              }));
            }}
          />
        );
      },
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
            href={`/admin/location/country/edit/${item.id}`}
            className="w-auto shrink-0 whitespace-nowrap px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent no-underline hover:bg-primary-50 dark:hover:bg-primary/20 transition-colors"
          >
            Edit
          </Link>
          <button
            className="w-auto shrink-0 whitespace-nowrap px-2 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary/20 transition-colors"
            onClick={() => handleDeleteClick(item.id, item.name)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchCountries = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "8",
        search: search,
      });
      if (status) params.set("status", status);

      const response = await fetch(`/api/locations/country-master?${params}`);
      const data = await response.json();

      if (data.success) {
        const transformedCountries = data.data.map((country) => ({
          id: country._id,
          name: country.name,
          code: country.code,
          logo: country.logo || null,
          status: country.status,
        }));

        setCountries(transformedCountries);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch countries:", data.error);
        setCountries([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchCountries(1, debouncedSearchTerm, statusFilter);
  }, [debouncedSearchTerm, statusFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCountries(page, debouncedSearchTerm, statusFilter);
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

  const handleDeleteClick = (countryId, countryName) => {
    setDeleteModal({
      isOpen: true,
      countryId,
      countryName,
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
        `/api/locations/country-master/${deleteModal.countryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        showSuccess("Country deleted successfully!");
        setCountries((prev) =>
          prev.filter((country) => country.id !== deleteModal.countryId)
        );
        setSelectedItems((prev) =>
          prev.filter((id) => id !== deleteModal.countryId)
        );
      } else {
        showError(result.error || "Failed to delete country");
      }
    } catch (error) {
      console.error("Error deleting country:", error);
      showError("Network error. Please try again.");
    } finally {
      setDeleteModal({ isOpen: false, countryId: null, countryName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, countryId: null, countryName: "" });
  };

  const LoadingSkeleton = () => (
    <div className="min-h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-44 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-70 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-[3fr_1fr] gap-3 mb-4 lg:flex lg:items-end lg:justify-between">
        <div className="contents lg:flex lg:items-end lg:gap-3">
          <div className="h-8 w-full rounded bg-gray-200 animate-pulse dark:bg-slate-800 lg:w-60"></div>
          <div className="h-8 w-full rounded bg-gray-200 animate-pulse dark:bg-slate-800 lg:w-32"></div>
        </div>
        <div className="col-start-2 h-8 w-25 justify-self-end rounded bg-gray-200 animate-pulse dark:bg-slate-800 lg:col-auto lg:justify-self-auto"></div>
      </div>

      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors duration-300">
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`p-3 ${
              i < 7 ? "border-b border-gray-200 dark:border-slate-800" : ""
            }`}
          >
            <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Countries Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage country information for VidyaVidhi colleges
        </p>
      </div>

      <div className="grid grid-cols-[3fr_1fr] gap-3 mb-4 lg:flex lg:items-center lg:justify-between">
        <div className="contents lg:flex lg:shrink-0 lg:items-center lg:gap-3">
          <div className="relative min-w-0 w-full lg:w-60 lg:min-w-60 lg:shrink-0">
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
            placeholder="Search countries..."
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
          <ApnaSelect
            title=""
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All"
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="w-full lg:w-32 lg:min-w-32 lg:shrink-0"
            buttonClassName="w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer"
          />
        </div>
        <Link
          href="/admin/location/country/add"
          className="col-start-2 flex w-auto shrink-0 justify-self-end items-center gap-1 whitespace-nowrap bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors no-underline lg:col-auto lg:justify-self-auto"
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
          Add Country
        </Link>
      </div>

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

      <ApnaTable
        data={countries}
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
        emptyMessage="No countries found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "code"]}
      />

      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Country"
        message={`Are you sure you want to delete the country "${deleteModal.countryName}"? This action cannot be undone.`}
        confirmText="Delete Country"
        cancelText="Cancel"
        confirmButtonColor="bg-secondary hover:bg-red-700"
        cancelButtonColor="bg-gray-500 hover:bg-gray-600"
        icon="danger"
        size="md"
        showCloseButton={true}
        closeOnOverlayClick={true}
        loading={false}
      />
    </div>
  );
}
