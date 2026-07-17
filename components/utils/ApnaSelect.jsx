"use client";

import { useState, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";

function OptionalPortal({ enabled, children }) {
  if (enabled && typeof document !== "undefined") return createPortal(children, document.body);
  return children;
}

export default function ApnaSelect({
  title = "Select Option",
  options = [],
  value = null,
  onChange,
  placeholder = "Choose an option",
  searchable = false,
  multiple = false,
  disabled = false,
  className = "",
  required = false,
  error = "",
  buttonClassName = "",
  labelClassName = "",
  textClassName = "",
  portal = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState(
    multiple ? (Array.isArray(value) ? value : []) : value
  );
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const portalDropdownRef = useRef(null);
  const [portalStyle, setPortalStyle] = useState({});
  const id = useId();

  useEffect(() => {
    setSelectedValues(multiple ? (Array.isArray(value) ? value : []) : value);
  }, [value, multiple]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !portalDropdownRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    searchable && searchTerm
      ? option.label.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const handleSelect = (option) => {
    if (multiple) {
      // Ensure selectedValues is always an array
      const currentValues = Array.isArray(selectedValues) ? selectedValues : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value];

      console.log(
        "Multi-select - Current:",
        currentValues,
        "New:",
        newValues,
        "Option:",
        option
      );
      setSelectedValues(newValues);
      if (onChange) onChange(newValues);
    } else {
      setSelectedValues(option.value);
      if (onChange) onChange(option.value);
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      if (!selectedValues || selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = options.find((opt) => opt.value === selectedValues[0]);
        return option ? option.label : `${selectedValues.length} selected`;
      }
      return `${selectedValues.length} selected`;
    } else {
      if (!selectedValues) return placeholder;
      const option = options.find((opt) => opt.value === selectedValues);
      return option ? option.label : placeholder;
    }
  };

  const isSelected = (optionValue) => {
    return multiple
      ? selectedValues && selectedValues.includes(optionValue)
      : selectedValues === optionValue;
  };

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen && portal && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setPortalStyle({ top: rect.bottom + 2, left: rect.left, width: rect.width });
      }
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  };

  return (
    <div className={className}>
      {title && (
        <label
          htmlFor={id}
          className={
            labelClassName ||
            "text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block"
          }
        >
          {title} {required && <span className="text-secondary">*</span>}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Main Select Button */}
        <button
          id={id}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={
            buttonClassName ||
            `w-full px-2 py-1.5 rounded text-xs text-left flex items-center justify-between outline-none transition-all duration-200 ${
              error
                ? "border border-secondary"
                : "border border-gray-300 dark:border-slate-600 focus:border-primary focus:ring-2 focus:ring-primary-50"
            } ${
              disabled
                ? "bg-gray-50 text-gray-400 dark:bg-slate-800/70 dark:text-slate-500 cursor-not-allowed"
                : "bg-white text-gray-700 dark:bg-slate-800 dark:text-white cursor-pointer"
            }`
          }
        >
          <span
            className={
              textClassName ||
              `overflow-hidden text-ellipsis whitespace-nowrap ${
                (!multiple && !selectedValues) ||
                (multiple && (!selectedValues || selectedValues.length === 0))
                  ? "text-gray-400 dark:text-slate-400"
                  : "text-gray-700 dark:text-white"
              }`
            }
          >
            {getDisplayText()}
          </span>
          <svg
            className={`w-3.5 h-3.5 ml-2 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <OptionalPortal enabled={portal}>
          <div ref={portal ? portalDropdownRef : null} style={portal ? portalStyle : undefined} className={`${portal ? "fixed z-[100]" : "absolute top-full left-0 right-0 z-50 mt-0.5"} bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded shadow-lg max-h-48 overflow-y-auto`}>
            {/* Search Input */}
            {searchable && (
              <div className="p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-1.5 py-1 border border-gray-300 dark:border-slate-600 rounded-sm text-xs outline-none focus:border-primary bg-white dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Options */}
            <div>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500 text-center">
                  {searchTerm ? "No results found" : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3 py-1.5 border-none text-xs text-left cursor-pointer flex items-center justify-between outline-none hover:bg-gray-100 dark:hover:bg-slate-800 ${
                      isSelected(option.value)
                        ? "bg-primary-50 dark:bg-emerald-600/20"
                        : "bg-transparent"
                    }`}
                  >
                    <span className="text-gray-700 dark:text-white">
                      {option.label}
                    </span>
                    {multiple && (
                      <div
                        className={`w-3.5 h-3.5 border border-gray-300 dark:border-slate-600 rounded-sm flex items-center justify-center ${
                          isSelected(option.value)
                            ? "bg-primary"
                            : "bg-white dark:bg-slate-900"
                        }`}
                      >
                        {isSelected(option.value) && (
                          <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          </OptionalPortal>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-secondary dark:text-secondary mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
