"use client";

import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";

/**
 * PublicModal - A modern, sleek modal component for public pages
 * Features:
 * - Modern glass morphism design
 * - Smooth animations with scale and fade
 * - Clean, minimal header
 * - Responsive sizing
 * - Backdrop blur with gradient overlay
 * - Color themes: primary, secondary, orange
 */
export default function PublicModal({
  isOpen = false,
  onClose,
  title = "",
  children,
  color = "primary", // primary, secondary, orange
  showCloseButton = true,
  footerContent = null,
  headerContent = null,
  className = "",
  overlayClassName = "",
  contentClassName = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  isCopy = false,
  showFooter = true,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Color configurations
  const colorConfig = {
    primary: {
      headerBg: "bg-gradient-to-r from-primary to-primary/90",
      headerText: "text-white",
      footerBg: "bg-gradient-to-r from-primary to-primary/90",
      footerText: "text-white",
      borderColor: "border-primary/20",
      accentColor: "text-primary",
    },
    secondary: {
      headerBg: "bg-gradient-to-r from-secondary to-secondary/90",
      headerText: "text-white",
      footerBg: "bg-gradient-to-r from-secondary to-secondary/90",
      footerText: "text-white",
      borderColor: "border-secondary/20",
      accentColor: "text-secondary",
    },
    orange: {
      headerBg: "bg-gradient-to-r from-orange-500 to-orange-600",
      headerText: "text-white",
      footerBg: "bg-gradient-to-r from-orange-500 to-orange-600",
      footerText: "text-white",
      borderColor: "border-orange-500/20",
      accentColor: "text-orange-600",
    },
  };

  const currentColor = colorConfig[color] || colorConfig.primary;

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflowY = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflowY = "auto";
    };
  }, [isOpen, onClose]);

  // Handle outside click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  if (!isVisible) return null;

  const hasHeader = Boolean(title || headerContent || showCloseButton);
  const headerHeight = hasHeader ? 56 : 0;
  const footerHeight = showFooter ? 56 : 0;
  const bodyMaxHeight = `calc(90vh - ${headerHeight + footerHeight}px)`;
  const shouldRenderCustomFooter = showFooter && Boolean(footerContent);
  const shouldRenderDefaultFooter = showFooter && !footerContent;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      {/* Modern Gradient Overlay with Blur */}
      <div
        className={`absolute inset-0 bg-linear-to-br from-black/50 via-black/40 to-black/50 dark:from-black/70 dark:via-black/60 dark:to-black/70 backdrop-blur-md transition-all duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border ${
          currentColor.borderColor
        } 
          w-[90vw] max-w-7xl max-h-[90vh] flex flex-col transition-all duration-300 transform ${
            isAnimating
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-8 scale-95 opacity-0"
          } ${className} ${contentClassName}`}
        style={{ minWidth: "280px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasHeader && (
          <div
            className={`${currentColor.headerBg} ${currentColor.headerText} px-5 py-3 rounded-t-2xl 
              flex items-center justify-between shrink-0 relative ${headerClassName}`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {headerContent || (
                <h3 className="text-lg font-bold truncate tracking-tight">
                  {title}
                </h3>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-lg transition-all hover:bg-white/20 hover:scale-110 
                  focus:outline-none focus:ring-2 focus:ring-white/30 shrink-0 active:scale-95 z-10"
                aria-label="Close modal"
              >
                <HiX className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={`flex-1 overflow-auto ${bodyClassName}`}
          style={{
            maxHeight: bodyMaxHeight,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {shouldRenderCustomFooter && (
          <div
            className={`${currentColor.footerBg} ${currentColor.footerText} px-6 py-4 rounded-b-2xl 
              flex items-center justify-end gap-3 shrink-0 ${footerClassName}`}
          >
            {footerContent}
          </div>
        )}

        {/* Default Footer with Close Button */}
        {shouldRenderDefaultFooter && (
          <div
            className={`bg-gray-50 dark:bg-slate-800/50 px-6 py-4 rounded-b-2xl 
              flex items-center justify-end gap-3 shrink-0 border-t border-gray-200 dark:border-slate-700/50 backdrop-blur-sm ${footerClassName}`}
          >
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 
                rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 
                transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export convenience components for different colors
export const PrimaryModal = (props) => (
  <PublicModal {...props} color="primary" />
);
export const SecondaryModal = (props) => (
  <PublicModal {...props} color="secondary" />
);
export const OrangeModal = (props) => <PublicModal {...props} color="orange" />;

// Export hook for modal state management
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(!isOpen);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};
