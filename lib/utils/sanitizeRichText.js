export const sanitizeRichText = (html) => {
  if (!html) {
    return "";
  }

  const input = typeof html === "string" ? html : String(html);

  return input.replace(
    /<span\b([^>]*?)\sstyle\s*=\s*(['"])(.*?)\2([^>]*?)>/gi,
    (_, before = "", __, ___, after = "") => {
      const trimmedBefore = before.replace(/\s+$/, "");
      const trimmedAfter = after.replace(/^\s+/, "");
      const attrs = [trimmedBefore, trimmedAfter]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s{2,}/g, " ");

      return attrs ? `<span ${attrs}>` : "<span>";
    }
  );
};


