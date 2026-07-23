export function getTestimonialEmbedUrl(url = "") {
  const value = url.trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

export function isValidTestimonialVideo(videoType, videoUrl) {
  const url = typeof videoUrl === "string" ? videoUrl.trim() : "";
  if (!videoType && !url) return true;
  if (!videoType || !url) return false;
  if (videoType === "local") return url.startsWith("/uploads/");
  if (videoType === "external") return Boolean(getTestimonialEmbedUrl(url));
  return false;
}
