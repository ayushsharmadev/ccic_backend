"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function StudentEnquiriesPage() {
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

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  const fetchEnquiries = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
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

      if (data.success) {
        const transformedData = data.data.map((item) => ({
          id: item._id,
          name: item.name,
          phone: item.phone,
          email: item.email,
          neetScore: item.neetScore || "N/A",
          colleges: item.preferredColleges?.length || 0,
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
      console.error("Error fetching enquiries:", error);
      showError("Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(1, searchTerm, statusFilter);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page) => {
    fetchEnquiries(page, searchTerm, statusFilter);
  };

  const handleViewClick = (enquiry) => {
    setViewModal({ isOpen: true, data: enquiry.rawData });
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
      key: "neetScore",
      header: "NEET Score",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-sm text-gray-700 dark:text-white/75 transition-colors duration-300",
    },
    {
      key: "colleges",
      header: "Colleges",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-white/75 transition-colors duration-300">
          {item.colleges} {item.colleges === 1 ? "college" : "colleges"}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => {
        const sourceColors = {
          home_page:
            "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
          sidebar:
            "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
          modal:
            "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
          other:
            "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
        };
        return (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
              sourceColors[item.source] || sourceColors.other
            }`}
          >
            {item.source.replace("_", " ")}
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
          new: "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-200",
          contacted:
            "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
          interested:
            "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200",
          not_interested:
            "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
          converted:
            "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
          spam: "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-200",
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
      render: (item) => new Date(item.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <button
          onClick={() => handleViewClick(item)}
          className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary/20 dark:text-primary-200 dark:border-primary/60"
        >
          View Details
        </button>
      ),
    },
  ];

  if (loading && enquiries.length === 0) {
    return (
      <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="space-y-4">
          {/* Page header skeleton */}
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-72 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
          </div>

          {/* Filters skeleton */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="h-10 flex-1 max-w-xs rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-10 w-44 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
          </div>

          {/* Table skeleton */}
          <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 dark:bg-slate-900">
              <div className="col-span-3 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-3 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-2 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-800">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
                >
                  <div className="sm:col-span-3">
                    <div className="h-4 w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="h-4 w-28 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="sm:col-span-3">
                    <div className="h-4 w-40 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="sm:col-span-2 flex sm:justify-end">
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
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Student Enquiries
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage admission and application enquiries from students across all
          streams and courses
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <ApnaSelect
          title=""
          options={[
            { value: "", label: "All Status" },
            { value: "new", label: "New" },
            { value: "contacted", label: "Contacted" },
            { value: "interested", label: "Interested" },
            { value: "not_interested", label: "Not Interested" },
            { value: "converted", label: "Converted" },
            { value: "spam", label: "Spam" },
          ]}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          placeholder="Select status"
          searchable={false}
          required={false}
          buttonClassName="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 flex items-center justify-between text-left cursor-pointer"
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
                  NEET Score
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.neetScore || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Course
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.course || "MBBS"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Source
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                  {viewModal.data.source.replace("_", " ")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Form Type
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                  {viewModal.data.formType.replace("_", " ")}
                </p>
              </div>
            </div>

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
    </div>
  );
}
