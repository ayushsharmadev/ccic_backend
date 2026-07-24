"use client";

import { useId, useState } from "react";
import { showError, showSuccess } from "@/components/utils/ApnaNotify";
import { getTestimonialEmbedUrl } from "@/lib/utils/testimonialVideo";

export default function TestimonialVideoFields({
  videoType,
  videoUrl,
  persistedVideoUrl = "",
  onChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputId = useId();

  const deletePendingUpload = async (url) => {
    if (
      !url?.startsWith("/uploads/testimonials/") ||
      url === persistedVideoUrl
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/testimonials/video-upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl: url }),
      });
      if (!response.ok) {
        console.error("Failed to clean up pending testimonial video");
      }
    } catch (error) {
      console.error("Pending testimonial video cleanup failed:", error);
    }
  };

  const changeType = async (type) => {
    await deletePendingUpload(videoUrl);
    setSelectedFileName("");
    onChange({ videoType: type, videoUrl: "" });
  };

  const uploadVideo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const maxVideoSize = 300 * 1024 * 1024;
    if (file.size > maxVideoSize) {
      showError("Video file must be 300 MB or smaller");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      showError("Please login again to upload a video");
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const response = await fetch("/api/testimonials/video-upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          response.ok
            ? "Upload server returned an invalid response"
            : `Upload failed (${response.status})`
        );
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Upload failed (${response.status})`);
      }

      await deletePendingUpload(videoUrl);
      onChange({ videoType: "local", videoUrl: result.file.fileUrl });
      showSuccess("Testimonial video uploaded");
    } catch (error) {
      showError(error.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const embedUrl =
    videoType === "external" ? getTestimonialEmbedUrl(videoUrl) : "";

  return (
    <section className="mb-5 rounded-lg border border-gray-200 bg-gray-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/35">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
            Video Testimonial
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-white/50">
            Optional ? upload a video or use a YouTube/Vimeo link
          </p>
        </div>
        {videoUrl && (
          <button
            type="button"
            onClick={async () => {
              await deletePendingUpload(videoUrl);
              setSelectedFileName("");
              onChange({ videoType: "", videoUrl: "" });
            }}
            className="shrink-0 cursor-pointer text-[11px] font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      <div
        className={`grid gap-3 ${
          videoType
            ? "grid-cols-[minmax(8rem,0.34fr)_minmax(0,1fr)]"
            : "grid-cols-[minmax(8rem,18rem)]"
        }`}
      >
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-white/60">
            Source
          </label>
          <select
            value={videoType}
            onChange={(event) => changeType(event.target.value)}
            className="h-9 w-full cursor-pointer rounded border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">No video</option>
            <option value="local">Upload video</option>
            <option value="external">YouTube / Vimeo</option>
          </select>
        </div>

        {videoType === "local" && (
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-white/60">
              Video file
            </label>
            <input
              id={fileInputId}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={uploadVideo}
              disabled={uploading}
              className="sr-only"
            />
            <label
              htmlFor={fileInputId}
              className={`flex h-9 items-center justify-between gap-3 rounded border border-gray-300 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900 ${
                uploading
                  ? "cursor-wait opacity-60"
                  : "cursor-pointer hover:border-primary"
              }`}
            >
              <span className="truncate text-gray-500 dark:text-white/55">
                {uploading
                  ? "Uploading?"
                  : selectedFileName ||
                    (videoUrl ? videoUrl.split("/").pop() : "Choose video")}
              </span>
              <span className="shrink-0 font-medium text-primary">
                {videoUrl ? "Replace" : "Browse"}
              </span>
            </label>
            <p className="mt-1 text-[10px] text-gray-500 dark:text-white/45">
              MP4, WebM or MOV - max 300 MB
            </p>
          </div>
        )}

        {videoType === "external" && (
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600 dark:text-white/60">
              Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(event) =>
                onChange({
                  videoType: "external",
                  videoUrl: event.target.value,
                })
              }
              placeholder="YouTube or Vimeo URL"
              className="h-9 w-full rounded border border-gray-300 bg-white px-3 text-xs outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
            />
            {videoUrl && !embedUrl && (
              <p className="mt-1 text-[10px] text-red-600">
                Enter a valid YouTube or Vimeo link.
              </p>
            )}
          </div>
        )}
      </div>

      {videoType === "local" && videoUrl && (
        <video
          src={videoUrl}
          controls
          preload="metadata"
          className="mt-3 aspect-video w-full max-w-md rounded-md border border-gray-200 bg-black object-contain dark:border-slate-800"
        />
      )}

      {videoType === "external" && embedUrl && (
        <iframe
          src={embedUrl}
          title="Video testimonial preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="mt-3 aspect-video w-full max-w-md rounded-md border border-gray-200 dark:border-slate-800"
        />
      )}
    </section>
  );
}
