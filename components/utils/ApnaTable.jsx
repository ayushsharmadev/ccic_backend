"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function ApnaTable({
  // Data props
  data = [],
  columns = [],

  // Search props
  showSearch = true,
  searchPlaceholder = "Search...",
  searchKeys = [], // Array of keys to search in

  // Pagination props
  showPagination = true,
  itemsPerPage = 10,
  maxPageButtons = 5,
  totalItems = 0, // Total items from server
  totalPages = 0, // Total pages from server
  currentPage = 1, // Current page from parent

  // Selection props
  showSerialNumbers = true,
  showCheckboxes = false,
  selectedItems = [],
  onSelectionChange = null, // Function called when selection changes
  onSelectAll = null, // Function called when select all is clicked

  // Customization props
  className = "",
  tableClassName = "",
  headerClassName = "",
  rowClassName = "",
  searchClassName = "",
  paginationClassName = "",

  // Action props
  actions = null, // Function to render actions
  onRowClick = null, // Function called when row is clicked
  onPageChange = null, // Function called when page changes (for API calls)

  // Loading state
  loading = false,
  loadingSkeleton = null, // Custom loading skeleton

  // Empty state
  emptyMessage = "No data found",
  emptyIcon = null,

  // Styling props
  striped = false,
  hover = true,
  bordered = true,
  compact = false,

  // Header props
  showHeader = true,
  stickyHeader = false,

  // Footer props
  showFooter = false,
  footerContent = null,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // For server-side pagination, use data directly (no client-side filtering/pagination)
  const paginatedData = data;

  // Selection logic (after paginatedData is defined)
  const allItemsSelected = useMemo(() => {
    if (!showCheckboxes || paginatedData.length === 0) return false;
    return paginatedData.every((item) => selectedItems.includes(item.id));
  }, [showCheckboxes, paginatedData, selectedItems]);

  const someItemsSelected = useMemo(() => {
    if (!showCheckboxes || selectedItems.length === 0) return false;
    return (
      paginatedData.some((item) => selectedItems.includes(item.id)) &&
      !allItemsSelected
    );
  }, [showCheckboxes, paginatedData, selectedItems, allItemsSelected]);

  const handleSelectAll = () => {
    if (!onSelectAll) return;

    const currentPageIds = paginatedData.map((item) => item.id);
    const allSelected = allItemsSelected;

    onSelectAll(currentPageIds, allSelected);
  };

  const handleSelectItem = (itemId) => {
    if (!onSelectionChange) return;

    const isSelected = selectedItems.includes(itemId);
    const newSelectedItems = isSelected
      ? selectedItems.filter((id) => id !== itemId)
      : [...selectedItems, itemId];

    onSelectionChange(newSelectedItems);
  };

  // Calculate pagination (server-side only)
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const halfButtons = Math.floor(maxPageButtons / 2);

    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, currentPage + halfButtons);

    if (endPage - startPage + 1 < maxPageButtons) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
      } else {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Handle page change
  const handlePageChange = (page) => {
    // Call onPageChange callback for API calls
    if (onPageChange) {
      onPageChange(page);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Call onPageChange callback for API calls (reset to page 1)
    if (onPageChange) {
      onPageChange(1);
    }
  };

  // Loading state
  if (loading) {
    if (loadingSkeleton) {
      return loadingSkeleton;
    }

    const skeletonRows = Math.min(Math.max(itemsPerPage || 5, 5), 10);

    return (
      <div
        className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm dark:shadow-none ${tableClassName}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            {showHeader && (
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {showCheckboxes && (
                    <th className="px-3 py-2 text-left w-10">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-slate-700"></div>
                    </th>
                  )}
                  {showSerialNumbers && (
                    <th className="px-3 py-2 text-left w-16">
                      <div className="h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-slate-700"></div>
                    </th>
                  )}
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-3 py-2"
                      style={column.width ? { width: column.width } : {}}
                    >
                      <div className="h-4 w-20 max-w-full animate-pulse rounded bg-gray-200 dark:bg-slate-700"></div>
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {[...Array(skeletonRows)].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {showCheckboxes && (
                    <td className="px-3 py-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-slate-700"></div>
                    </td>
                  )}
                  {showSerialNumbers && (
                    <td className="px-3 py-2">
                      <div className="h-4 w-8 animate-pulse rounded bg-gray-200 dark:bg-slate-700"></div>
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-3 py-2"
                      style={column.width ? { width: column.width } : {}}
                    >
                      <div
                        className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-slate-700 ${
                          colIndex === 0
                            ? "w-44"
                            : colIndex === 1
                            ? "w-32"
                            : "w-20"
                        } max-w-full`}
                      ></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (paginatedData.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center ${tableClassName}`}
      >
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p className="text-gray-500 dark:text-white/70 text-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar */}
      {showSearch && (
        <div className={`mb-4 ${searchClassName}`}>
          <div className="relative w-60">
            <svg
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
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
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm dark:shadow-none ${tableClassName}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            {/* Table Header */}
            {showHeader && (
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {/* Checkbox Header */}
                  {showCheckboxes && (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase tracking-wide w-10">
                      <input
                        type="checkbox"
                        checked={allItemsSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someItemsSelected;
                        }}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                        }}
                        className="w-4 h-4 text-primary bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded focus:ring-primary focus:ring-2"
                      />
                    </th>
                  )}

                  {/* Serial Number Header */}
                  {showSerialNumbers && (
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-white uppercase tracking-wide w-16">
                      S.No
                    </th>
                  )}

                  {/* Regular Columns */}
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-3 py-2 text-xs font-semibold text-gray-700 dark:text-white uppercase tracking-wide whitespace-nowrap ${
                        column.headerClassName || ""
                      }`}
                      style={column.width ? { width: column.width } : {}}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            {/* Table Body */}
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
              {paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`${
                    bordered && index < paginatedData.length - 1
                      ? "border-b border-gray-200 dark:border-slate-700"
                      : ""
                  } ${
                    striped && index % 2 === 1
                      ? "bg-gray-50 dark:bg-slate-800"
                      : ""
                  } ${
                    hover
                      ? "hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      : ""
                  } ${onRowClick ? "cursor-pointer" : ""} ${rowClassName}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {/* Checkbox Cell */}
                  {showCheckboxes && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item.id);
                        }}
                        className="w-4 h-4 text-primary bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 rounded focus:ring-primary focus:ring-2"
                      />
                    </td>
                  )}

                  {/* Serial Number Cell */}
                  {showSerialNumbers && (
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-white/80 font-medium text-left">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                  )}

                  {/* Regular Columns */}
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-3 py-2 whitespace-nowrap ${
                        column.cellClassName || ""
                      }`}
                      style={column.width ? { width: column.width } : {}}
                    >
                      {column.render
                        ? column.render(item, column.key)
                        : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {showFooter && (
          <div className="bg-gray-50 dark:bg-slate-800 p-3 border-t border-gray-200 dark:border-slate-700">
            {footerContent}
          </div>
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div
          className={`flex justify-between items-center mt-4 py-2 ${paginationClassName}`}
        >
          {/* Results Info */}
          <div className="shrink-0 text-xs text-gray-600 dark:text-white/70">
            <span className="sm:hidden">
              <span className="font-semibold text-gray-900 dark:text-white">
                {startItem}-{endItem}
              </span>{" "}
              / {totalItems}
            </span>
            <span className="hidden sm:inline">
              Showing{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {startItem}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {endItem}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalItems}
              </span>{" "}
              results
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2 py-1 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 cursor-pointer flex items-center gap-1 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-400 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-slate-800"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Prev
            </button>

            {/* Page Numbers */}
            <div className="flex gap-0.5">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 py-1 text-xs border rounded min-w-7 cursor-pointer transition-colors ${
                    page === currentPage
                      ? "text-white border-primary bg-primary font-medium"
                      : "text-gray-600 dark:text-white/80 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2 py-1 text-xs text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 cursor-pointer flex items-center gap-1 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-400 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-slate-800"
            >
              Next
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DEMO USAGE EXAMPLES:
 *
 * // 1. Basic Table with Serial Numbers (Default)
 * <ApnaTable
 *   data={states}
 *   columns={[
 *     { key: "name", header: "Name" },
 *     { key: "code", header: "Code" }
 *   ]}
 *   showSerialNumbers={true}
 * />
 *
 * // 2. Table with Checkboxes and Selection
 * const [selectedItems, setSelectedItems] = useState([]);
 *
 * const handleSelectionChange = (itemId) => {
 *   setSelectedItems(prev =>
 *     prev.includes(itemId)
 *       ? prev.filter(id => id !== itemId)
 *       : [...prev, itemId]
 *   );
 * };
 *
 * const handleSelectAll = (pageIds, allSelected) => {
 *   setSelectedItems(prev =>
 *     allSelected
 *       ? prev.filter(id => !pageIds.includes(id))
 *       : [...new Set([...prev, ...pageIds])]
 *   );
 * };
 *
 * <ApnaTable
 *   data={states}
 *   columns={columns}
 *   showSerialNumbers={true}
 *   showCheckboxes={true}
 *   selectedItems={selectedItems}
 *   onSelectionChange={handleSelectionChange}
 *   onSelectAll={handleSelectAll}
 * />
 *
 * // 3. Table with Search & Pagination
 * <ApnaTable
 *   data={states}
 *   columns={columns}
 *   showSearch={true}
 *   searchPlaceholder="Search states..."
 *   searchKeys={["name", "code"]}
 *   showPagination={true}
 *   itemsPerPage={8}
 *   showSerialNumbers={true}
 * />
 *
 * // 4. Table with Custom Actions
 * const columns = [
 *   { key: "name", header: "Name" },
 *   { key: "code", header: "Code" },
 *   {
 *     key: "actions",
 *     header: "Actions",
 *     render: (item) => (
 *       <div className="flex gap-2">
 *         <button onClick={() => editItem(item.id)}>Edit</button>
 *         <button onClick={() => deleteItem(item.id)}>Delete</button>
 *       </div>
 *     )
 *   }
 * ];
 *
 * // 5. Loading State
 * <ApnaTable
 *   data={states}
 *   columns={columns}
 *   loading={true}
 *   showSerialNumbers={true}
 * />
 *
 * // 6. Empty State
 * <ApnaTable
 *   data={[]}
 *   columns={columns}
 *   emptyMessage="No states found. Add your first state!"
 *   showSerialNumbers={true}
 * />
 *
 * // 7. Table with Server-side Pagination (Recommended)
 * const [currentPage, setCurrentPage] = useState(1);
 * const [totalItems, setTotalItems] = useState(0);
 * const [totalPages, setTotalPages] = useState(0);
 *
 * const handlePageChange = (page) => {
 *   setCurrentPage(page);
 *   fetchData(page);
 * };
 *
 * <ApnaTable
 *   data={states}
 *   columns={columns}
 *   showPagination={true}
 *   totalItems={totalItems}
 *   totalPages={totalPages}
 *   currentPage={currentPage}
 *   onPageChange={handlePageChange}
 *   showSerialNumbers={true}
 * />
 */
