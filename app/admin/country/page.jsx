"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ApnaTable from "@/components/utils/ApnaTable";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function CountryList() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limitInitialized, setLimitInitialized] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    type: "all", // all / featured / popular
    limit: "100",
  });

  useEffect(() => {
    const isCompact = window.matchMedia("(max-width: 767px)").matches;
    setFilters((prev) => ({ ...prev, limit: isCompact ? "10" : "100" }));
    setLimitInitialized(true);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch countries data from API
  const fetchCountries = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const limitValue = parseInt(filters.limit, 10) || 100;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limitValue.toString(),
        search: search,
      });

      if (filters.type === "featured") {
        params.append("isFeatured", "true");
      } else if (filters.type === "popular") {
        params.append("isPopular", "true");
      }

      const token = getAccessToken();
      const response = await fetch(`/api/countries?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const transformedCountries = data.data.map((country) => ({
          id: country._id,
          name: country.name,
          shortName: country.shortName || country.name.substring(0, 5),
          code: country.code || "N/A",
          capital: country.capital || "N/A",
          currency: country.currency || "N/A",
          language: country.language || "N/A",
          population: country.population || "N/A",
          timeZone: country.timeZone || "N/A",
          callingCode: country.callingCode || "N/A",
          status: country.status || "active",
          isFeatured: country.isFeatured || false,
          isPopular: country.isPopular || false,
          displayOrder: country.displayOrder || 0,
          logo: country.logo || null,
          sectionsCount: country.sections?.length || 0,
          galleryCount: country.countryGallery?.length || 0,
          pathwaysCount: country.studyPathways?.length || 0,
        }));
        
        setCountries(transformedCountries);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
        setCurrentPage(page);
      } else {
        console.error("Failed to fetch countries:", data.error);
        setCountries([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!limitInitialized) return;
    setCurrentPage(1);
    fetchCountries(1, debouncedSearchTerm);
  }, [debouncedSearchTerm, filters, limitInitialized]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCountries(page, debouncedSearchTerm);
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

  const handleStatusToggle = async (id) => {
    try {
      const country = countries.find((c) => c.id === id);
      if (!country) return;

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const newStatus = country.status === "active" ? "inactive" : "active";

      const response = await fetch(`/api/countries/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...country,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Country ${newStatus} successfully!`);
        setCountries(
          countries.map((country) =>
            country.id === id ? { ...country, status: newStatus } : country
          )
        );
      } else {
        showError("Failed to update country status: " + data.error);
      }
    } catch (error) {
      console.error("Error updating country status:", error);
      showError("Error updating country status");
    }
  };

  const columns = [
    {
      key: "actions",
      header: "ACTIONS",
      headerClassName: "text-left",
      cellClassName: "text-left",
      width: "320px",
      render: (item) => (
        <div className="flex gap-1 justify-start items-center flex-nowrap">
          <Link
            href={`/admin/country/edit/${item.id}`}
            className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded bg-transparent no-underline hover:bg-blue-50 transition-colors"
          >
            Edit
          </Link>
          <Link
            href={`/admin/country/pathways/${item.id}`}
            className="px-2 py-1 text-xs text-orange-600 border border-orange-300 rounded bg-transparent no-underline hover:bg-orange-50 transition-colors"
            title={`Manage Pathways`}
          >
            Pathways
          </Link>
          <Link
            href={`/admin/country/sections/${item.id}`}
            className="px-2 py-1 text-xs text-indigo-600 border border-indigo-300 rounded bg-transparent no-underline hover:bg-indigo-50 transition-colors"
            title={`Manage Sections (${item.sectionsCount || 0})`}
          >
            Sections ({item.sectionsCount || 0})
          </Link>
          <Link
            href={`/admin/country/gallery/${item.id}`}
            className="px-2 py-1 text-xs text-purple-600 border border-purple-300 rounded bg-transparent no-underline hover:bg-purple-50 transition-colors"
            title={`Manage Gallery (${item.galleryCount || 0})`}
          >
            Gallery ({item.galleryCount || 0})
          </Link>
          <Link
            href={`/admin/country/seo/${item.id}`}
            className="px-2 py-1 text-xs text-pink-600 border border-pink-300 rounded bg-transparent no-underline hover:bg-pink-50 transition-colors"
            title="Manage SEO Data"
          >
            SEO
          </Link>
        </div>
      ),
    },
    {
      key: "name",
      header: "COUNTRY NAME",
      headerClassName: "text-left",
      cellClassName: "text-sm font-medium text-gray-900 dark:text-white transition-colors",
      width: "250px",
      render: (item) => (
        <Link
          href={`/admin/country/edit/${item.id}`}
          className="text-primary hover:text-primary-600 hover:underline no-underline font-medium"
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: "shortName",
      header: "SHORT NAME",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "100px",
    },
    {
      key: "code",
      header: "CODE",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors uppercase font-semibold",
      width: "80px",
    },
    {
      key: "capital",
      header: "CAPITAL",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "120px",
    },
    {
      key: "currency",
      header: "CURRENCY",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "140px",
    },
    {
      key: "language",
      header: "LANGUAGE",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "140px",
    },
    {
      key: "population",
      header: "POPULATION",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "100px",
    },
    {
      key: "timeZone",
      header: "TIMEZONE",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "80px",
    },
    {
      key: "callingCode",
      header: "CALL CODE",
      headerClassName: "text-center",
      cellClassName: "text-sm text-gray-600 dark:text-white/70 text-center transition-colors",
      width: "80px",
    },
    {
      key: "status",
      header: "STATUS",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          onClick={() => handleStatusToggle(item.id)}
          className={`cursor-pointer inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            item.status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
              : item.status === "inactive"
              ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200"
              : item.status === "draft"
              ? "bg-secondary-100 text-secondary-800 dark:bg-secondary/20 dark:text-secondary-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/80"
          }`}
        >
          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || "N/A"}
        </span>
      ),
    },
    {
      key: "isFeatured",
      header: "FEATURED",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            item.isFeatured
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
      header: "POPULAR",
      headerClassName: "text-center",
      cellClassName: "text-center",
      width: "80px",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            item.isPopular
              ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-slate-800/70 dark:text-white/70"
          }`}
        >
          {item.isPopular ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-48 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-96 animate-pulse"></div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
        <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-25 animate-pulse"></div>
      </div>
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors duration-300">
        <div className="bg-gray-50 dark:bg-slate-900/60 p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="grid grid-cols-[60px_350px_200px_100px_80px_120px_140px_140px_100px_80px_80px_80px_80px_80px] gap-4">
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
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`p-3 ${i < 7 ? "border-b border-gray-200 dark:border-slate-800" : ""}`}>
            <div className="grid grid-cols-[60px_350px_200px_100px_80px_120px_140px_140px_100px_80px_80px_80px_80px_80px] gap-4 items-center">
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
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Removed early return for LoadingSkeleton to prevent full-page jitter, ApnaTable handles its own loading state.
  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Country Master
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Manage all study destinations and their detailed information
        </p>
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-6 gap-3 md:grid-cols-12 xl:flex xl:items-center xl:justify-between">
          <div className="relative col-span-4 min-w-0 w-full md:col-span-4 xl:col-auto xl:w-72 xl:shrink-0">
            <svg
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search countries..."
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
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="contents xl:flex xl:flex-1 xl:items-center xl:gap-2 xl:flex-nowrap">
            <ApnaSelect
              title=""
              options={[
                { value: "all", label: "All Countries" },
                { value: "featured", label: "Featured" },
                { value: "popular", label: "Popular" },
              ]}
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
              placeholder="Select type"
              searchable={false}
              required={false}
              className="col-span-3 col-start-1 row-start-2 min-w-0 w-full md:col-span-3 md:row-start-auto xl:col-auto xl:w-40"
              buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors flex items-center justify-between text-left cursor-pointer"
            />

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
              className="col-span-3 col-start-4 row-start-2 min-w-0 w-full md:col-span-2 md:col-start-auto md:row-start-auto xl:col-auto xl:w-auto"
              buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors flex items-center justify-between text-left cursor-pointer"
            />
          </div>

          <Link
            href="/admin/country/add"
            className="col-span-2 col-start-5 row-start-1 flex w-auto shrink-0 justify-self-end items-center gap-1 whitespace-nowrap bg-primary hover:bg-primary-700 text-white px-3 py-2 rounded text-xs font-medium transition-colors no-underline md:col-span-2 md:col-start-11 md:row-start-auto xl:col-auto xl:justify-self-auto xl:py-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Country
          </Link>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary/15 border border-primary-200 dark:border-primary/30 rounded-lg transition-colors">
          <p className="text-sm text-primary-800 dark:text-primary-100">
            <span className="font-semibold">{selectedItems.length}</span> item(s) selected
            <button
              onClick={() => setSelectedItems([])}
              className="ml-4 text-primary hover:text-primary-800 dark:text-primary-200 dark:hover:text-primary-100 underline text-xs"
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      <ApnaTable
        data={countries}
        columns={columns}
        loading={loading}
        showSearch={false}
        showPagination={true}
        itemsPerPage={parseInt(filters.limit, 10) || 100}
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
        emptyMessage="No countries found"
        showSerialNumbers={true}
        showCheckboxes={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onPageChange={handlePageChange}
        searchKeys={["name", "shortName", "code", "capital"]}
      />
    </div>
  );
}
