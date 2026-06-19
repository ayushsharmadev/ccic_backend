"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { HiMicrophone, HiUser, HiSearch } from "react-icons/hi";
import {
  HiAcademicCap,
  HiBookOpen,
  HiDocumentText,
  HiNewspaper,
  HiBell as HiBellIcon,
  HiMapPin,
  HiLink,
  HiBars3,
  HiChatBubbleLeftRight,
  HiStar,
  HiLanguage,
  HiArrowsPointingOut,
} from "react-icons/hi2";

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
    case "footer-link":
      return <HiLink className={iconClass} />;
    case "menu":
      return <HiBars3 className={iconClass} />;
    default:
      return <HiSearch className={iconClass} />;
  }
};

export default function VoiceSearchModal({ isOpen, onClose, onSearch }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const queryRef = useRef("");
  const transcriptRef = useRef("");
  const lastSearchedRef = useRef("");
  const isSearchingRef = useRef(false);
  const hasSearchedRef = useRef(false);
  const shouldPreventRestartRef = useRef(false);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    const resetSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.log("Error stopping recognition:", error);
          }
        }
      }, 3000);
    };

    recognition.onstart = () => {
      if (shouldPreventRestartRef.current && hasSearchedRef.current) {
        try {
          recognitionRef.current?.stop();
        } catch (e) {}
        return;
      }

      setIsListening(true);
      if (!shouldPreventRestartRef.current) {
        hasSearchedRef.current = false;
      }
      transcriptRef.current = "";
      setTranscript("");
      resetSilenceTimeout();
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      resetSilenceTimeout();

      if (finalTranscript) {
        queryRef.current = (queryRef.current + finalTranscript).trim();
        transcriptRef.current = "";
        setSearchQuery(queryRef.current);
        setTranscript("");
      } else {
        transcriptRef.current = interimTranscript;
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access.");
        onClose();
      } else if (event.error === "network") {
        alert("Network error. Please check your connection.");
      } else if (event.error === "aborted") {
        setIsListening(false);
        setTranscript("");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      transcriptRef.current = "";
      setTranscript("");

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      const finalQuery = (queryRef.current + transcriptRef.current).trim();
      if (finalQuery) {
        queryRef.current = finalQuery;
        setSearchQuery(finalQuery);
      }

      if (
        finalQuery.length >= 2 &&
        finalQuery.toLowerCase() !== lastSearchedRef.current &&
        !isSearchingRef.current &&
        !hasSearchedRef.current &&
        !shouldPreventRestartRef.current
      ) {
        hasSearchedRef.current = true;
        shouldPreventRestartRef.current = true;

        try {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        } catch (e) {}

        performSearch(finalQuery);
        return;
      }

      if (shouldPreventRestartRef.current || hasSearchedRef.current) {
        try {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        } catch (e) {}
        return;
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      if (error.message && error.message.includes("already started")) {
        try {
          recognition.stop();
          setTimeout(() => recognition.start(), 100);
        } catch (e) {
          console.error("Error restarting recognition:", e);
        }
      } else {
        console.error("Error starting recognition:", error);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

  const performSearch = useCallback(async (query) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || normalizedQuery.length < 2) return;

    if (normalizedQuery === lastSearchedRef.current && isSearchingRef.current) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    lastSearchedRef.current = normalizedQuery;
    isSearchingRef.current = true;
    setSearchResults([]);
    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      if (normalizedQuery !== lastSearchedRef.current) {
        isSearchingRef.current = false;
        setIsSearching(false);
        searchTimeoutRef.current = null;
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          isSearchingRef.current = false;
          setIsSearching(false);
          searchTimeoutRef.current = null;
          return;
        }

        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query.trim())}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (
          normalizedQuery === lastSearchedRef.current &&
          isSearchingRef.current
        ) {
          if (data.success) {
            setSearchResults(data.data.results || []);
          } else {
            setSearchResults([]);
          }
        }
      } catch (error) {
        console.error("Error performing voice search:", error);
        if (
          normalizedQuery === lastSearchedRef.current &&
          isSearchingRef.current
        ) {
          setSearchResults([]);
        }
      } finally {
        if (normalizedQuery === lastSearchedRef.current) {
          isSearchingRef.current = false;
          setIsSearching(false);
        }
        searchTimeoutRef.current = null;
      }
    }, 100);
  }, []);

  const handleRestartListening = useCallback(() => {
    if (!isListening && recognitionRef.current) {
      queryRef.current = "";
      transcriptRef.current = "";
      lastSearchedRef.current = "";
      hasSearchedRef.current = false;
      isSearchingRef.current = false;
      setSearchQuery("");
      setSearchResults([]);
      setTranscript("");
      setIsSearching(false);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      shouldPreventRestartRef.current = false;

      try {
        recognitionRef.current.start();
      } catch (error) {
        if (error.message && error.message.includes("already started")) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Error restarting:", e);
              }
            }, 100);
          } catch (stopError) {
            console.error("Error stopping:", stopError);
          }
        } else {
          console.error("Error starting:", error);
        }
      }
    }
  }, [isListening]);

  const handleStopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      const finalQuery = (queryRef.current + transcriptRef.current).trim();
      if (finalQuery) {
        queryRef.current = finalQuery;
        setSearchQuery(finalQuery);
      }

      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
  }, [isListening]);

  useEffect(() => {
    if (!isOpen) {
      queryRef.current = "";
      transcriptRef.current = "";
      lastSearchedRef.current = "";
      hasSearchedRef.current = false;
      isSearchingRef.current = false;
      shouldPreventRestartRef.current = false;
      setSearchQuery("");
      setSearchResults([]);
      setTranscript("");
      setIsSearching(false);
      setIsListening(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-white/60 transition-colors"
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

        <div className="p-8 overflow-y-auto flex-1">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                  <div
                    className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"
                    style={{ animationDelay: "200ms" }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"
                    style={{ animationDelay: "400ms" }}
                  ></div>
                </>
              )}
              <button
                onClick={handleRestartListening}
                disabled={isListening}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 dark:bg-red-600 cursor-default"
                    : "bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 cursor-pointer"
                }`}
              >
                <HiMicrophone
                  className={`w-12 h-12 ${
                    isListening
                      ? "text-white"
                      : "text-gray-500 dark:text-white/60"
                  }`}
                />
              </button>
            </div>

            <p className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
              {isListening ? (
                <>
                  Listening...
                  {transcript && (
                    <span className="block mt-2 text-base text-gray-600 dark:text-white/70 font-normal">
                      {transcript}
                    </span>
                  )}
                </>
              ) : searchQuery ? (
                <>
                  Searched:{" "}
                  <span className="text-primary dark:text-primary/80">
                    {searchQuery}
                  </span>
                </>
              ) : (
                "Click mic to start speaking"
              )}
            </p>

            {isListening && (
              <button
                onClick={handleStopListening}
                className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              >
                Stop
              </button>
            )}

            {!isListening && !searchQuery && (
              <button
                onClick={handleRestartListening}
                className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-full transition-colors"
              >
                Start Listening
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                Search Results
              </h3>
              <div className="space-y-0.5">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onSearch?.(result.url);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors text-left rounded-md"
                  >
                    <div className="shrink-0">{getResultIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/60 truncate">
                        {result.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="mt-6 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 dark:border-white/40 border-t-primary"></div>
              <span className="ml-3 text-sm text-gray-600 dark:text-white/60">
                Searching...
              </span>
            </div>
          )}

          {!isSearching &&
            !isListening &&
            searchQuery &&
            searchResults.length === 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-white/60">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
