"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Placeholder } from "@tiptap/extension-placeholder";

import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { showWarning, showSuccess, showError, showInfo } from "./ApnaNotify";

// React Icons
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaHeading,
  FaTable,
  FaImage,
  FaLink,
  FaUnlink,
  FaCode,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaEraser,
  FaPalette,
  FaHighlighter,
  FaMinus,
  FaIndent,
  FaOutdent,
  FaSubscript,
  FaSuperscript,
  FaCut,
  FaCopy,
  FaPaste,
  FaClipboard,
  FaFileWord,
  FaSpellCheck,
  FaAnchor,
  FaInfoCircle,
  FaExpand,
  FaCompress,
  FaQuestionCircle,
} from "react-icons/fa";

export default function ApnaEditor({
  value = "",
  onChange,
  placeholder = "Enter your content...",
  className = "",
  disabled = false,
  minHeight = "300px",
  maxHeight = "600px",
  showToolbar = true,
  showTableOptions = true,
  showCodeOptions = true,
  showImageOptions = true,
  showLinkOptions = true,
  showColorOptions = true,
  showAlignmentOptions = true,
  showAdvancedOptions = true,
  customExtensions = [],
  customConfig = {},
  onImageUpload = null, // Custom image upload handler
  imageUploadConfig = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    uploadEndpoint: "/api/upload",
    showProgress: true,
  },
}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  // Helper function to manage dropdown state
  const toggleDropdown = (dropdownName) => {
    switch (dropdownName) {
      case "specialChars":
        setShowSpecialChars(!showSpecialChars);
        setShowStyles(false);
        setShowFormats(false);
        break;
      case "styles":
        setShowStyles(!showStyles);
        setShowSpecialChars(false);
        setShowFormats(false);
        break;
      case "formats":
        setShowFormats(!showFormats);
        setShowSpecialChars(false);
        setShowStyles(false);
        break;
      default:
        break;
    }
  };

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setShowSpecialChars(false);
    setShowStyles(false);
    setShowFormats(false);
  };
  const fileInputRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Default extensions
  const defaultExtensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class:
          "border-collapse border border-gray-300 dark:border-slate-700 w-full my-4",
      },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: {
        class: "bg-gray-100 dark:bg-slate-800 font-semibold",
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: "border border-gray-300 dark:border-slate-700 p-3",
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg shadow-sm my-4",
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline hover:text-primary-800",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    CodeBlock.configure({
      HTMLAttributes: {
        class:
          "bg-gray-100 dark:bg-slate-900 p-4 rounded-lg font-mono text-sm border-l-4 border-primary my-4",
      },
    }),
    Placeholder.configure({
      placeholder: placeholder,
    }),

    HorizontalRule.configure({
      HTMLAttributes: {
        class: "border-t border-gray-300 dark:border-slate-700 my-6",
      },
    }),
    Subscript,
    Superscript,

    ...customExtensions,
  ];

  // Editor configuration
  const editor = useEditor({
    extensions: defaultExtensions,
    content: value,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
    onBeforeCreate: ({ editor }) => {
      setIsReady(true);
      setError(null);
    },
    onError: ({ error }) => {
      console.error("TipTap Error:", error);
      setError("Editor failed to load. Please refresh the page.");
    },
    ...customConfig,
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Custom image upload handler
  const handleImageUpload = async (file) => {
    if (!onImageUpload) {
      // Default behavior - create data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    try {
      setIsUploading(true);
      setImageUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImageUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const imageUrl = await onImageUpload(file);

      clearInterval(progressInterval);
      setImageUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setImageUploadProgress(0);
      }, 500);

      return imageUrl;
    } catch (error) {
      console.error("Image upload failed:", error);
      setIsUploading(false);
      setImageUploadProgress(0);
      throw error;
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!imageUploadConfig.allowedTypes.includes(file.type)) {
      showError(
        `Invalid file type. Allowed: ${imageUploadConfig.allowedTypes.join(
          ", "
        )}`
      );
      return;
    }

    // Validate file size
    if (file.size > imageUploadConfig.maxSize) {
      showError(
        `File too large. Max size: ${Math.round(
          imageUploadConfig.maxSize / 1024 / 1024
        )}MB`
      );
      return;
    }

    try {
      const imageUrl = await handleImageUpload(file);
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      showError("Failed to upload image. Please try again.");
    }

    // Reset file input
    event.target.value = "";
  };

  // Error state
  if (error) {
    return (
      <div
        className={`border border-secondary-300 rounded-lg p-4 bg-secondary-50 ${className}`}
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-secondary mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-secondary-800">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-secondary hover:text-secondary-800 underline"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // Toolbar component
  const Toolbar = () => {
    if (!editor || !showToolbar) return null;

    const addLink = () => {
      const url = window.prompt("Enter URL:");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    };

    const addTable = () => {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    };

    const addHorizontalRule = () => {
      editor.chain().focus().setHorizontalRule().run();
    };

    const addBlockquote = () => {
      editor.chain().focus().toggleBlockquote().run();
    };

    const increaseIndent = () => {
      // Simple indentation using spaces
      editor.chain().focus().insertContent("    ").run();
    };

    const decreaseIndent = () => {
      // Simple de-indentation - just remove 4 spaces if they exist
      const { from } = editor.state.selection;
      const beforeText = editor.state.doc.textBetween(
        Math.max(0, from - 4),
        from
      );
      if (beforeText === "    ") {
        editor
          .chain()
          .focus()
          .deleteRange({ from: from - 4, to: from })
          .run();
      }
    };

    const addSpecialChar = (char) => {
      editor.chain().focus().insertContent(char).run();
      setShowSpecialChars(false);
    };

    const copyContent = () => {
      const content = editor.getHTML();
      navigator.clipboard.writeText(content);
    };

    const cutContent = () => {
      const content = editor.getHTML();
      navigator.clipboard.writeText(content);
      editor.chain().focus().clearContent().run();
    };

    const pasteContent = async () => {
      try {
        const text = await navigator.clipboard.readText();
        editor.chain().focus().insertContent(text).run();
      } catch (error) {
        console.error("Failed to paste content:", error);
      }
    };

    const pasteAsPlainText = async () => {
      try {
        const text = await navigator.clipboard.readText();
        editor
          .chain()
          .focus()
          .insertContent(text, { parseOptions: { preserveWhitespace: "full" } })
          .run();
      } catch (error) {
        console.error("Failed to paste content:", error);
      }
    };

    const pasteFromWord = async () => {
      try {
        const text = await navigator.clipboard.readText();
        // Clean up Word formatting and convert to clean HTML
        const cleanText = text
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        editor.chain().focus().insertContent(cleanText).run();
      } catch (error) {
        console.error("Failed to paste from Word:", error);
      }
    };

    const specialCharacters = [
      "©",
      "®",
      "™",
      "€",
      "£",
      "¥",
      "¢",
      "§",
      "¶",
      "†",
      "‡",
      "•",
      "‣",
      "◦",
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
      "θ",
      "ι",
      "κ",
      "λ",
      "μ",
      "ν",
      "ξ",
      "π",
      "ρ",
      "σ",
      "τ",
      "υ",
      "φ",
      "χ",
      "ψ",
      "ω",
      "Ω",
      "∑",
      "∏",
      "∫",
      "√",
      "±",
      "×",
      "÷",
      "≤",
      "≥",
      "≠",
      "≈",
      "≡",
      "∞",
      "∆",
      "∇",
      "∈",
      "∉",
      "∋",
      "∌",
      "∩",
      "∪",
      "⊂",
      "⊃",
      "⊆",
      "⊇",
      "⊕",
      "⊗",
      "⊥",
      "∠",
      "∡",
      "∢",
      "→",
      "←",
      "↑",
      "↓",
      "↔",
      "↕",
      "⇒",
      "⇐",
      "⇔",
      "⇑",
      "⇓",
      "⇐",
      "⇒",
      "♠",
      "♣",
      "♥",
      "♦",
      "♤",
      "♧",
      "♡",
      "♢",
      "★",
      "☆",
      "◆",
      "◇",
      "●",
      "○",
    ];

    const addAnchor = () => {
      const anchorName = window.prompt("Enter anchor name:");
      if (anchorName) {
        editor
          .chain()
          .focus()
          .insertContent(`<a name="${anchorName}"></a>`)
          .run();
      }
    };

    const toggleSpellCheck = () => {
      const editorElement = document.querySelector(".ProseMirror");
      if (editorElement) {
        const currentSpellCheck = editorElement.getAttribute("spellcheck");
        const newSpellCheck = currentSpellCheck === "true" ? "false" : "true";
        editorElement.setAttribute("spellcheck", newSpellCheck);
        showInfo(
          `Spell check ${newSpellCheck === "true" ? "enabled" : "disabled"}`
        );
      }
    };

    const addRowAbove = () => {
      editor.chain().focus().addRowBefore().run();
    };

    const addRowBelow = () => {
      editor.chain().focus().addRowAfter().run();
    };

    const addColumnLeft = () => {
      editor.chain().focus().addColumnBefore().run();
    };

    const addColumnRight = () => {
      editor.chain().focus().addColumnAfter().run();
    };

    const deleteRow = () => {
      editor.chain().focus().deleteRow().run();
    };

    const deleteColumn = () => {
      editor.chain().focus().deleteColumn().run();
    };

    const deleteTable = () => {
      editor.chain().focus().deleteTable().run();
    };

    const toggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
      if (!isFullscreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    };

    return (
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-start border-b border-gray-100 p-1.5 dark:border-slate-700 sm:hidden">
          <button
            type="button"
            onClick={() => setShowMobileToolbar((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showMobileToolbar
                ? "border-primary/60 bg-primary/10 text-primary dark:bg-primary/15"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white/70"
            }`}
            aria-expanded={showMobileToolbar}
          >
            Toolbar
            <span className="text-[10px] leading-none">
              {showMobileToolbar ? "-" : "+"}
            </span>
          </button>
        </div>

        {/* Main Toolbar - Row 1 */}
        <div className={`${showMobileToolbar ? "flex" : "hidden"} flex-wrap items-center gap-1 p-2 border-b border-gray-100 dark:border-slate-700 sm:flex sm:p-3`}>
          {/* Clipboard Group */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={cutContent}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Cut (Ctrl+X)"
            >
              <FaCut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={copyContent}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Copy (Ctrl+C)"
            >
              <FaCopy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={pasteContent}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Paste (Ctrl+V)"
            >
              <FaPaste className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={pasteAsPlainText}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Paste as Plain Text"
            >
              <FaClipboard className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={pasteFromWord}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Paste from Word"
            >
              <FaFileWord className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Text Formatting Group */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("bold")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Bold (Ctrl+B)"
            >
              <FaBold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("italic")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Italic (Ctrl+I)"
            >
              <FaItalic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("underline")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Underline (Ctrl+U)"
            >
              <FaUnderline className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("strike")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Strikethrough"
            >
              <FaStrikethrough className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                const selection = editor.state.selection;
                const text = editor.state.doc.textBetween(
                  selection.from,
                  selection.to
                );
                if (text) {
                  // Use proper TipTap subscript command
                  editor.chain().focus().toggleSubscript().run();
                } else {
                  // Show warning notification if no text is selected
                  showWarning(
                    "Please select text to apply subscript formatting"
                  );
                }
              }}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("subscript")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Subscript (Select text first)"
            >
              <FaSubscript className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                const selection = editor.state.selection;
                const text = editor.state.doc.textBetween(
                  selection.from,
                  selection.to
                );
                if (text) {
                  // Use proper TipTap superscript command
                  editor.chain().focus().toggleSuperscript().run();
                } else {
                  // Show warning notification if no text is selected
                  showWarning(
                    "Please select text to apply superscript formatting"
                  );
                }
              }}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("superscript")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Superscript (Select text first)"
            >
              <FaSuperscript className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Headings Group */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Heading 1"
            >
              H1
            </button>

            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Heading 2"
            >
              H2
            </button>

            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Heading 3"
            >
              H3
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Lists Group */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("bulletList")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Bullet List"
            >
              <FaListUl className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("orderedList")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Ordered List"
            >
              <FaListOl className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={decreaseIndent}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Decrease Indent"
            >
              <FaOutdent className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={increaseIndent}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Increase Indent"
            >
              <FaIndent className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Alignment Group */}
          {showAlignmentOptions && (
            <>
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive({ textAlign: "left" })
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Align Left"
                >
                  <FaAlignLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive({ textAlign: "center" })
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Align Center"
                >
                  <FaAlignCenter className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive({ textAlign: "right" })
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Align Right"
                >
                  <FaAlignRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                  }
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive({ textAlign: "justify" })
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Justify"
                >
                  <FaAlignJustify className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>
            </>
          )}

          {/* Advanced Formatting Group */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={addBlockquote}
              className={`p-2 rounded-md transition-colors ${
                editor.isActive("blockquote")
                  ? "bg-primary text-white shadow-sm"
                  : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
              }`}
              title="Blockquote"
            >
              <FaQuoteLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={addHorizontalRule}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Horizontal Rule"
            >
              <FaMinus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={addAnchor}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Add Anchor"
            >
              <FaAnchor className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleSpellCheck}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Toggle Spell Check"
            >
              <FaSpellCheck className="w-4 h-4" />
            </button>

            {/* Special Characters Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("specialChars")}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                title="Special Characters"
              >
                <FaInfoCircle className="w-4 h-4" />
              </button>

              {showSpecialChars && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg shadow-lg z-50 p-3 max-w-xs">
                  <div className="grid grid-cols-8 gap-1">
                    {specialCharacters.map((char, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          addSpecialChar(char);
                          closeAllDropdowns();
                        }}
                        className="p-2 bg-gray-200 dark:bg-slate-700 rounded text-sm font-mono hover:bg-primary-100 dark:hover:bg-primary/40"
                        title={char}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Code Group */}
          {showCodeOptions && (
            <>
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive("code")
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Inline Code"
                >
                  <FaCode className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive("codeBlock")
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Code Block"
                >
                  <FaCode className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>
            </>
          )}

          {/* Table Group */}
          {showTableOptions && (
            <>
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={addTable}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                  title="Insert Table"
                >
                  <FaTable className="w-4 h-4" />
                </button>

                {/* Table Operations - Only show when cursor is in table */}
                {editor.isActive("table") && (
                  <>
                    <button
                      type="button"
                      onClick={addRowAbove}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                      title="Add Row Above"
                    >
                      <span className="text-xs font-bold">+R↑</span>
                    </button>

                    <button
                      type="button"
                      onClick={addRowBelow}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                      title="Add Row Below"
                    >
                      <span className="text-xs font-bold">+R↓</span>
                    </button>

                    <button
                      type="button"
                      onClick={addColumnLeft}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                      title="Add Column Left"
                    >
                      <span className="text-xs font-bold">+C←</span>
                    </button>

                    <button
                      type="button"
                      onClick={addColumnRight}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                      title="Add Column Right"
                    >
                      <span className="text-xs font-bold">+C→</span>
                    </button>

                    <button
                      type="button"
                      onClick={deleteRow}
                      className="p-2 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary/30 text-secondary-700 dark:text-secondary-200 transition-colors"
                      title="Delete Row"
                    >
                      <span className="text-xs font-bold text-secondary">
                        -R
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={deleteColumn}
                      className="p-2 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary/30 text-secondary-700 dark:text-secondary-200 transition-colors"
                      title="Delete Column"
                    >
                      <span className="text-xs font-bold text-secondary">
                        -C
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={deleteTable}
                      className="p-2 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary/30 text-secondary-700 dark:text-secondary-200 transition-colors"
                      title="Delete Table"
                    >
                      <span className="text-xs font-bold text-secondary">
                        -T
                      </span>
                    </button>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>
            </>
          )}

          {/* Media Group */}
          {showImageOptions && (
            <>
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                  title="Insert Image"
                >
                  <FaImage className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>
            </>
          )}

          {showLinkOptions && (
            <>
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={addLink}
                  className={`p-2 rounded-md transition-colors ${
                    editor.isActive("link")
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80"
                  }`}
                  title="Insert Link"
                >
                  <FaLink className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
                  title="Remove Link"
                >
                  <FaUnlink className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>
            </>
          )}

          {/* Utility Group */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <FaUndo className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <FaRedo className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                editor.chain().focus().clearNodes().unsetAllMarks().run()
              }
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Clear Formatting"
            >
              <FaEraser className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <FaCompress className="w-4 h-4" />
              ) : (
                <FaExpand className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const shortcuts = [
                  "Ctrl+B: Bold",
                  "Ctrl+I: Italic",
                  "Ctrl+U: Underline",
                  "Ctrl+Z: Undo",
                  "Ctrl+Y: Redo",
                  "Ctrl+K: Insert Link",
                  "Ctrl+Shift+K: Remove Link",
                  "Ctrl+Shift+8: Bullet List",
                  "Ctrl+Shift+7: Numbered List",
                  "Ctrl+Shift+>: Increase Indent",
                  "Ctrl+Shift+<: Decrease Indent",
                ];
                showInfo("Keyboard Shortcuts:\n\n" + shortcuts.join("\n"));
              }}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors"
              title="Keyboard Shortcuts"
            >
              <FaQuestionCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Toolbar - Row 2 */}
        <div className={`${showMobileToolbar ? "flex" : "hidden"} flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-slate-900 sm:flex sm:p-3`}>
          {/* Styles Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("styles")}
              className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors text-sm font-medium"
              title="Styles"
            >
              Styles ▼
            </button>

            {showStyles && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg shadow-lg z-50 p-2 min-w-[150px]">
                <button
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm"
                >
                  Normal Text
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm font-bold"
                >
                  Heading 1
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm font-bold"
                >
                  Heading 2
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm font-bold"
                >
                  Heading 3
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleBlockquote().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm italic"
                >
                  Quote
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleCodeBlock().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm font-mono"
                >
                  Code Block
                </button>
              </div>
            )}
          </div>

          {/* Format Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("formats")}
              className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors text-sm font-medium"
              title="Format"
            >
              Format ▼
            </button>

            {showFormats && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg shadow-lg z-50 p-2 min-w-[150px]">
                <button
                  onClick={() => {
                    editor.chain().focus().toggleBold().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm font-bold"
                >
                  Bold
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleItalic().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm italic"
                >
                  Italic
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleUnderline().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm underline"
                >
                  Underline
                </button>
                <button
                  onClick={() => {
                    editor.chain().focus().toggleStrike().run();
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm line-through"
                >
                  Strikethrough
                </button>
                <button
                  onClick={() => {
                    const selection = editor.state.selection;
                    const text = editor.state.doc.textBetween(
                      selection.from,
                      selection.to
                    );
                    if (text) {
                      editor.chain().focus().toggleSubscript().run();
                      closeAllDropdowns();
                    } else {
                      showWarning(
                        "Please select text to apply subscript formatting"
                      );
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm"
                >
                  Subscript
                </button>
                <button
                  onClick={() => {
                    const selection = editor.state.selection;
                    const text = editor.state.doc.textBetween(
                      selection.from,
                      selection.to
                    );
                    if (text) {
                      editor.chain().focus().toggleSuperscript().run();
                      closeAllDropdowns();
                    } else {
                      showWarning(
                        "Please select text to apply superscript formatting"
                      );
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-sm"
                >
                  Superscript
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 dark:bg-slate-700 mx-1"></div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().insertContent("<hr>").run()}
              className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors text-sm"
              title="Insert Horizontal Line"
            >
              Horizontal Line
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().insertContent("<br>").run()}
              className="px-3 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-white/80 transition-colors text-sm"
              title="Insert Line Break"
            >
              Line Break
            </button>
          </div>
        </div>

        {/* Image Upload Progress */}
        {isUploading && (
          <div className="px-3 pb-3">
            <div className="bg-primary-50 dark:bg-primary/20 border border-primary-200 dark:border-primary/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-800 dark:text-primary-100">
                  Uploading image...
                </span>
                <span className="text-sm text-primary">
                  {imageUploadProgress}%
                </span>
              </div>
              <div className="w-full bg-primary-200 dark:bg-primary/30 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${imageUploadProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm dark:shadow-none ${className} ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : ""
      }`}
      style={isFullscreen ? { zIndex: 9999 } : {}}
    >
      <Toolbar />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept={imageUploadConfig.allowedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose max-w-none focus:outline-none"
          style={{
            minHeight: minHeight,
            maxHeight: maxHeight,
            overflowY: "auto",
          }}
        />

        {/* Enhanced Status Bar */}
        {isReady && editor && (
          <div className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-2.5 py-2 text-xs text-gray-500 dark:text-white/60 sm:px-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2"></span>
                  {editor.getText().length}
                  <span className="sm:hidden">ch</span>
                  <span className="hidden sm:inline">characters</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2"></span>
                  {
                    editor
                      .getText()
                      .trim()
                      .split(/\s+/)
                      .filter((word) => word.length > 0).length
                  }{" "}
                  <span className="sm:hidden">wd</span>
                  <span className="hidden sm:inline">words</span>
                </span>
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary sm:h-2 sm:w-2"></span>
                  {
                    editor
                      .getText()
                      .split("\n")
                      .filter((line) => line.trim().length > 0).length
                  }{" "}
                  <span className="sm:hidden">ln</span>
                  <span className="hidden sm:inline">lines</span>
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <span className="hidden text-gray-400 sm:inline">|</span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary sm:h-2 sm:w-2"></span>
                  <span className="sm:hidden">
                    {editor.isActive("table") ? "Table" : "Text"}
                  </span>
                  <span className="hidden sm:inline">
                    {editor.isActive("table") ? "Table Mode" : "Text Mode"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
