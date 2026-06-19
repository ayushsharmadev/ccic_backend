"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { HiXMark, HiChevronLeft, HiChevronRight } from "react-icons/hi2";

const normalizeGalleryItem = (item) => {
  if (typeof item === "string") {
    return { url: item, type: "image" };
  }
  return {
    url: item.url || item,
    type: item.type || "image",
  };
};

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(/youtube\.com\/embed\/([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export default function LightboxGallery({
  images = [],
  title,
  thumbClassName = "",
}) {
  const normalizedImages = images.map(normalizeGalleryItem);
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = useCallback((i) => {
    setIndex(i);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const showPrev = useCallback(
    (e) => {
      e?.stopPropagation?.();
      setIndex(
        (prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length
      );
    },
    [normalizedImages.length]
  );

  const showNext = useCallback(
    (e) => {
      e?.stopPropagation?.();
      setIndex((prev) => (prev + 1) % normalizedImages.length);
    },
    [normalizedImages.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, showPrev, showNext]);

  if (!normalizedImages || normalizedImages.length === 0) return null;

  return (
    <>
      {title ? (
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {normalizedImages.map((item, i) => {
          const thumbnailUrl =
            item.type === "video"
              ? getYouTubeThumbnail(item.url) || item.url
              : item.url;

          return (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className={`aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden hover:shadow-md dark:hover:shadow-lg transition-shadow relative ${thumbClassName}`}
              aria-label={`Open ${item.type} ${i + 1}`}
            >
              {item.type === "video" ? (
                <>
                  <img
                    src={thumbnailUrl}
                    alt={`Video thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const videoId = getYouTubeVideoId(item.url);
                      if (videoId) {
                        e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                </>
              ) : (
                <Image
                  src={item.url}
                  alt={`Gallery ${i + 1}`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          );
        })}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"
            aria-label="Close"
          >
            <HiXMark className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={showPrev}
            className="absolute left-3 sm:left-6 p-2 rounded-full bg-primary text-white hover:bg-primary-600 z-10 shadow"
            aria-label="Previous"
          >
            <HiChevronLeft className="w-6 h-6" />
          </button>

          <div
            className="w-full h-full relative flex items-center justify-center px-2 sm:px-4 md:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {normalizedImages[index].type === "video" ? (
              <div className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] aspect-video">
                <iframe
                  src={normalizedImages[index].url}
                  title={`Video ${index + 1}`}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={normalizedImages[index].url}
                alt={`Image ${index + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>

          <button
            type="button"
            onClick={showNext}
            className="absolute right-3 sm:right-6 p-2 rounded-full bg-primary text-white hover:bg-primary-600 z-10 shadow"
            aria-label="Next"
          >
            <HiChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
