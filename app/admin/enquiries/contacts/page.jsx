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
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "converted", label: "Converted" },
  { value: "spam", label: "Spam" },
];

const STATUS_COLORS = {
  new: "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  interested: "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200",
  not_interested: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
  converted: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
  spam: "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200",
};

const SOURCE_COLORS = {
  contact: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  contact_page: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  home_page: "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  other: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
};

export default function ContactEnquiriesPage() {
  const { requireAdmin } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  const fetchEnquiries = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        formType: "contact,quick_enquiry",
        ...(status && { status }),
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/contacts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setEnquiries(
          data.data.map((item) => ({
            id: item._id,
            name: item.name,
            phone: item.phone,
            email: item.email,
            city: item.city || "N/A",
            source: item.source,
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
      console.error("Error fetching enquiries:", error);
      showError("Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(1, searchTerm, statusFilter);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page) => fetchEnquiries(page, searchTerm, statusFilter);

  const handleViewClick = (enquiry) => setViewModal({ isOpen: true, data: enquiry.rawData });

  const handleEditClick = (enquiry) => {
    setEditStatus(enquiry.rawData.status || "new");
    setEditNotes(enquiry.rawData.notes || "");
    setEditModal({ isOpen: true, data: enquiry.rawData });
  };

  const handleSaveEdit = async () => {
    if (!editModal.data) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/contacts/${editModal.data._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: editStatus, notes: editNotes }),
      });
      const data = await response.json();
      if (data.success) {
        showSuccess("Contact updated successfully");
        fetchEnquiries(currentPage, searchTerm, statusFilter);
        setEditModal({ isOpen: false, data: null });
      } else {
        showError(data.error || "Failed to update contact");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      showError("Failed to update contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (enquiry) => {
    if (!confirm(`Delete enquiry from "${enquiry.rawData.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/contacts/${enquiry.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        showSuccess("Enquiry deleted successfully");
        fetchEnquiries(currentPage, searchTerm, statusFilter);
      } else {
        showError(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      showError("Failed to delete enquiry");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm font-medium text-blue-600 dark:text-primary-200 hover:text-blue-800 dark:hover:text-primary cursor-pointer hover:underline transition-colors duration-300",
      render: (item) => <span onClick={() => handleViewClick(item)}>{item.name}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm text-gray-700 dark:text-white/80 transition-colors duration-300",
    },
    {
      key: "email",
      header: "Email",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      render: (item) => (
        <span className="truncate block max-w-[200px]" title={item.email}>
          {item.email || "—"}
        </span>
      ),
    },

    {
      key: "source",
      header: "Source",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${SOURCE_COLORS[item.source] || SOURCE_COLORS.other}`}>
          {item.source?.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${STATUS_COLORS[item.status] || STATUS_COLORS.new}`}>
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
            className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/40 rounded bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors duration-200"
          >
            View
          </button>
          <button
            onClick={() => handleEditClick(item)}
            className="px-2 py-1 text-xs text-green-600 dark:text-green-400 border border-green-300 dark:border-emerald-500/40 rounded bg-transparent hover:bg-green-50 dark:hover:bg-emerald-500/10 transition-colors duration-200"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="px-2 py-1 text-xs text-red-600 dark:text-red-400 border border-red-300 dark:border-rose-500/40 rounded bg-transparent hover:bg-red-50 dark:hover:bg-rose-500/10 transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const actions = [];

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Contact Enquiries
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage general contact form submissions ({totalItems} total)
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by name, phone, email..."
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
        data={enquiries}
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
        emptyMessage="No contact enquiries found"
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
        searchKeys={["name", "phone", "email"]}
      />

      {/* View Modal */}
      <ApnaModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, data: null })}
        title="Contact Details"
        size="lg"
        showFooter={false}
      >
        {viewModal.data && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Name", value: viewModal.data.name },
                { label: "Phone", value: viewModal.data.phone },
                { label: "Email", value: viewModal.data.email || "—" },
                { label: "Source", value: viewModal.data.source?.replace("_", " ") },
                { label: "Form Type", value: viewModal.data.formType?.replace("_", " ") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">{label}</label>
                  <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-white/60">Status</label>
              <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewModal.data.status] || STATUS_COLORS.new}`}>
                {viewModal.data.status?.replace("_", " ")}
              </span>
            </div>

            {viewModal.data.message && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">Message</label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-1 whitespace-pre-wrap">{viewModal.data.message}</p>
              </div>
            )}

            {viewModal.data.notes && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">Notes</label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-1 whitespace-pre-wrap">{viewModal.data.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
              <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">Submitted On</label>
              <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-0.5">
                {new Date(viewModal.data.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )}
      </ApnaModal>

      {/* Edit Modal */}
      <ApnaModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, data: null })}
        title={`Edit: ${editModal.data?.name}`}
        size="md"
        showFooter={false}
      >
        {editModal.data && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 transition-colors duration-300">
                Update Status
              </label>
              <ApnaSelect
                title=""
                options={STATUS_OPTIONS}
                value={editStatus}
                onChange={(value) => setEditStatus(value)}
                placeholder="Select status"
                searchable={false}
                required={false}
                buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-between text-left cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-1.5 transition-colors duration-300">
                Internal Notes
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add internal notes about this enquiry..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-white/40"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditModal({ isOpen: false, data: null })}
                className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm font-medium text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors duration-200"
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
