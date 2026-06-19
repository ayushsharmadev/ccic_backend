"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  HiPhotograph,
  HiHome,
  HiAcademicCap,
  HiX,
  HiArrowLeft,
} from "react-icons/hi";
import ImageUpload from "@/components/utils/ImageUpload";
import { showSuccess, showError } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function CollegeGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const collegeId = params.id;

  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("collegeGallery");
  const [collegeImages, setCollegeImages] = useState([]);
  const [hostelImages, setHostelImages] = useState([]);
  const [campusImages, setCampusImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch college data and galleries
  useEffect(() => {
    const fetchCollegeData = async () => {
      try {
        setLoading(true);

        // Fetch college basic info
        const collegeResponse = await fetch(`/api/colleges/${collegeId}`);
        const collegeData = await collegeResponse.json();

        if (collegeData.success) {
          setCollege(collegeData.data);
          const normalizeGallery = (gallery) => {
            if (!gallery || gallery.length === 0) return [];
            return gallery.map((item) =>
              typeof item === "string" ? { url: item, type: "image" } : item
            );
          };
          setCollegeImages(normalizeGallery(collegeData.data.collegeGallery));
          setHostelImages(normalizeGallery(collegeData.data.hostelGallery));
          setCampusImages(normalizeGallery(collegeData.data.campusGallery));
        } else {
          showError("Failed to fetch college data");
          router.push("/admin/college");
        }
      } catch (error) {
        console.error("Error fetching college data:", error);
        showError("Failed to fetch college data");
        router.push("/admin/college");
      } finally {
        setLoading(false);
      }
    };

    if (collegeId) {
      fetchCollegeData();
    }
  }, [collegeId, router]);

  const getCurrentImages = () => {
    switch (activeTab) {
      case "collegeGallery":
        return collegeImages;
      case "hostelGallery":
        return hostelImages;
      case "campusGallery":
        return campusImages;
      default:
        return [];
    }
  };

  const setCurrentImages = (images) => {
    switch (activeTab) {
      case "collegeGallery":
        setCollegeImages(images);
        break;
      case "hostelGallery":
        setHostelImages(images);
        break;
      case "campusGallery":
        setCampusImages(images);
        break;
    }
  };

  const handleFileUpload = (file, preview) => {
    setCurrentImages((prevImages) => {
      const newImages = [...prevImages, { url: preview, type: "image" }];
      return newImages;
    });
  };

  const handleRemoveImage = (index) => {
    const currentImages = getCurrentImages();
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(updatedImages);
  };

  const handleAddVideo = () => {
    if (!videoUrl.trim()) {
      showError("Please enter a video URL");
      return;
    }
    const convertedUrl = convertYouTubeUrlToEmbed(videoUrl.trim());
    setCurrentImages((prevImages) => {
      const newImages = [...prevImages, { url: convertedUrl, type: "video" }];
      return newImages;
    });
    setVideoUrl("");
    showSuccess("Video added successfully!");
  };

  const convertYouTubeUrlToEmbed = (url) => {
    if (!url || typeof url !== "string") return url;

    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }

    return url;
  };

  const getVideoEmbedUrl = (url) => {
    return convertYouTubeUrlToEmbed(url);
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const embedUrl = convertYouTubeUrlToEmbed(url);
    const match = embedUrl.match(/youtube\.com\/embed\/([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const handleUploadSuccess = (uploadedFile) => {
    setCurrentImages((prevImages) => {
      const newImages = [
        ...prevImages,
        { url: uploadedFile.fileUrl, type: "image" },
      ];
      return newImages;
    });
  };

  const handleUploadError = (error) => {
    console.error("Upload error:", error);
    showError("Failed to upload image. Please try again.");
  };

  const handleAllUploadsComplete = (completedCount) => {
    if (completedCount > 0) {
      showSuccess(
        `${completedCount} image${
          completedCount > 1 ? "s" : ""
        } uploaded successfully!`
      );
    }
  };

  const handleSaveGallery = async () => {
    try {
      setSaving(true);

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      const currentImages = getCurrentImages();

      // Save current gallery
      const response = await fetch(`/api/colleges/${collegeId}/gallery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          galleryType: activeTab,
          images: currentImages,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update gallery");
      }

      showSuccess(
        `${tabs.find((t) => t.id === activeTab)?.name} updated successfully!`
      );
    } catch (error) {
      console.error("Error updating gallery:", error);
      showError("Failed to update gallery. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllGalleries = async () => {
    try {
      setSaving(true);

      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return;
      }

      // Save all galleries
      const galleryData = {
        collegeGallery: collegeImages,
        hostelGallery: hostelImages,
        campusGallery: campusImages,
      };

      for (const [galleryType, images] of Object.entries(galleryData)) {
        const response = await fetch(`/api/colleges/${collegeId}/gallery`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            galleryType,
            images,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to update gallery");
        }
      }

      showSuccess("All galleries updated successfully!");
    } catch (error) {
      console.error("Error updating galleries:", error);
      showError("Failed to update galleries. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: "collegeGallery",
      name: "College Gallery",
      icon: HiAcademicCap,
      color: "blue",
      count: collegeImages.length,
    },
    {
      id: "hostelGallery",
      name: "Hostel Gallery",
      icon: HiHome,
      color: "green",
      count: hostelImages.length,
    },
    {
      id: "campusGallery",
      name: "Campus Gallery",
      icon: HiPhotograph,
      color: "purple",
      count: campusImages.length,
    },
  ];

  const getTabColors = (color) => {
    const colors = {
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        border: "border-blue-200",
        hover: "hover:bg-blue-50",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-600",
        border: "border-green-200",
        hover: "hover:bg-green-50",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-600",
        border: "border-purple-200",
        hover: "hover:bg-purple-50",
      },
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-white/70">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-gray-600 dark:text-white/70">College not found</p>
        </div>
      </div>
    );
  }

  const pageWrapperClass =
    "h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300";
  const headerButtonClass =
    "text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors";
  const headerTitleClass =
    "text-xl font-semibold text-gray-900 dark:text-white mb-0.5";
  const headerSubtitleClass = "text-xs text-gray-600 dark:text-white/70";
  const cardClass =
    "bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors";
  const tabBaseClass =
    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all duration-200";
  const tabActiveClass = "border bg-white dark:bg-slate-900 shadow-sm";
  const tabInactiveClass =
    "text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white";
  const badgeBaseClass = "px-1.5 py-0.5 rounded-full text-xs transition-colors";
  const infoBoxClass =
    "bg-blue-50 dark:bg-slate-900/60 border border-blue-200 dark:border-slate-800 rounded p-3 transition-colors";
  const infoHeadingClass =
    "text-xs font-medium text-blue-900 dark:text-white/80 mb-1";
  const infoItemClass = "text-xs text-blue-800 dark:text-white/60";
  const primaryButtonClass =
    "px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary/30";
  const secondaryButtonClass =
    "px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald/30";

  return (
    <div className={pageWrapperClass}>
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <button
            onClick={() => router.push("/admin/college")}
            className={headerButtonClass}
          >
            <HiArrowLeft className="w-3.5 h-3.5" />
            Back to Colleges
          </button>
        </div>
        <h1 className={headerTitleClass}>Gallery Management</h1>
        <p className={headerSubtitleClass}>
          Manage gallery images for {college.name}
        </p>
      </div>

      {/* Main Content */}
      <div className={cardClass}>
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-slate-800 mb-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${tabBaseClass} ${
                    isActive ? tabActiveClass : tabInactiveClass
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                  <span
                    className={`${badgeBaseClass} ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-gray-200 dark:bg-slate-800 dark:text-white/70"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Upload Section */}
          <div>
            <ImageUpload
              key={`gallery-${collegeId}-${activeTab}`}
              title={`Upload ${
                tabs.find((t) => t.id === activeTab)?.name
              } Images`}
              type="gallery"
              accept="image/*"
              maxSize="5MB"
              width="100%"
              height="120px"
              preview={null}
              onFileChange={handleFileUpload}
              onRemove={() => {}}
              uploadType="gallery"
              identifier={`${collegeId}-${activeTab}`}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              onAllUploadsComplete={handleAllUploadsComplete}
              showUploadProgress={true}
              multiple={true}
              disabled={isUploading || saving}
            />
          </div>

          {/* Add Video Section */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/50">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Add YouTube Video
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleAddVideo}
                disabled={!videoUrl.trim() || saving}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Video
              </button>
            </div>
          </div>

          {/* Current Gallery Items Grid */}
          {getCurrentImages().length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Current Gallery ({getCurrentImages().length})
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {getCurrentImages().map((item, index) => {
                  const imageUrl = typeof item === "string" ? item : item.url;
                  const itemType =
                    typeof item === "string" ? "image" : item.type || "image";
                  return (
                    <div key={index} className="relative group">
                      {itemType === "video" ? (
                        <div className="w-full h-20 rounded border border-gray-200 dark:border-slate-600 relative overflow-hidden">
                          {getYouTubeThumbnail(imageUrl) ? (
                            <>
                              <img
                                src={getYouTubeThumbnail(imageUrl)}
                                alt={`Video thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = `https://img.youtube.com/vi/${getYouTubeVideoId(
                                    imageUrl
                                  )}/hqdefault.jpg`;
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <svg
                                  className="w-8 h-8 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                              <div className="text-center">
                                <svg
                                  className="w-8 h-8 text-red-600 mx-auto mb-1"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                <p className="text-xs text-gray-600 dark:text-white/70">
                                  Video
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt={`Gallery item ${index + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-200 dark:border-slate-600"
                        />
                      )}
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      >
                        <HiX className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className={infoBoxClass}>
            <div className="flex items-start gap-2">
              <HiPhotograph className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className={infoHeadingClass}>Gallery Guidelines</h4>
                <ul className="text-xs text-blue-800 dark:text-white/60 space-y-0.5">
                  <li>
                    • Upload images (JPG, PNG, GIF, WebP) or add YouTube video
                    URLs
                  </li>
                  <li>• Maximum file size: 5MB per image</li>
                  <li>• Multiple images can be uploaded at once</li>
                  <li>• For videos, paste YouTube URL and click "Add Video"</li>
                  <li>
                    • You can toggle between Image/Video type for each item
                  </li>
                  <li>• Images will be automatically optimized for web</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Bottom Right */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSaveGallery}
            disabled={saving}
            className={primaryButtonClass}
          >
            {saving
              ? "Saving..."
              : `Save ${tabs.find((t) => t.id === activeTab)?.name}`}
          </button>
          <button
            onClick={handleSaveAllGalleries}
            disabled={saving}
            className={secondaryButtonClass}
          >
            {saving ? "Saving..." : "Save All Galleries"}
          </button>
        </div>
      </div>
    </div>
  );
}
