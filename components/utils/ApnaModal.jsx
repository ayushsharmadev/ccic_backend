"use client";

import { useEffect, useRef } from "react";

/**
 * ApnaModal - Reusable Modal Component with Glass Effect
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Function called when modal closes
 * @param {function} onSubmit - Function called when submit button is clicked
 * @param {string} title - Modal title
 * @param {React.ReactNode} children - Modal body content
 * @param {string} submitText - Submit button text (default: "Submit")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {string} size - Modal size: "sm", "md", "lg", "xl" (default: "md")
 * @param {boolean} showFooter - Whether to show footer buttons (default: true)
 * @param {boolean} submitDisabled - Whether submit button is disabled (default: false)
 */
export default function ApnaModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Submit",
  cancelText = "Cancel",
  size = "md",
  showFooter = true,
  submitDisabled = false,
}) {
  const modalRef = useRef(null);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
    "3xl": "max-w-6xl",
    "4xl": "max-w-7xl",
  };

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!submitDisabled) {
      onSubmit();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      style={{
        visibility: isOpen ? "visible" : "hidden",
      }}
    >
      {/* Backdrop with glass effect */}
      <div
        className={`absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleOutsideClick}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`relative w-full max-h-[90vh] ${
          sizeClasses[size]
        } bg-white dark:bg-slate-900 rounded-xl shadow-2xl dark:shadow-none border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ease-out transform ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Header */}
        <div
          className={`text-white px-6 py-2 transition-all duration-300 ease-out transform ${
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
          style={{
            background:
              "linear-gradient(to right, var(--primary), var(--primary-900))",
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-md font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 group hover:scale-110 active:scale-95"
              title="Close"
            >
              <svg
                className="w-5 h-5 text-white"
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
          </div>
        </div>

        {/* Body */}
        <div
          className={`bg-gray-50 dark:bg-slate-900 transition-all duration-300 ease-out transform ${
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-700 shadow-sm max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Footer */}
        {showFooter && (
          <div
            className={`bg-gray-100 dark:bg-slate-800 px-6 py-2 border-t border-gray-200 dark:border-slate-700 transition-all duration-300 ease-out transform ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white hover:bg-secondary-50 dark:hover:bg-secondary/20 hover:border-secondary hover:text-secondary transition-all duration-200 font-medium text-sm hover:scale-105 active:scale-95"
              >
                {cancelText}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="px-6 py-2 rounded-lg text-white disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:shadow-none hover:scale-105 active:scale-95"
                style={{
                  background: submitDisabled
                    ? "linear-gradient(to right, #9ca3af, #6b7280)"
                    : "linear-gradient(to right, var(--primary), var(--primary-900))",
                }}
                onMouseEnter={(e) => {
                  if (!submitDisabled) {
                    e.target.style.background =
                      "linear-gradient(to right, var(--primary-800), var(--primary-900))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitDisabled) {
                    e.target.style.background =
                      "linear-gradient(to right, var(--primary), var(--primary-900))";
                  }
                }}
              >
                {submitText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
