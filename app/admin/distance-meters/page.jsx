"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function DistanceMeterList() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [distanceMeters, setDistanceMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    distanceMeterId: null,
    distanceMeterName: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch distance meters data from API
  const fetchDistanceMeters = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
      });

      const response = await fetch(`/api/distance-meters?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const transformedDistanceMeters = data.data.map((distanceMeter) => ({
          id: distanceMeter.id,
          name: distanceMeter.name,
          shortDescription: distanceMeter.shortDescription || "",
          icon: distanceMeter.icon || "",
          status: distanceMeter.status,
          createdAt: distanceMeter.createdAt
            ? new Date(distanceMeter.createdAt).toLocaleDateString("en-IN")
            : "N/A",
          updatedAt: distanceMeter.updatedAt
            ? new Date(distanceMeter.updatedAt).toLocaleDateString("en-IN")
            : "N/A",
        }));
        setDistanceMeters(transformedDistanceMeters);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch distance meters:", data.error);
        setDistanceMeters([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching distance meters:", error);
      setDistanceMeters([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchDistanceMeters(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchDistanceMeters(page, debouncedSearchTerm);
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

  const handleEdit = (distanceMeter) => {
    router.push(`/admin/distance-meters/edit/${distanceMeter.id}`);
  };

  const handleDelete = async (id) => {
    const distanceMeter = distanceMeters.find((dm) => dm.id === id);
    if (distanceMeter) {
      setDeleteModal({
        isOpen: true,
        distanceMeterId: id,
        distanceMeterName: distanceMeter.name,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.distanceMeterId) return;

    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(
        `/api/distance-meters/${deleteModal.distanceMeterId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        showSuccess("Distance meter deleted successfully!");
        fetchDistanceMeters(currentPage, debouncedSearchTerm);
        setDeleteModal({
          isOpen: false,
          distanceMeterId: null,
          distanceMeterName: "",
        });
      } else {
        showError(data.error || "Failed to delete distance meter");
      }
    } catch (error) {
      console.error("Error deleting distance meter:", error);
      showError("Failed to delete distance meter. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      distanceMeterId: null,
      distanceMeterName: "",
    });
  };

  const columns = [
    {
      key: "name",
      header: "Distance Meter Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      width: "200px",
    },
    {
      key: "shortDescription",
      header: "Description",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      width: "auto",
    },
    {
      key: "icon",
      header: "Icon",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      width: "150px",
      render: (item) => (
        <div className="truncate max-w-xs" title={item.icon}>
          {item.icon || "N/A"}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "100px",
      render: (item) => (
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
            item.status === "active"
              ? "bg-green-100 text-primary dark:bg-emerald-500/20 dark:text-primary"
              : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
          }`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "150px",
      render: (item) => (
        <div className="flex gap-1 justify-center items-center">
          <Link
            href={`/admin/distance-meters/edit/${item.id}`}
            className="admin-action admin-action-edit"
          >
            Edit
          </Link>
          <button
            onClick={() => handleDelete(item.id)}
            className="admin-action admin-action-delete"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const LoadingSkeleton = () => (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-slate-800 animate-pulse sm:w-72"></div>
          <div className="h-10 w-36 shrink-0 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1.5fr_auto_1fr_1fr_1fr] gap-4 px-4 py-3 bg-gray-100 dark:bg-slate-900">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"
              />
            ))}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_auto_1fr_1fr_1fr] gap-4">
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-1">
          Distance Meter Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage and organize distance meter entries
        </p>
      </div>

      {/* Search & Add Button */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4 sm:flex sm:justify-between">
        <div className="min-w-0 w-full sm:flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search distance meters by name, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <Link
          href="/admin/distance-meters/add"
          className="w-auto shrink-0 whitespace-nowrap px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-600 transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          Add New Distance Meter
        </Link>
      </div>

      {/* Selected Items Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded transition-colors duration-300">
          <p className="text-sm text-blue-900 dark:text-blue-100 transition-colors duration-300">
            {selectedItems.length} distance meter(s) selected
          </p>
        </div>
      )}

      {/* Distance Meters Table */}
      <ApnaTable
        data={distanceMeters}
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
        emptyMessage="No distance meters found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "shortDescription"]}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Distance Meter"
        message={`Are you sure you want to delete "${deleteModal.distanceMeterName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
