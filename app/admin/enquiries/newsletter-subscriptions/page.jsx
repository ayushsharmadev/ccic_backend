"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModal from "@/components/utils/ApnaModal";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";

export default function NewsletterSubscriptionsPage() {
  const { requireAdmin } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  const fetchSubscriptions = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) {
        params.append("search", search);
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/newsletter-subscriptions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const mapped = data.data.map((item) => ({
          id: item._id,
          email: item.email,
          source: item.source,
          createdAt: item.createdAt,
          ipAddress: item.ipAddress,
          referrer: item.referrer,
          userAgent: item.userAgent,
          meta: item.meta,
          rawData: item,
        }));

        setSubscriptions(mapped);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setCurrentPage(page);
      } else {
        showError(data.error || "Failed to fetch subscriptions");
      }
    } catch (error) {
      console.error("Error fetching newsletter subscriptions:", error);
      showError("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(1, searchTerm);
  }, [searchTerm]);

  const handlePageChange = (page) => {
    fetchSubscriptions(page, searchTerm);
  };

  const handleView = (subscription) => {
    setViewModal({ isOpen: true, data: subscription.rawData });
  };

  const handleDelete = async (id) => {
    const confirmed = confirm(
      "Delete this subscription? This action cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/newsletter-subscriptions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Subscription deleted");
        fetchSubscriptions(currentPage, searchTerm);
      } else {
        showError(data.error || "Failed to delete subscription");
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      showError("Failed to delete subscription");
    }
  };

  const columns = [
    {
      key: "email",
      header: "Email",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-blue-600 dark:text-primary-200 hover:text-blue-800 dark:hover:text-primary cursor-pointer hover:underline max-w-[220px] truncate transition-colors duration-300",
      render: (item) => (
        <span onClick={() => handleView(item)} title={item.email}>
          {item.email}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200 text-xs font-medium capitalize transition-colors duration-300">
          {item.source || "footer"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Subscribed On",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-center text-xs text-gray-600 dark:text-white/65 transition-colors duration-300",
      render: (item) => new Date(item.createdAt).toLocaleString("en-IN"),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleView(item)}
            className="px-2 py-1 text-xs text-primary dark:text-green-400 border border-primary rounded transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary/20 dark:text-primary-200 dark:border-primary/60"
          >
            View
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="px-2 py-1 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-rose-600/40 rounded transition-colors duration-200 hover:bg-red-50 dark:hover:bg-rose-500/20"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading && subscriptions.length === 0) {
    return (
      <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-7 w-52 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 w-64 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="h-10 flex-1 max-w-xs rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 dark:bg-slate-900">
              <div className="col-span-5 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-3 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
              <div className="col-span-4 h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-800">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 py-4 bg-white dark:bg-slate-900 transition-colors duration-300"
                >
                  <div className="sm:col-span-5">
                    <div className="h-4 w-44 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="sm:col-span-3">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="sm:col-span-4">
                    <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-800 animate-pulse" />
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
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300 mb-0.5">
          Newsletter Subscriptions
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage email subscriptions captured from the Stay Updated form.
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search by email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/40 rounded-lg transition-colors duration-300">
          <p className="text-sm text-primary-800 dark:text-primary-100">
            <span className="font-semibold">{selectedItems.length}</span>{" "}
            item(s) selected
          </p>
        </div>
      )}

      <ApnaTable
        data={subscriptions}
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
        emptyMessage="No newsletter subscriptions found"
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
        searchKeys={["email"]}
      />

      <ApnaModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, data: null })}
        title="Subscription Details"
        size="md"
        showFooter={false}
      >
        {viewModal.data && (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                Email
              </label>
              <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300 break-words">
                {viewModal.data.email}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Source
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 capitalize">
                  {viewModal.data.source || "footer"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Subscribed On
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {new Date(viewModal.data.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  Referrer
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 break-all">
                  {viewModal.data.referrer || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  IP Address
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300">
                  {viewModal.data.ipAddress || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                  User Agent
                </label>
                <p className="text-sm text-gray-900 dark:text-white transition-colors duration-300 break-all">
                  {viewModal.data.userAgent || "N/A"}
                </p>
              </div>
            </div>
            {viewModal.data.meta &&
              Object.keys(viewModal.data.meta).length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-white/60 transition-colors duration-300">
                    Metadata
                  </label>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-gray-100 dark:bg-slate-900 p-2 text-xs text-gray-800 dark:text-white/80 transition-colors duration-300">
                    {JSON.stringify(viewModal.data.meta, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        )}
      </ApnaModal>
    </div>
  );
}
