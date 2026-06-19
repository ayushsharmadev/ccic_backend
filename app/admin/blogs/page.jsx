"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function BlogList() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    blogId: null,
    blogTitle: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch blogs data from API
  const fetchBlogs = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
      });

      const response = await fetch(`/api/blogs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const transformedBlogs = data.data.map((blog) => ({
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          category: blog.category?.name || "Uncategorized",
          categoryColor: blog.category?.color || "#3b82f6",
          author: blog.author?.name || "Unknown",
          status: blog.status,
          isFeatured: blog.isFeatured || false,
          views: blog.views || 0,
          readTime: blog.readTime || 5,
          publishedAt: blog.publishedAt
            ? new Date(blog.publishedAt).toLocaleDateString("en-IN")
            : "Not Published",
          lastUpdated: blog.updatedAt
            ? new Date(blog.updatedAt).toISOString().split("T")[0]
            : "N/A",
        }));
        setBlogs(transformedBlogs);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch blogs:", data.error);
        setBlogs([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchBlogs(1, debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBlogs(page, debouncedSearchTerm);
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

  const handleEdit = (blog) => {
    router.push(`/admin/blogs/edit/${blog.id}`);
  };

  const handleDelete = async (id) => {
    const blog = blogs.find((b) => b.id === id);
    if (blog) {
      setDeleteModal({
        isOpen: true,
        blogId: id,
        blogTitle: blog.title,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.blogId) return;

    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/blogs/${deleteModal.blogId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showSuccess("Blog deleted successfully!");
        fetchBlogs(currentPage, debouncedSearchTerm);
        setDeleteModal({ isOpen: false, blogId: null, blogTitle: "" });
      } else {
        showError(data.error || "Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      showError("Failed to delete blog. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, blogId: null, blogTitle: "" });
  };

  const columns = [
    {
      key: "title",
      header: "Blog Title",
      headerClassName: "text-left text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300",
      width: "300px",
    },
    {
      key: "category",
      header: "Category",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "150px",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <div
            className="w-2 h-2 rounded-full border border-gray-200 dark:border-slate-700 transition-colors duration-300"
            style={{ backgroundColor: item.categoryColor }}
          ></div>
          <span className="text-xs text-gray-700 dark:text-white/75 transition-colors duration-300">
            {item.category}
          </span>
        </div>
      ),
    },
    {
      key: "author",
      header: "Author",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "120px",
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
            item.status === "published"
              ? "bg-green-100 text-primary dark:bg-emerald-500/20 dark:text-primary"
              : item.status === "draft"
              ? "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      ),
    },
    {
      key: "isFeatured",
      header: "Featured",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
            item.isFeatured
              ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200"
              : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-200"
          }`}
        >
          {item.isFeatured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "views",
      header: "Views",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "80px",
    },
    {
      key: "publishedAt",
      header: "Published",
      headerClassName: "text-center text-gray-700 dark:text-white/80",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors duration-300",
      width: "100px",
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
            href={`/admin/blogs/edit/${item.id}`}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent no-underline transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-primary/20 dark:text-primary-200 dark:border-primary/60"
          >
            Edit
          </Link>
          <Link
            href={`/blogs/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 text-xs text-green-600 border border-green-300 rounded bg-transparent no-underline transition-colors duration-200 hover:bg-green-50 dark:text-emerald-200 dark:border-emerald-500/40 dark:hover:bg-emerald-500/20"
            title="View blog (opens in new tab)"
          >
            View
          </Link>
          <button
            onClick={() => handleDelete(item.id)}
            className="px-2 py-1 text-xs text-secondary border border-secondary rounded bg-transparent cursor-pointer transition-colors duration-200 hover:bg-secondary-50 dark:text-secondary-200 dark:border-secondary/60 dark:hover:bg-secondary/20"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="h-10 w-full sm:w-72 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-10 w-36 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_0.8fr_1fr_1.2fr] gap-4 px-4 py-3 bg-gray-100 dark:bg-slate-900">
            {[...Array(8)].map((_, idx) => (
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
                <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1fr_1fr_1fr_0.8fr_1fr_1.2fr] gap-4">
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
                  <div className="h-4 rounded bg-gray-200 dark:bg-slate-800 animate-pulse"></div>
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

  if (loading && blogs.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full p-4 sm:p-5 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 mb-1">
          Blog Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-white/70 transition-colors duration-300">
          Manage and organize your blog articles
        </p>
      </div>

      {/* Search & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search blogs by title, content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300 placeholder:text-gray-400 dark:placeholder:text-white/40"
          />
        </div>
        <Link
          href="/admin/blogs/add"
          className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-600 transition-colors no-underline focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          Add New Blog
        </Link>
      </div>

      {/* Selected Items Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded transition-colors duration-300">
          <p className="text-sm text-blue-900 dark:text-blue-100 transition-colors duration-300">
            {selectedItems.length} blog(s) selected
          </p>
        </div>
      )}

      {/* Blogs Table */}
      <ApnaTable
        data={blogs}
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
        emptyMessage="No blogs found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["title", "category", "author"]}
      />

      {/* Delete Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Blog"
        message={`Are you sure you want to delete "${deleteModal.blogTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
