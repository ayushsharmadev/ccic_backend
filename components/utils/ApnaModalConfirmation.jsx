"use client";

import { useState, useEffect } from "react";

const ApnaModalConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonColor = "red", // red, blue, green, yellow, gray
  cancelButtonColor = "bg-gray-500 hover:bg-gray-600",
  icon = "warning", // warning, danger, info, success
  size = "md", // sm, md, lg
  showCloseButton = true,
  closeOnOverlayClick = true,
  loading = false,
  loadingText = "Processing...",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = "unset";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && !loading) {
      handleClose();
    }
  };

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const getIcon = () => {
    switch (icon) {
      case "danger":
        return (
          <svg
            className="w-12 h-12 text-secondary dark:text-secondary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-12 h-12 text-secondary dark:text-secondary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="w-12 h-12 text-primary dark:text-primary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "success":
        return (
          <svg
            className="w-12 h-12 text-primary dark:text-primary-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-12 h-12 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "max-w-md";
      case "lg":
        return "max-w-2xl";
      default:
        return "max-w-lg";
    }
  };

  const getConfirmButtonClasses = () => {
    switch (confirmButtonColor) {
      case "red":
        return "bg-secondary hover:bg-secondary-700";
      case "blue":
        return "bg-primary hover:bg-primary-700";
      case "green":
        return "bg-primary-600 hover:bg-primary-700";
      case "yellow":
        return "bg-secondary-600 hover:bg-secondary-700";
      case "gray":
        return "bg-gray-600 hover:bg-gray-700";
      default:
        return "bg-secondary hover:bg-secondary-700";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 transition-all duration-300 ${
          isAnimating ? "bg-black/50 dark:bg-black/60" : "bg-black/0"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${getSizeClasses()} transform transition-all duration-200 ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-2xl dark:shadow-none border border-gray-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {getIcon()}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                </div>
              </div>
              {showCloseButton && !loading && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-white/80 leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={handleClose}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-secondary hover:bg-secondary-700"
                }`}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : getConfirmButtonClasses()
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{loadingText}</span>
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApnaModalConfirmation;
