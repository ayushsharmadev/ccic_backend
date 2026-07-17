"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModalConfirmation from "@/components/utils/ApnaModalConfirmation";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";
import {
  HiStar,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiTrash,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteReviewModal, setDeleteReviewModal] = useState({
    isOpen: false,
    reviewId: null,
  });
  const [deleteReplyModal, setDeleteReplyModal] = useState({
    isOpen: false,
    reviewId: null,
    replyIndex: null,
  });

  const [filters, setFilters] = useState({
    college: searchParams.get("college") || "all",
    status: searchParams.get("status") || "all",
    rating: searchParams.get("rating") || "all",
    limit: searchParams.get("limit") || "10",
  });

  useEffect(() => {
    const collegeParam = searchParams.get("college");
    const statusParam = searchParams.get("status");
    const ratingParam = searchParams.get("rating");
    const limitParam = searchParams.get("limit");

    setFilters((prev) => ({
      ...prev,
      college: collegeParam || "all",
      status: statusParam || "all",
      rating: ratingParam || "all",
      limit: limitParam || "10",
    }));

    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10) || 1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, filters]);

  useEffect(() => {
    // Update URL params when filters or page change
    const params = new URLSearchParams();
    if (filters.college !== "all") {
      params.set("college", filters.college);
    }
    if (filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters.rating !== "all") {
      params.set("rating", filters.rating);
    }
    if (filters.limit !== "10") {
      params.set("limit", filters.limit);
    }
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `/admin/reviews?${queryString}`
      : "/admin/reviews";

    // Only update URL if it's different from current URL to avoid infinite loops
    if (typeof window !== "undefined") {
      const currentUrl = window.location.pathname + window.location.search;
      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false });
      }
    }
  }, [filters, currentPage, router]);

  const fetchColleges = async () => {
    try {
      const token = getAccessToken();
      const response = await fetch("/api/colleges?limit=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setColleges(
          data.data.map((c) => ({
            value: c._id,
            label: c.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: filters.limit,
      });

      if (filters.college !== "all") {
        params.append("college", filters.college);
      }
      if (filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.rating !== "all") {
        params.append("rating", filters.rating);
      }

      const token = getAccessToken();
      const response = await fetch(`/api/reviews?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      } else {
        showError(data.error || "Failed to fetch reviews");
      }
    } catch (error) {
      showError("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(
          `Review ${
            newStatus === "approved" ? "approved" : "rejected"
          } successfully`
        );
        fetchReviews();
      } else {
        showError(data.error || "Failed to update review");
      }
    } catch (error) {
      showError("Failed to update review");
    }
  };

  const handleReplyStatusChange = async (reviewId, replyIndex, newStatus) => {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `/api/reviews/${reviewId}/reply/${replyIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess(
          `Reply ${
            newStatus === "approved" ? "approved" : "rejected"
          } successfully`
        );
        fetchReviews();
      } else {
        showError(data.error || "Failed to update reply");
      }
    } catch (error) {
      showError("Failed to update reply");
    }
  };

  const handleDeleteClick = (reviewId) => {
    setDeleteReviewModal({ isOpen: true, reviewId });
  };

  const handleDeleteConfirm = async () => {
    const { reviewId } = deleteReviewModal;
    if (!reviewId) return;

    try {
      const token = getAccessToken();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Review deleted successfully");
        setDeleteReviewModal({ isOpen: false, reviewId: null });
        fetchReviews();
      } else {
        showError(data.error || "Failed to delete review");
      }
    } catch (error) {
      showError("Failed to delete review");
    }
  };

  const handleDeleteReplyClick = (reviewId, replyIndex) => {
    setDeleteReplyModal({ isOpen: true, reviewId, replyIndex });
  };

  const handleDeleteReplyConfirm = async () => {
    const { reviewId, replyIndex } = deleteReplyModal;
    if (!reviewId || replyIndex === null) return;

    try {
      const token = getAccessToken();
      const response = await fetch(
        `/api/reviews/${reviewId}/reply/${replyIndex}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Reply deleted successfully");
        setDeleteReplyModal({
          isOpen: false,
          reviewId: null,
          replyIndex: null,
        });
        fetchReviews();
      } else {
        showError(data.error || "Failed to delete reply");
      }
    } catch (error) {
      showError("Failed to delete reply");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <HiClock className="w-3 h-3" />
          Pending
        </span>
      ),
      approved: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <HiCheckCircle className="w-3 h-3" />
          Approved
        </span>
      ),
      rejected: (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <HiXCircle className="w-3 h-3" />
          Rejected
        </span>
      ),
    };
    return badges[status] || badges.pending;
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <HiStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const collegeOptions = [{ value: "all", label: "All Colleges" }, ...colleges];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const ratingOptions = [
    { value: "all", label: "All Ratings" },
    { value: "5", label: "5 Stars" },
    { value: "4", label: "4 Stars" },
    { value: "3", label: "3 Stars" },
    { value: "2", label: "2 Stars" },
    { value: "1", label: "1 Star" },
  ];

  const limitOptions = [
    { value: "10", label: "10 per page" },
    { value: "25", label: "25 per page" },
    { value: "50", label: "50 per page" },
    { value: "100", label: "100 per page" },
  ];

  // Pagination component
  const Pagination = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="text-sm text-gray-700 dark:text-white/70">
          Showing {(currentPage - 1) * parseInt(filters.limit, 10) + 1} to{" "}
          {Math.min(currentPage * parseInt(filters.limit, 10), totalItems)} of{" "}
          {totalItems} reviews
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                currentPage === page
                  ? "bg-primary text-white border-primary"
                  : "border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          College Reviews
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              College
            </label>
            <ApnaSelect
              title=""
              options={collegeOptions}
              value={filters.college}
              onChange={(value) => handleFilterChange("college", value)}
              placeholder="Select College"
              className="w-full"
              buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
              textClassName="overflow-hidden text-ellipsis whitespace-nowrap text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Status
            </label>
            <ApnaSelect
              title=""
              options={statusOptions}
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="Select Status"
              className="w-full"
              buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
              textClassName="overflow-hidden text-ellipsis whitespace-nowrap text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Rating
            </label>
            <ApnaSelect
              title=""
              options={ratingOptions}
              value={filters.rating}
              onChange={(value) => handleFilterChange("rating", value)}
              placeholder="Select Rating"
              className="w-full"
              buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
              textClassName="overflow-hidden text-ellipsis whitespace-nowrap text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Limit
            </label>
            <ApnaSelect
              title=""
              options={limitOptions}
              value={filters.limit}
              onChange={(value) => handleFilterChange("limit", value)}
              placeholder="Select Limit"
              className="w-full"
              buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
              textClassName="overflow-hidden text-ellipsis whitespace-nowrap text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        {loading ? (
          <div className="space-y-3 py-2" aria-busy="true" aria-label="Loading reviews">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700"
              />
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div
                key={review._id || index}
                className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-semibold text-sm">
                        {review.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {review.name || "Anonymous"}
                        </h4>
                        {getStatusBadge(review.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getRatingStars(review.rating)}
                        <span className="text-xs text-gray-500 dark:text-white/60">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString()
                            : "Recently"}
                        </span>
                      </div>
                      {review.college?.name && (
                        <Link
                          href={`/admin/college/edit/${
                            review.college._id || review.college
                          }`}
                          className="text-xs text-primary hover:text-primary-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors mt-1 inline-block"
                        >
                          {review.college.name}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {review.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusChange(review._id, "approved")
                          }
                          className="px-2 py-1 text-xs text-green-600 border border-green-300 rounded bg-transparent hover:bg-green-50 dark:hover:bg-green-500/20 transition-colors"
                          title="Approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(review._id, "rejected")
                          }
                          className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded bg-transparent hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                          title="Reject"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteClick(review._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded transition-colors"
                      title="Delete"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Review Comment */}
                <p className="text-sm text-gray-700 dark:text-white/80 mb-3 whitespace-pre-wrap">
                  {review.comment}
                </p>

                {/* Replies Section */}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                    <h5 className="text-xs font-semibold text-gray-700 dark:text-white/80 mb-2">
                      Replies ({review.replies.length})
                    </h5>
                    {review.replies.map((reply, replyIndex) => (
                      <div
                        key={replyIndex}
                        className="pl-4 border-l-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {reply.name || "Admin"}
                            </span>
                            {getStatusBadge(reply.status || "pending")}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-white/60">
                              {reply.createdAt
                                ? new Date(reply.createdAt).toLocaleDateString()
                                : "Recently"}
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteReplyClick(review._id, replyIndex)
                              }
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded transition-colors"
                              title="Delete Reply"
                            >
                              <HiTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-white/80 mb-2">
                          {reply.comment}
                        </p>
                        {reply.status === "pending" && (
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                            <button
                              onClick={() =>
                                handleReplyStatusChange(
                                  review._id,
                                  replyIndex,
                                  "approved"
                                )
                              }
                              className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleReplyStatusChange(
                                  review._id,
                                  replyIndex,
                                  "rejected"
                                )
                              }
                              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-white/60">No reviews found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && <Pagination />}
      </div>

      {/* Delete Review Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteReviewModal.isOpen}
        onClose={() => setDeleteReviewModal({ isOpen: false, reviewId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete Review"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon="danger"
        loading={false}
      />

      {/* Delete Reply Confirmation Modal */}
      <ApnaModalConfirmation
        isOpen={deleteReplyModal.isOpen}
        onClose={() =>
          setDeleteReplyModal({
            isOpen: false,
            reviewId: null,
            replyIndex: null,
          })
        }
        onConfirm={handleDeleteReplyConfirm}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete Reply"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon="danger"
        loading={false}
      />
    </div>
  );
}
