"use client";

import { useState, useEffect, useRef } from "react";
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
  home_page: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  college_page: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  sidebar: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
  modal: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
  other: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
};

function getPreferredCollegeName(item) {
  const college = item.preferredColleges?.[0];
  if (item.meta?.collegeName) return item.meta.collegeName;
  if (college?.name) return college.name;
  if (typeof college === "string") return college;
  if (college?._id) return String(college._id);
  return "General counselling";
}

export default function StudentEnquiriesPage() {
  const { requireAdmin } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });
  const [editModal, setEditModal] = useState({ isOpen: false, data: null });
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchEnquiries = async (page = 1, search = "", status = "") => {
    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;

    try {
      if (enquiries.length === 0) {
        setLoading(true);
      }
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        formType: "mbbs_admission,apply_enquiry",
        ...(status && { status }),
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/contacts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (requestSeq.current !== requestId) return;

      if (data.success) {
        const transformedData = data.data.map((item) => ({
          id: item._id,
          name: item.name,
          phone: item.phone,
          email: item.email,
          course: item.meta?.courseName || item.course || "Not sure yet",
          preferredCollege: getPreferredCollegeName(item),
          source: item.source,
          status: item.status,
          createdAt: item.createdAt,
          rawData: item,
        }));

        setEnquiries(transformedData);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setCurrentPage(page);
      }
    } catch (error) {
      if (requestSeq.current !== requestId) return;
      console.error("Error fetching enquiries:", error);
      showError("Failed to fetch enquiries");
    } finally {
      if (requestSeq.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEnquiries(1, debouncedSearchTerm, statusFilter);
  }, [debouncedSearchTerm, statusFilter]);

  const handlePageChange = (page) => {
    fetchEnquiries(page, debouncedSearchTerm, statusFilter);
  };

  const handleViewClick = (enquiry) => {
    setViewModal({ isOpen: true, data: enquiry.rawData });
  };

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
        showSuccess("Enquiry updated successfully");
        fetchEnquiries(currentPage, debouncedSearchTerm, statusFilter);
        setEditModal({ isOpen: false, data: null });
      } else {
        showError(data.error || "Failed to update enquiry");
      }
    } catch (error) {
      console.error("Error updating enquiry:", error);
      showError("Failed to update enquiry");
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
        fetchEnquiries(currentPage, debouncedSearchTerm, statusFilter);
      } else {
        showError(data.error || "Failed to delete enquiry");
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      showError("Failed to delete enquiry");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Student Name",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-blue-600 dark:text-primary-200 hover:text-blue-800 dark:hover:text-primary cursor-pointer hover:underline transition-colors duration-300",
      render: (item) => (
        <span onClick={() => handleViewClick(item)}>{item.name}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-700 dark:text-white/80 transition-colors duration-300",
    },
    {
      key: "email",
      header: "Email",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 transition-colors duration-300",
      render: (item) => (
        <span className="truncate block max-w-[200px]" title={item.email}>
          {item.email}
        </span>
      ),
    },
    {
      key: "course",
      header: "Course",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-700 dark:text-white/75 transition-colors duration-300",
    },
    {
      key: "preferredCollege",
      header: "Preferred College",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName: "text-sm text-gray-700 dark:text-white/75 transition-colors duration-300",
      render: (item) => (
        <span className="block max-w-[220px] truncate" title={item.preferredCollege}>
          {item.preferredCollege}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => {
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
              SOURCE_COLORS[item.source] || SOURCE_COLORS.other
            }`}
          >
            {item.source?.replace("_", " ")}
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
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
              STATUS_COLORS[item.status] || STATUS_COLORS.new
            }`}
          >
            {item.status?.replace("_", " ")}
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

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Student Enquiries
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage abroad counselling and application enquiries from students
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_minmax(9rem,0.72fr)] gap-4">
        <div className="relative min-w-0 w-full">
          <svg
            className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search students"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary/30 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <ApnaSelect
          title=""
          options={[
            { value: "", label: "All Status" },
            ...STATUS_OPTIONS,
          ]}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          placeholder="Select status"
          searchable={false}
          required={false}
          className="min-w-0 w-full"
          buttonClassName="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-between text-left cursor-pointer"
        />
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/40 rounded-lg transition-colors duration-300">
          <p className="text-sm text-primary-800 dark:text-primary-100">
            <span className="font-semibold">{selectedItems.length}</span>{" "}
            item(s) selected
          </p>
        </div>
      )}

      {/* Enquiries Table */}
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
        emptyMessage="No student enquiries found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onSelectAll={(pageIds, allSelected) => {
          if (allSelected) {
            setSelectedItems((prev) =>
              prev.filter((id) => !pageIds.includes(id))
            );
          } else {
            setSelectedItems((prev) => [...new Set([...prev, ...pageIds])]);
          }
        }}
        onPageChange={handlePageChange}
        searchKeys={["name", "phone", "email"]}
      />

      {/* View Details Modal */}
      <ApnaModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, data: null })}
        title="Enquiry Details"
        size="lg"
        showFooter={false}
      >
        {viewModal.data && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Name
                </label>
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.name}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Phone
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.phone}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Email
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.email}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  City
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.city || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Course
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.meta?.courseName || viewModal.data.course || "Not sure yet"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Source
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                  {viewModal.data.source?.replace("_", " ")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Form Type
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                  {viewModal.data.formType?.replace("_", " ")}
                </p>
              </div>
            </div>

            {(viewModal.data.meta?.collegeName || viewModal.data.meta?.courseName) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Enquiry Context
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/50">Preferred College</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewModal.data.meta?.collegeName || "General counselling"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-white/50">Preferred Course</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewModal.data.meta?.courseName || viewModal.data.course || "Not sure yet"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {viewModal.data.message && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Message
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-1">
                  {viewModal.data.message}
                </p>
              </div>
            )}

            {viewModal.data.notes && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Internal Notes
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 mt-1 whitespace-pre-wrap">
                  {viewModal.data.notes}
                </p>
              </div>
            )}

            {viewModal.data.preferredColleges?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Preferred Colleges
                </label>
                <ul className="mt-1 space-y-1">
                  {viewModal.data.preferredColleges.map((college, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-900 dark:text-white transition-colors duration-300"
                    >
                      • {college.name || college}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
              <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                Submitted On
              </label>
              <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
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
        title={`Edit: ${editModal.data?.name || "Student Enquiry"}`}
        size="md"
        showFooter={false}
      >
        {editModal.data && (
          <div className="p-4 space-y-4">
            <div className="rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 dark:text-white/50">Course</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {editModal.data.meta?.courseName || editModal.data.course || "Not sure yet"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 dark:text-white/50">Preferred College</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {getPreferredCollegeName(editModal.data)}
                </span>
              </div>
            </div>

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
