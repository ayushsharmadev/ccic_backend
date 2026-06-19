"use client";

import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getSystemTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const baseConfig = {
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Notification types with compact styling
const notificationTypes = {
  success: {
    icon: "✓",
    bgColor: "bg-green-500",
    textColor: "text-white",
    borderColor: "border-green-400",
    iconColor: "#16a34a",
  },
  error: {
    icon: "✕",
    bgColor: "bg-red-500",
    textColor: "text-white",
    borderColor: "border-red-400",
    iconColor: "#dc2626",
  },
  warning: {
    icon: "⚠",
    bgColor: "bg-yellow-500",
    textColor: "text-white",
    borderColor: "border-yellow-400",
    iconColor: "#eab308",
  },
  info: {
    icon: "ℹ",
    bgColor: "bg-blue-500",
    textColor: "text-white",
    borderColor: "border-blue-400",
    iconColor: "#2563eb",
  },
};

/**
 * Show a notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (optional)
 * @param {object} customOptions - Custom toast options (optional)
 */
export const showNotification = (
  message,
  type = "info",
  duration,
  customOptions = {}
) => {
  const typeConfig = notificationTypes[type] || notificationTypes.info;

  // Merge custom options with defaults
  const options = {
    ...baseConfig,
    autoClose: duration || baseConfig.autoClose,
    theme: getSystemTheme(),
    ...customOptions,
  };

  // Create custom toast content with compact design
  const toastContent = (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor} border shadow-md`}
    >
      <div
        className="shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-sm"
        style={{ color: typeConfig.iconColor }}
      >
        {typeConfig.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );

  // Show toast based on type
  switch (type) {
    case "success":
      return toast.success(toastContent, options);
    case "error":
      return toast.error(toastContent, options);
    case "warning":
      return toast.warn(toastContent, options);
    case "info":
    default:
      return toast.info(toastContent, options);
  }
};

/**
 * Show success notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (optional)
 * @param {object} options - Custom options (optional)
 */
export const showSuccess = (message, duration, options) => {
  return showNotification(message, "success", duration, options);
};

/**
 * Show error notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (optional)
 * @param {object} options - Custom options (optional)
 */
export const showError = (message, duration, options) => {
  return showNotification(message, "error", duration, options);
};

/**
 * Show warning notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (optional)
 * @param {object} options - Custom options (optional)
 */
export const showWarning = (message, duration, options) => {
  return showNotification(message, "warning", duration, options);
};

/**
 * Show info notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds (optional)
 * @param {object} options - Custom options (optional)
 */
export const showInfo = (message, duration, options) => {
  return showNotification(message, "info", duration, options);
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  toast.dismiss();
};

/**
 * Clear specific notification by ID
 * @param {string|number} toastId - The toast ID to dismiss
 */
export const clearNotification = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * ApnaNotify Container Component
 * This component should be placed at the root level of your app
 * to provide the toast container for all notifications
 */
export default function ApnaNotify() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(getSystemTheme());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      setTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);

    // Add custom CSS for compact styling
    const style = document.createElement("style");
    style.textContent = `
      .Toastify__toast-container {
        max-width: 400px;
        padding: 0;
        right: 1rem;
      }
      
      .Toastify__toast {
        font-family: inherit;
        border-radius: 0.5rem;
        min-height: auto;
        padding: 0;
        display: block;
        background: transparent;
        overflow: hidden;
      }
      
      .Toastify__toast-body {
        padding: 0;
        margin: 0;
        font-size: 14px;
      }
      
      .Toastify__progress-bar {
        height: 3px;
        border-radius: 0 0 0.5rem 0.5rem;
      }
      
      .Toastify__progress-bar--success {
        background: #fff;
      }
      
      .Toastify__progress-bar--error {
        background: #fff;
      }
      
      .Toastify__progress-bar--warning {
        background: #fff;
      }
      
      .Toastify__progress-bar--info {
        background: #fff;
      }
      
      .Toastify__close-button {
        color: rgba(255, 255, 255, 0.8);
        opacity: 0.8;
        transition: all 0.2s ease;
        font-size: 16px;
        font-weight: bold;
        padding: 2px;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: flex-start;
        margin: 4px;
        display: none;
      }
      
      .Toastify__close-button:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
      
      .Toastify__toast-icon {
        display: none;
      }

      /* Smooth animations */
      .Toastify__toast--enter {
        transform: translateX(100%);
        opacity: 0;
      }
      
      .Toastify__toast--enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: all 0.3s ease-out;
      }
      
      .Toastify__toast--exit {
        transform: translateX(0);
        opacity: 1;
      }
      
      .Toastify__toast--exit-active {
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.2s ease-in;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      closeButton={true}
      limit={3}
      stacked={false}
    />
  );
}

// Export all functions for easy access
export {
  showNotification,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  clearAllNotifications,
  clearNotification,
};
