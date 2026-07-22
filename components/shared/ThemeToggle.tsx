"use client";

import type { HTMLAttributes } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineDesktopComputer,
  HiOutlineMoon,
  HiOutlineSun,
  HiCheck,
} from "react-icons/hi";
import { cn } from "@/lib/utils";

type ThemePreference = "light" | "dark" | "system";

interface ThemeToggleProps extends HTMLAttributes<HTMLDivElement> {
  allowSystem?: boolean;
  size?: "sm" | "md" | "lg";
  onThemeChange?: (theme: ThemePreference) => void;
}

const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const sizeStyles: Record<NonNullable<ThemeToggleProps["size"]>, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-base",
  lg: "h-10 w-10 text-lg",
};

const iconStyles: Record<NonNullable<ThemeToggleProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // If localStorage is unavailable (e.g. privacy mode), fall back to system preference.
  }

  return "system";
}

function applyThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  const root = window.document.documentElement;
  const media = window.matchMedia(MEDIA_QUERY);

  const setDark = (value: boolean) => {
    root.classList.toggle("dark", value);
    root.dataset.theme = value ? "dark" : "light";
  };

  if (preference === "dark") {
    setDark(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dark");
    } catch {
      /* ignore */
    }
    return;
  }

  if (preference === "light") {
    setDark(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "light");
    } catch {
      /* ignore */
    }
    return;
  }

  // System preference
  const prefersDark = media.matches;
  setDark(prefersDark);
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const themeOptions: {
  value: ThemePreference;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "light", label: "Light", icon: <HiOutlineSun /> },
  { value: "dark", label: "Dark", icon: <HiOutlineMoon /> },
  { value: "system", label: "System", icon: <HiOutlineDesktopComputer /> },
];

export default function ThemeToggle({
  allowSystem = true,
  size = "md",
  className,
  onThemeChange,
  ...divProps
}: ThemeToggleProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableOptions = allowSystem
    ? themeOptions
    : themeOptions.filter((opt) => opt.value !== "system");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    applyThemePreference(theme);
  }, [theme, isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (theme !== "system") {
      return;
    }

    const media = window.matchMedia(MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      window.document.documentElement.classList.toggle("dark", event.matches);
      window.document.documentElement.dataset.theme = event.matches
        ? "dark"
        : "light";
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme, isMounted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = useCallback(
    (selectedTheme: ThemePreference) => {
      setTheme(selectedTheme);
      setIsOpen(false);
      if (onThemeChange) {
        onThemeChange(selectedTheme);
      }
    },
    [onThemeChange]
  );

  const activeIconClass = iconStyles[size];
  const currentOption =
    themeOptions.find((opt) => opt.value === theme) || themeOptions[0];

  if (!isMounted) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800/80 animate-pulse",
          sizeStyles[size],
          className
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={cn("relative inline-block", className)}
      {...divProps}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-200 shadow-sm",
          sizeStyles[size]
        )}
        aria-label="Select theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span
          className={cn(activeIconClass, "flex items-center justify-center")}
        >
          {currentOption.icon}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-1 z-[140] w-40 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg focus:outline-none">
            <div className="py-1" role="menu" aria-orientation="vertical">
              {availableOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-150",
                    theme === option.value
                      ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 font-medium"
                      : "text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-slate-800"
                  )}
                  role="menuitem"
                >
                  <span className={iconStyles[size]}>{option.icon}</span>
                  <span className="flex-1 text-left">{option.label}</span>
                  {theme === option.value && (
                    <HiCheck className={cn(iconStyles[size], "text-primary")} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
