"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaModalBrochureUpload from "@/components/utils/ApnaModalBrochureUpload";
import ApnaModal from "@/components/utils/ApnaModal";
import ApnaSelect from "@/components/utils/ApnaSelect";
import LocationFilterBar from "@/components/utils/LocationFilterBar";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function CollegeList() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    type: "all", // all / featured / popular
    limit: "100",
    country: "",
    state: "",
    district: "",
  });
  const [brochureModal, setBrochureModal] = useState({
    isOpen: false,
    collegeId: null,
    collegeName: "",
    existingBrochure: null,
  });
  const [mapModal, setMapModal] = useState({
    isOpen: false,
    collegeId: null,
    collegeName: "",
    currentMapEmbedUrl: "",
  });
  const [mapQuery, setMapQuery] = useState("");

  // Sample college data removed - now using real API data

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch colleges data from API
  const fetchColleges = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const limitValue = parseInt(filters.limit, 10) || 10;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limitValue.toString(),
        search: search,
      });

      // Add type filter (featured / popular)
      if (filters.type === "featured") {
        params.append("isFeatured", "true");
      } else if (filters.type === "popular") {
        params.append("isPopular", "true");
      }

      if (filters.country) params.append("country", filters.country);
      if (filters.state) params.append("state", filters.state);
      if (filters.district) params.append("district", filters.district);

      const response = await fetch(`/api/colleges?${params}`);
      const data = await response.json();

      if (data.success) {
        // Transform API data to match table structure
        const transformedColleges = data.data.map((college) => ({
          id: college._id,
          name: college.name,
          slug: college.slug,
          popularName:
            college.popularName || college.name.substring(0, 15) + "...",
          shortName: college.shortName || college.name.substring(0, 5),
          estdYear: college.estdYear || "N/A",
          ownership: college.ownership?.name || "N/A",
          affiliation: college.affiliation?.name || "N/A",
          country: college.country?.name || "N/A",
          state: college.state?.name || "N/A",
          district: college.district?.name || "N/A",
          location: college.location || "N/A",
          phoneNumber: college.phoneNumber || "N/A",
          emailAddress: college.emailAddress || "N/A",
          status: college.status || "active",
          isFeatured: college.isFeatured || false,
          isPopular: college.isPopular || false,
          displayOrder: college.displayOrder || 0,
          brochure: college.brochure || null,
          collegeGallery: college.collegeGallery || [],
          hostelGallery: college.hostelGallery || [],
          campusGallery: college.campusGallery || [],
          collegeFacilitiesCount: college.facilities?.length || 0,
          hostelFacilitiesCount: college.hostelFacilities?.length || 0,
          hospitalFacilitiesCount: college.hospitalFacilities?.length || 0,
          coursesCount: college.coursesCount || 0,
          rankingsCount: college.rankingsCount || 0,
          distanceMetersCount: college.distanceMetersCount || 0,
          reviewsCount: college.reviewsCount || 0,
          noticesCount: college.noticesCount || 0,
          sectionsCount: college.sectionsCount || 0,
          lastUpdated: college.updatedAt
            ? new Date(college.updatedAt).toISOString().split("T")[0]
            : "N/A",
        }));
        setColleges(transformedColleges);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch colleges:", data.error);
        setColleges([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      setColleges([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search or filters change
    fetchColleges(1, debouncedSearchTerm);
  }, [debouncedSearchTerm, filters]);

  // Page change handler
  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page immediately
    fetchColleges(page, debouncedSearchTerm);
  };

  const handleSelectionChange = (newSelectedItems) => {
    setSelectedItems(newSelectedItems);
  };

  const handleSelectAll = (pageIds, allSelected) => {
    if (allSelected) {
      // If all are selected, deselect all current page items
      setSelectedItems((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      // If not all are selected, select all current page items
      setSelectedItems((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  // Handle edit college - redirect to edit page
  const handleEdit = (college) => {
    router.push(`/admin/college/edit/${college.id}`);
  };

  const handleBrochureUpload = (college) => {
    setBrochureModal({
      isOpen: true,
      collegeId: college.id || college._id,
      collegeName: college.name,
      existingBrochure: college.brochure || null,
    });
  };

  const handleBrochureModalClose = () => {
    setBrochureModal({
      isOpen: false,
      collegeId: null,
      collegeName: "",
      existingBrochure: null,
    });
  };

  const handleBrochureUploaded = (brochureUrl) => {
    // Update the college in the local state
    setColleges((prevColleges) =>
      prevColleges.map((college) =>
        college.id === brochureModal.collegeId
          ? { ...college, brochure: brochureUrl }
          : college
      )
    );
  };

  const handleMapModal = async (college) => {
    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      // Fetch college map embed URL
      const response = await fetch(`/api/colleges/${college.id}/map`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setMapModal({
          isOpen: true,
          collegeId: college.id,
          collegeName: college.name,
          currentMapEmbedUrl: data.data.mapEmbedUrl || "",
        });
        setMapQuery(data.data.mapEmbedUrl || "");
      }
    } catch (error) {
      console.error("Error fetching college map data:", error);
      setMapModal({
        isOpen: true,
        collegeId: college.id,
        collegeName: college.name,
        currentMapEmbedUrl: "",
      });
      setMapQuery("");
    }
  };

  const handleMapModalClose = () => {
    setMapModal({
      isOpen: false,
      collegeId: null,
      collegeName: "",
      currentMapEmbedUrl: "",
    });
    setMapQuery("");
  };

  const handleMapSave = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const response = await fetch(`/api/colleges/${mapModal.collegeId}/map`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mapEmbedUrl: mapQuery,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Map embed URL saved successfully!");
        handleMapModalClose();
        // Optionally refresh the colleges list
        fetchColleges(currentPage, debouncedSearchTerm);
      } else {
        showError("Failed to save map embed URL: " + data.error);
      }
    } catch (error) {
      console.error("Error saving map embed URL:", error);
      showError("Error saving map embed URL");
    }
  };

  // Navigate to College Notices Page
  const handleNoticesPage = (college) => {
    router.push(`/admin/college/notices/${college.id}`);
  };

  const handleStatusToggle = async (id) => {
    try {
      const college = colleges.find((c) => c.id === id);
      if (!college) return;

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const newStatus = college.status === "active" ? "inactive" : "active";

      const response = await fetch(`/api/colleges/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...college,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`College ${newStatus} successfully!`);
        setColleges(
          colleges.map((college) =>
            college.id === id ? { ...college, status: newStatus } : college
          )
        );
      } else {
        showError("Failed to update college status: " + data.error);
      }
    } catch (error) {
      console.error("Error updating college status:", error);
      showError("Error updating college status");
    }
  };

  // Define table columns with proper widths - only fields that exist in College model
  const columns = [
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-left",
      cellClassName: "text-left",
      width: "320px",
      render: (item) => (
        <div className="flex gap-1 justify-start items-center flex-nowrap">
          <Link
            href={`/admin/college/edit/${item.id}`}
            className="px-2 py-1 text-xs text-primary border border-primary rounded bg-transparent no-underline hover:bg-blue-50"
          >
            Edit
          </Link>
          <Link
            href={`/admin/college/courses/${item.id}`}
            className="px-2 py-1 text-xs text-amber-600 border border-amber-300 rounded bg-transparent no-underline hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-colors"
            title={`Courses Allocated: ${item.coursesCount || 0}`}
          >
            Courses ({item.coursesCount || 0})
          </Link>
          <Link
            href={`/admin/college/rankings/${item.id}`}
            className="px-2 py-1 text-xs text-purple-600 border border-purple-300 rounded bg-transparent no-underline hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors"
            title={`Rankings Added: ${item.rankingsCount || 0}`}
          >
            Rankings ({item.rankingsCount || 0})
          </Link>
          <Link
            href={`/admin/college/distance-meters/${item.id}`}
            className="px-2 py-1 text-xs text-teal-600 border border-teal-300 rounded bg-transparent no-underline hover:bg-teal-50 dark:hover:bg-teal-500/20 transition-colors"
            title={`Distance Meters Added: ${item.distanceMetersCount || 0}`}
          >
            Distance Meters ({item.distanceMetersCount || 0})
          </Link>
          <Link
            href={`/admin/reviews?college=${item.id}`}
            className="px-2 py-1 text-xs text-indigo-600 border border-indigo-300 rounded bg-transparent no-underline hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
            title={`Reviews Count: ${item.reviewsCount || 0}`}
          >
            Reviews ({item.reviewsCount || 0})
          </Link>
          <button
            onClick={() => handleBrochureUpload(item)}
            className="px-2 py-1 text-xs text-orange-600 border border-orange-300 rounded bg-transparent cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-500/20 transition-colors"
            title={item.brochure ? "Update Brochure" : "Upload Brochure"}
          >
            Brochure
          </button>
          <button
            onClick={() => handleMapModal(item)}
            className="px-2 py-1 text-xs text-green-600 border border-green-300 rounded bg-transparent cursor-pointer hover:bg-green-50 dark:hover:bg-green-500/20 transition-colors"
            title="Set Map Embed URL"
          >
            Map
          </button>
          <button
            onClick={() => handleNoticesPage(item)}
            className="px-2 py-1 text-xs text-cyan-600 border border-cyan-300 rounded bg-transparent cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-500/20 transition-colors"
            title="Manage College Notices"
          >
            Notices
          </button>
          <Link
            href={`/admin/college/sections/${item.id}`}
            className="px-2 py-1 text-xs text-indigo-600 border border-indigo-300 rounded bg-transparent no-underline hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
            title={`Manage Sections (${item.sectionsCount || 0})`}
          >
            Sections ({item.sectionsCount || 0})
          </Link>
          <Link
            href={`/admin/college/gallery/${item.id}`}
            className="px-2 py-1 text-xs text-purple-600 border border-purple-300 rounded bg-transparent no-underline hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors"
            title={`Manage Gallery - College: ${item.collegeGallery?.length || 0
              }, Hostel: ${item.hostelGallery?.length || 0}, Campus: ${item.campusGallery?.length || 0
              }`}
          >
            Gallery ({item.collegeGallery?.length || 0},
            {item.hostelGallery?.length || 0},{item.campusGallery?.length || 0})
          </Link>
          <div
            className="px-2 py-1 text-xs text-teal-600 border border-teal-300 rounded bg-transparent"
            title={`Facilities Count - College: ${item.collegeFacilitiesCount || 0
              }, Hospital: ${item.hospitalFacilitiesCount || 0}, Hostel: ${item.hostelFacilitiesCount || 0
              }`}
          >
            Facilities ({item.collegeFacilitiesCount || 0},
            {item.hospitalFacilitiesCount || 0},
            {item.hostelFacilitiesCount || 0})
          </div>
          <Link
            href={`/admin/college/seo/${item.id}`}
            className="px-2 py-1 text-xs text-pink-600 border border-pink-300 rounded bg-transparent no-underline hover:bg-pink-50 dark:hover:bg-pink-500/20 transition-colors"
            title="Manage SEO Data"
          >
            SEO
          </Link>
        </div>
      ),
    },
    {
      key: "name",
      header: "College Name",
      headerClassName: "text-left",
      cellClassName:
        "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      width: "250px",
      render: (item) => (
        <Link
          href="#"
          className="text-primary hover:text-primary-600 hover:underline no-underline font-medium"
          title="View college details"
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: "shortName",
      header: "Short Name",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "100px",
    },
    {
      key: "estdYear",
      header: "Est. Year",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "80px",
    },
    {
      key: "ownership",
      header: "Ownership",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "120px",
    },
    {
      key: "affiliation",
      header: "Affiliation",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "120px",
    },
    {
      key: "country",
      header: "Country",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "100px",
    },
    {
      key: "state",
      header: "State",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "100px",
    },
    {
      key: "district",
      header: "District",
      headerClassName: "text-center",
      cellClassName:
        "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "100px",
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
              : item.status === "inactive"
                ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
                : item.status === "draft"
                  ? "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-200"
                  : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/80"
            }`}
        >
          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) ||
            "N/A"}
        </span>
      ),
    },
    {
      key: "isFeatured",
      header: "Featured",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.isFeatured
              ? "bg-blue-100 text-primary-800 dark:bg-primary/20 dark:text-primary-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/70"
            }`}
        >
          {item.isFeatured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "isPopular",
      header: "Popular",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.isPopular
              ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/70"
            }`}
        >
          {item.isPopular ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "noticesCount",
      header: "Notices",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 text-center",
      width: "70px",
      render: (item) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200">
          {item.noticesCount || 0}
        </span>
      ),
    },
  ];

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-96 animate-pulse"></div>
      </div>

      {/* Search & Add Button Skeleton */}
      <div className="flex justify-between items-center mb-4">
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors duration-300">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[60px_320px_250px_100px_80px_120px_120px_100px_100px_80px_80px_80px_70px] gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`p-3 ${i < 7 ? "border-b border-gray-200 dark:border-slate-800" : ""
              }`}
          >
            <div className="grid grid-cols-[60px_320px_250px_100px_80px_120px_120px_100px_100px_80px_80px_80px_70px] gap-4 items-center">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-4 flex justify-between items-center">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-8 animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          College Management
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage all colleges and their information for CCIC
          education
        </p>
      </div>

      {/* Search, Filters, and Add Button */}
      <div className="mb-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative w-60">
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
              placeholder="Search colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
            />
            {searchTerm !== debouncedSearchTerm && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {searchTerm && searchTerm === debouncedSearchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
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

          {/* Filters */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <LocationFilterBar
              country={filters.country}
              state={filters.state}
              district={filters.district}
              onCountryChange={(value) =>
                setFilters({
                  ...filters,
                  country: value,
                  state: "",
                  district: "",
                })
              }
              onStateChange={(value) =>
                setFilters({ ...filters, state: value, district: "" })
              }
              onDistrictChange={(value) =>
                setFilters({ ...filters, district: value })
              }
              itemClassName="min-w-40"
            />

            {/* Type Filter (Featured/Popular) */}
            <ApnaSelect
              title=""
              options={[
                { value: "all", label: "All Colleges" },
                { value: "featured", label: "Featured" },
                { value: "popular", label: "Popular" },
              ]}
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              placeholder="Select type"
              searchable={false}
              required={false}
              buttonClassName="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors flex items-center justify-between text-left cursor-pointer"
            />

            {/* Limit Filter */}
            <ApnaSelect
              title=""
              options={[
                { value: "10", label: "10 per page" },
                { value: "20", label: "20 per page" },
                { value: "50", label: "50 per page" },
                { value: "100", label: "100 per page" },
              ]}
              value={filters.limit}
              onChange={(value) => setFilters({ ...filters, limit: value })}
              placeholder="Select limit"
              searchable={false}
              required={false}
              buttonClassName="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors flex items-center justify-between text-left cursor-pointer"
            />
          </div>

          {/* Add Button */}
          <Link
            href="/admin/college/add"
            className="bg-primary hover:bg-primary-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors no-underline"
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
            Add College
          </Link>
        </div>
      </div>

      {/* Selected Items Info */}
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

      {/* Colleges Table */}
      <ApnaTable
        data={colleges}
        columns={columns}
        loading={loading}
        showSearch={false}
        showPagination={true}
        itemsPerPage={parseInt(filters.limit, 10) || 10}
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
        emptyMessage="No colleges found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "shortName", "country", "state", "district", "ownership"]}
      />

      {/* Brochure Upload Modal */}
      <ApnaModalBrochureUpload
        key={`brochure-modal-${brochureModal.collegeId}`}
        isOpen={brochureModal.isOpen}
        onClose={handleBrochureModalClose}
        collegeId={brochureModal.collegeId}
        collegeName={brochureModal.collegeName}
        existingBrochure={brochureModal.existingBrochure}
        onBrochureUploaded={handleBrochureUploaded}
      />

      {/* Map Embed URL Modal */}
      <ApnaModal
        isOpen={mapModal.isOpen}
        onClose={handleMapModalClose}
        onSubmit={handleMapSave}
        title={`Set Map Location - ${mapModal.collegeName}`}
        size="2xl"
        submitText="Save Map URL"
        cancelText="Cancel"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-2 block">
              Enter Search Query for Map
              <span className="text-gray-500 font-normal ml-1">
                (e.g., college name, address, or location)
              </span>
            </label>
            <input
              type="text"
              value={mapQuery}
              onChange={(e) => setMapQuery(e.target.value)}
              placeholder="Enter college name or address to search on map"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
              This will be embedded in the Google Maps iframe to show the
              college location
            </p>
          </div>

          {/* Map Preview */}
          {mapQuery && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-white/80 mb-2 block">
                Map Preview
              </label>
              <div className="border border-gray-300 dark:border-slate-700 rounded overflow-hidden">
                <iframe
                  className="gmap_iframe w-full"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://maps.google.com/maps?width=600&height=400&hl=en&q=${encodeURIComponent(
                    mapQuery
                  )}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
                  style={{ height: "400px" }}
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </ApnaModal>
    </div>
  );
}
