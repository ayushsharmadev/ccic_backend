"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  HiMenu,
  HiSearch,
  HiBell,
  HiChevronDown,
  HiUser,
  HiKey,
  HiLogout,
  HiMicrophone,
} from "react-icons/hi";
import {
  HiAcademicCap,
  HiBookOpen,
  HiDocumentText,
  HiNewspaper,
  HiBell as HiBellIcon,
  HiMapPin,
  HiLink,
  HiBars3,
  HiGlobe,
  HiChatBubbleLeftRight,
  HiStar,
  HiLanguage,
  HiArrowsPointingOut,
} from "react-icons/hi2";
import ThemeToggle from "@/components/shared/ThemeToggle";
import VoiceSearchModal from "./VoiceSearchModal";

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      setIsVoiceSupported(!!SpeechRecognition);
    }
  }, []);

  // Update avatar version when user avatar changes
  useEffect(() => {
    if (user?.avatar) {
      setAvatarVersion((prev) => prev + 1);
    }
  }, [user?.avatar]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        !searchInputRef.current?.contains(event.target)
      ) {
        setIsSearchOpen(false);
      }
    }

    if (profileOpen || isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileOpen, isSearchOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && !isVoiceModalOpen) {
        performSearch(searchQuery);
      } else if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isVoiceModalOpen]);

  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setIsSearching(false);
        return;
      }

      const response = await fetch(
        `/api/admin/search?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results || []);
        setIsSearchOpen(data.data.results?.length > 0);
      } else {
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
      setIsSearchOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

  const getResultIcon = (type) => {
    const iconClass = "h-4 w-4 text-gray-400 dark:text-white/40";
    switch (type) {
      case "college":
        return <HiAcademicCap className={iconClass} />;
      case "user":
        return <HiUser className={iconClass} />;
      case "course":
        return <HiBookOpen className={iconClass} />;
      case "exam":
        return <HiDocumentText className={iconClass} />;
      case "news":
        return <HiNewspaper className={iconClass} />;
      case "blog":
        return <HiDocumentText className={iconClass} />;
      case "page":
        return <HiDocumentText className={iconClass} />;
      case "testimonial":
        return <HiChatBubbleLeftRight className={iconClass} />;
      case "review":
        return <HiStar className={iconClass} />;
      case "language":
        return <HiLanguage className={iconClass} />;
      case "distance-meter":
        return <HiArrowsPointingOut className={iconClass} />;
      case "notice":
        return <HiBellIcon className={iconClass} />;
      case "state":
      case "district":
        return <HiMapPin className={iconClass} />;
      case "footer-section":
        return <HiLink className={iconClass} />;
      case "menu":
        return <HiBars3 className={iconClass} />;
      default:
        return <HiSearch className={iconClass} />;
    }
  };

  const handleResultClick = (url) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  const handleVoiceSearchClick = (url) => {
    setIsVoiceModalOpen(false);
    router.push(url);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.fullName) {
      return user.fullName;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.username) {
      return user.username;
    }
    return "User";
  };

  return (
    <div className="flex h-16 shrink-0 items-center gap-x-2 sm:gap-x-4 border-b border-gray-200/50 dark:border-slate-800 bg-linear-to-r from-white via-white to-gray-50/30 dark:from-slate-950 dark:via-slate-900/95 dark:to-slate-900/80 px-4 sm:px-6 shadow-sm backdrop-blur-sm transition-colors duration-300">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-white/80 hover:text-primary dark:hover:text-primary hover:bg-primary-50 dark:hover:bg-primary/15 rounded-lg transition-all lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <HiMenu className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-900/10 dark:bg-white/10 lg:hidden" />

      {/* Search - Left side */}
      <div className="flex flex-1 items-center" ref={searchRef}>
        <div className="relative flex max-w-xs sm:max-w-md w-full">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="relative w-full">
            <HiSearch className="pointer-events-none absolute inset-y-0 left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40" />
            <input
              ref={searchInputRef}
              id="search-field"
              className="block h-10 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/70 py-2 pl-10 pr-[68px] text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Search..."
              type="search"
              name="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setIsSearchOpen(true);
                }
              }}
              onFocus={() => {
                if (
                  searchQuery.trim().length >= 2 &&
                  searchResults.length > 0
                ) {
                  setIsSearchOpen(true);
                }
              }}
            />
            <div className="absolute inset-y-0 right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="p-1.5 rounded-full transition-all text-gray-400 dark:text-white/40 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0"
                  title="Start voice search"
                >
                  <HiMicrophone className="h-4 w-4" />
                </button>
              )}
              {isSearching && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 dark:border-white/40 border-t-primary shrink-0"></div>
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-96 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full flex items-start gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                    >
                      <div className="shrink-0 mt-0.5">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/60 truncate">
                          {result.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isSearching && searchQuery.trim().length >= 2 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    No results found
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Notifications and Profile */}
      <div className="flex items-center gap-x-3 lg:gap-x-4">
        <ThemeToggle
          size="sm"
          className="hidden sm:inline-flex bg-transparent shadow-none text-gray-600 dark:text-white/80 hover:bg-gray-100/60 dark:hover:bg-slate-800/70 focus:ring-primary/30"
        />
        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <span className="sr-only">Open user menu</span>
            {user?.avatar ? (
              <img
                src={`${user.avatar}?v=${avatarVersion}`}
                alt={getUserDisplayName()}
                className="h-9 w-9 rounded-full object-cover shadow-lg ring-2 ring-white dark:ring-slate-900"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--primary-900))",
                }}
              >
                <span className="text-sm font-bold text-white">
                  {getUserInitials()}
                </span>
              </div>
            )}
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-3 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                {getUserDisplayName()}
              </span>
              <HiChevronDown
                className={`ml-2 h-4 w-4 text-gray-400 dark:text-white/50 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-900/95 py-2 shadow-xl ring-1 ring-black/5 dark:ring-white/5 backdrop-blur-sm transition-all duration-200 ease-out opacity-100 scale-100">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800/80">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/60 truncate">
                  {user?.email || "No email"}
                </p>
                <p className="text-xs text-primary dark:text-primary-300 font-medium capitalize mt-1">
                  {user?.role || "User"}
                </p>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 dark:border-slate-800/80 bg-gray-50/70 dark:bg-slate-900/60 px-3 py-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-white/70">
                    Appearance
                  </span>
                  <ThemeToggle
                    size="sm"
                    className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-none"
                  />
                </div>
              </div>

              <div className="py-1">
                <a
                  href="/admin/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white/80 hover:bg-primary-50 dark:hover:bg-primary/15 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  <HiUser className="mr-3 h-4 w-4" />
                  My Profile
                </a>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-800/80 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-secondary dark:text-rose-200 hover:bg-secondary-50 dark:hover:bg-rose-500/15 hover:text-secondary-700 dark:hover:text-rose-200 transition-colors"
                >
                  <HiLogout className="mr-3 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <VoiceSearchModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSearch={handleVoiceSearchClick}
      />
    </div>
  );
}
