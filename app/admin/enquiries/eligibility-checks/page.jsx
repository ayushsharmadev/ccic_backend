"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "pending_review", label: "Pending Review" },
  { value: "converted", label: "Converted" },
];

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200",
  pending_review: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
  eligible: "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  not_eligible: "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200",
  converted: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
};

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
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editEligible, setEditEligible] = useState(null);
  const [editRemarks, setEditRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  const fetchChecks = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        ...(status && { status }),
      });
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/eligibility-checks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setChecks(
          data.data.map((item) => ({
            id: item._id,
            name: item.name,
            mobile: item.mobile,
            email: item.email || "—",
            course: item.course?.name || "N/A",
            isEligible: item.isEligible,
            status: item.status,
            createdAt: item.createdAt,
            rawData: item,
          }))
        );
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

  const handlePageChange = (page) => fetchChecks(page, searchTerm, statusFilter);

  const handleViewClick = (item) => setViewModal({ isOpen: true, data: item.rawData });

  const handleEditClick = (item) => {
    setEditStatus(item.rawData.status || "new");
    setEditNotes(item.rawData.notes || "");
    setEditEligible(item.rawData.isEligible);
    setEditRemarks(item.rawData.eligibilityRemarks || "");
    setEditModal({ isOpen: true, data: item.rawData });
  };

  const handleSaveEdit = async () => {
    if (!editModal.data) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const body = { status: editStatus, notes: editNotes };
      if (editEligible !== null) {
        body.isEligible = editEligible;
        body.eligibilityRemarks = editRemarks;
      }
      
      const response = await fetch(`/api/eligibility-checks/${editModal.data._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) {
        showSuccess("Updated successfully");
        fetchChecks(currentPage, searchTerm, statusFilter);
        setEditModal({ isOpen: false, data: null });
      } else {
        showError(data.error || "Failed to update");
      }
    } catch (error) {
      showError("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this submission? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/eligibility-checks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        showSuccess("Deleted successfully");
        fetchChecks(currentPage, searchTerm, statusFilter);
      } else {
        showError(data.error || "Failed to delete");
      }
    } catch (error) {
      showError("Failed to delete");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm font-medium text-blue-600 dark:text-primary-200 hover:text-blue-800 cursor-pointer hover:underline transition-colors duration-300",
      render: (item) => <span onClick={() => handleViewClick(item)}>{item.name}</span>,
    },
    {
      key: "mobile",
      header: "Mobile",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm text-gray-700 dark:text-white/80 transition-colors duration-300",
    },
    {
      key: "email",
      header: "Email",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      render: (item) => (
        <span className="truncate block max-w-[150px]" title={item.email || "No email"}>
          {item.email || "—"}
        </span>
      ),
    },
    {
      key: "course",
      header: "Course",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
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
      render: (item) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize transition-colors duration-300 ${STATUS_COLORS[item.status] || STATUS_COLORS.new}`}>
          {item.status?.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center text-xs text-gray-600 dark:text-white/65 transition-colors duration-300",
      render: (item) => new Date(item.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleViewClick(item)}
            className="px-2 py-1 text-xs text-blue-600 dark:text-blue-200 border border-blue-300 dark:border-blue-500/40 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => handleEditClick(item)}
            className="px-2 py-1 text-xs text-green-600 dark:text-emerald-200 border border-green-300 dark:border-emerald-500/40 rounded hover:bg-green-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="px-2 py-1 text-xs text-red-600 dark:text-rose-200 border border-red-300 dark:border-rose-500/40 rounded hover:bg-red-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Study Abroad Enquiries
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage counselling form submissions ({totalItems} total)
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <ApnaSelect
          title=""
          options={[{ value: "", label: "All Status" }, ...STATUS_OPTIONS]}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          placeholder="Filter by status"
          searchable={false}
          required={false}
          buttonClassName="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-between text-left cursor-pointer"
        />
      </div>

      {/* Table */}
      <ApnaTable
        data={checks}
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
        emptyMessage="No enquiries found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onSelectAll={(pageIds, allSelected) => {
          if (allSelected) {
            setSelectedItems((prev) => prev.filter((id) => !pageIds.includes(id)));
          } else {
            setSelectedItems((prev) => [...new Set([...prev, ...pageIds])]);
          }
        }}
        onPageChange={handlePageChange}
      />

      {/* View Modal — all submitted details */}
      <ApnaModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, data: null })}
        title="Enquiry Details"
        size="lg"
        showFooter={false}
      >
        {viewModal.data && (
          <div className="p-4 space-y-4">
            {/* Core info */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: viewModal.data.name },
                { label: "Mobile", value: viewModal.data.mobile },
                { label: "Email", value: viewModal.data.email || "—" },
                { label: "Course Applied", value: viewModal.data.course?.name || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 dark:text-white/50">{label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Academic details */}
            {(viewModal.data.intermediateMarks || viewModal.data.tenthPassingYear) && (
              <div className="rounded-lg bg-gray-50 dark:bg-slate-800/60 p-3 border border-gray-200 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 mb-2">Academic Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {viewModal.data.intermediateMarks && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/50">12th Marks</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.data.intermediateMarks}%</p>
                    </div>
                  )}
                  {viewModal.data.tenthPassingYear && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-white/50">10th Passing Year</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{viewModal.data.tenthPassingYear}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">Status</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[viewModal.data.status] || STATUS_COLORS.new}`}>
                  {viewModal.data.status?.replace("_", " ")}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-white/50">Submitted On</p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                  {new Date(viewModal.data.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {viewModal.data.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-white/50">Notes</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">{viewModal.data.notes}</p>
              </div>
            )}
          </div>
        )}
      </ApnaModal>

      {/* Edit Modal — status + notes only */}
      <ApnaModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, data: null })}
        title={editModal.data ? `Edit: ${editModal.data.name}` : "Edit"}
        size="sm"
        showFooter={false}
      >
        {editModal.data && (
          <div className="p-4 space-y-4">
            {/* Quick snapshot */}
            <div className="rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-white/50">Mobile</span>
                <span className="font-medium dark:text-white">{editModal.data.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-white/50">Course</span>
                <span className="font-medium dark:text-white">{editModal.data.course?.name || "—"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5">
                Mark Eligibility
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditEligible(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-200 ${
                    editEligible === true
                      ? "bg-green-600 text-white border-green-600"
                      : "border-green-300 text-green-700 dark:border-emerald-500/40 dark:text-emerald-200 hover:bg-green-50 dark:hover:bg-emerald-500/10"
                  }`}
                >
                  ✓ Eligible
                </button>
                <button
                  onClick={() => setEditEligible(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-200 ${
                    editEligible === false
                      ? "bg-red-600 text-white border-red-600"
                      : "border-red-300 text-red-700 dark:border-rose-500/40 dark:text-rose-200 hover:bg-red-50 dark:hover:bg-rose-500/10"
                  }`}
                >
                  ✗ Not Eligible
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5">
                Status
              </label>
              <ApnaSelect
                title=""
                options={STATUS_OPTIONS}
                value={editStatus}
                onChange={setEditStatus}
                placeholder="Select status"
                searchable={false}
                required={false}
                buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors flex items-center justify-between text-left cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5">
                Remarks / Notes
              </label>
              <textarea
                rows={3}
                value={editRemarks || editNotes}
                onChange={(e) => {
                  setEditRemarks(e.target.value);
                  setEditNotes(e.target.value);
                }}
                placeholder="Add notes about this enquiry..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-white/40 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </ApnaModal>
    </div>
  );
}
