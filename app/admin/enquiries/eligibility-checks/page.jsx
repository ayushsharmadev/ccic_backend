"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function EligibilityChecksPage() {
  const { requireAdmin } = useAuth();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  const fetchChecks = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        ...(status && { status }),
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/eligibility-checks?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const transformedData = data.data.map((item) => ({
          id: item._id,
          name: item.name,
          mobile: item.mobile,
          course: item.course?.name || "N/A",
          neetScore: item.neetScore,
          category: item.category,
          tenthPassingYear: item.tenthPassingYear,
          intermediateMarks: item.intermediateMarks,
          status: item.status,
          isEligible: item.isEligible,
          createdAt: item.createdAt,
          rawData: item,
        }));

        setChecks(transformedData);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching eligibility checks:", error);
      showError("Failed to fetch eligibility checks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks(1, searchTerm, statusFilter);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page) => {
    fetchChecks(page, searchTerm, statusFilter);
  };

  const handleViewClick = (check) => {
    setViewModal({ isOpen: true, data: check.rawData });
  };

  const handleEditClick = (check) => {
    setEditModal({ isOpen: true, data: check.rawData });
  };

  const handleStatusUpdate = async (checkId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/eligibility-checks/${checkId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Status updated successfully");
        fetchChecks(currentPage, searchTerm, statusFilter);
        setEditModal({ isOpen: false, data: null });
      } else {
        showError(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Failed to update status");
    }
  };

  const handleEligibilityUpdate = async (checkId, isEligible, remarks) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/eligibility-checks/${checkId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEligible,
          eligibilityRemarks: remarks,
          status: isEligible ? "eligible" : "not_eligible",
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Eligibility updated successfully");
        fetchChecks(currentPage, searchTerm, statusFilter);
        setEditModal({ isOpen: false, data: null });
      } else {
        showError(data.error || "Failed to update eligibility");
      }
    } catch (error) {
      console.error("Error updating eligibility:", error);
      showError("Failed to update eligibility");
    }
  };

  const handleDelete = async (checkId) => {
    if (!confirm("Are you sure you want to delete this eligibility check?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/eligibility-checks/${checkId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Eligibility check deleted successfully");
        fetchChecks(currentPage, searchTerm, statusFilter);
      } else {
        showError(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting eligibility check:", error);
      showError("Failed to delete eligibility check");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-blue-600 dark:text-primary-200 hover:text-blue-800 dark:hover:text-primary cursor-pointer hover:underline transition-colors duration-300",
      render: (item) => (
        <span onClick={() => handleViewClick(item)}>{item.name}</span>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-700 dark:text-white/80 transition-colors duration-300",
    },
    {
      key: "course",
      header: "Course",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
    },
    {
      key: "neetScore",
      header: "NEET Score",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm font-medium text-primary dark:text-primary-200 transition-colors duration-300",
      render: (item) => <span>{item.neetScore}/720</span>,
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => {
        const categoryColors = {
          "UR/EWS":
            "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
          SC: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
          ST: "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200",
          OBC: "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200",
          "UR/EWS - PwBD":
            "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
          "OBC PwD":
            "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
          "SC PwD":
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
          "ST PwD":
            "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
        };
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
              categoryColors[item.category] || categoryColors["UR/EWS"]
            }`}
          >
            {item.category}
          </span>
        );
      },
    },
    {
      key: "isEligible",
      header: "Eligibility",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => {
        if (item.isEligible === null) {
          return (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200 transition-colors duration-300">
              Pending Review
            </span>
          );
        }
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
              item.isEligible
                ? "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200"
            }`}
          >
            {item.isEligible ? "Eligible" : "Not Eligible"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => {
        const statusColors = {
          new: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
          contacted:
            "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200",
          eligible:
            "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200",
          not_eligible:
            "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200",
          pending_review:
            "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
          converted:
            "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
        };
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
              statusColors[item.status] || statusColors.new
            }`}
          >
            {item.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-xs text-gray-600 dark:text-white/65 transition-colors duration-300",
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  const actions = [
    {
      label: "View",
      onClick: handleViewClick,
      className:
        "text-blue-600 dark:text-blue-200 hover:text-blue-800 dark:hover:text-blue-100 transition-colors duration-200",
    },
    {
      label: "Edit",
      onClick: handleEditClick,
      className:
        "text-green-600 dark:text-emerald-200 hover:text-green-800 dark:hover:text-emerald-100 transition-colors duration-200",
    },
    {
      label: "Delete",
      onClick: (item) => handleDelete(item.id),
      className:
        "text-red-600 dark:text-rose-200 hover:text-red-800 dark:hover:text-rose-100 transition-colors duration-200",
    },
  ];

  if (loading && checks.length === 0) {
    return (
      <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-72 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-10 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-10 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 dark:bg-slate-900">
              <div className="col-span-3 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-1 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-800">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
                >
                  <div className="md:col-span-3">
                    <div className="h-4 w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-4 w-20 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="md:col-span-1">
                    <div className="h-4 w-16 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="md:col-span-2 md:col-start-11">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
          Eligibility Checks
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/70 mt-1 transition-colors duration-300">
          Manage eligibility check submissions ({totalItems} total)
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <div>
          <ApnaSelect
            title=""
            options={[
              { value: "", label: "All Status" },
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "eligible", label: "Eligible" },
              { value: "not_eligible", label: "Not Eligible" },
              { value: "pending_review", label: "Pending Review" },
              { value: "converted", label: "Converted" },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder="Select status"
            searchable={false}
            required={false}
            buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-between text-left cursor-pointer"
          />
        </div>
      </div>

      <ApnaTable
        data={checks}
        columns={columns}
        actions={actions}
        loading={loading}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        emptyMessage="No eligibility checks found"
      />

      {/* View Modal */}
      {viewModal.isOpen && viewModal.data && (
        <ApnaModal
          isOpen={viewModal.isOpen}
          onClose={() => setViewModal({ isOpen: false, data: null })}
          title="Eligibility Check Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Name
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.name}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Mobile
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.mobile}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Course
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.course?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  NEET Score
                </label>
                <p className="text-sm font-bold text-primary dark:text-primary-200 transition-colors duration-300">
                  {viewModal.data.neetScore}/720
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Category
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.category}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  10th Passing Year
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.tenthPassingYear || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Intermediate (+2) Marks
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.intermediateMarks
                    ? `${viewModal.data.intermediateMarks}%`
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Status
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                  {viewModal.data.status?.replace("_", " ")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Eligibility
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.isEligible === null
                    ? "Not Reviewed"
                    : viewModal.data.isEligible
                    ? "Eligible"
                    : "Not Eligible"}
                </p>
              </div>
            </div>
            {viewModal.data.eligibilityRemarks && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Eligibility Remarks
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-1">
                  {viewModal.data.eligibilityRemarks}
                </p>
              </div>
            )}
            {viewModal.data.notes && (
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                  Notes
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-1">
                  {viewModal.data.notes}
                </p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-white/60 transition-colors duration-300">
                Submitted At
              </label>
              <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                {new Date(viewModal.data.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </ApnaModal>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && editModal.data && (
        <ApnaModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, data: null })}
          title="Update Eligibility Check"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2 transition-colors duration-300">
                Update Status
              </label>
              <ApnaSelect
                title=""
                options={[
                  { value: "new", label: "New" },
                  { value: "contacted", label: "Contacted" },
                  { value: "eligible", label: "Eligible" },
                  { value: "not_eligible", label: "Not Eligible" },
                  { value: "pending_review", label: "Pending Review" },
                  { value: "converted", label: "Converted" },
                ]}
                value={editModal.data.status}
                onChange={(value) =>
                  handleStatusUpdate(editModal.data._id, value)
                }
                placeholder="Select status"
                searchable={false}
                required={false}
                buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-between text-left cursor-pointer"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-slate-800 pt-4 transition-colors duration-300">
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2 transition-colors duration-300">
                Mark Eligibility
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const remarks = prompt(
                      "Enter eligibility remarks (optional):"
                    );
                    handleEligibilityUpdate(
                      editModal.data._id,
                      true,
                      remarks || ""
                    );
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors duration-200"
                >
                  Mark as Eligible
                </button>
                <button
                  onClick={() => {
                    const remarks = prompt("Enter reason for not eligible:");
                    if (remarks !== null) {
                      handleEligibilityUpdate(
                        editModal.data._id,
                        false,
                        remarks
                      );
                    }
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 dark:bg-rose-600 dark:hover:bg-rose-500 transition-colors duration-200"
                >
                  Mark as Not Eligible
                </button>
              </div>
            </div>
          </div>
        </ApnaModal>
      )}
    </div>
  );
}
