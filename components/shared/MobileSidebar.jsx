"use client";

import { useState, useEffect, useRef } from "react";

const MobileSidebar = ({ isOpen, onClose, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosingViaDrag, setIsClosingViaDrag] = useState(false);
  const sidebarRef = useRef(null);
  const dragStateRef = useRef({
    startY: 0,
    startTranslateY: 0,
    currentTranslateY: 0,
    hasMoved: false,
    startedFromDragHandle: false,
  });

  // Mobile sidebar drag handlers - Touch events
  const handleTouchStart = (e) => {
    // Only allow drag if started from drag handle
    const target = e.target.closest("[data-drag-handle]");
    if (!target) {
      dragStateRef.current.startY = 0;
      dragStateRef.current.startedFromDragHandle = false;
      return;
    }

    e.stopPropagation();
    if (!sidebarRef.current) return;

    const touch = e.touches[0];
    dragStateRef.current.startY = touch.clientY;
    dragStateRef.current.hasMoved = false;
    dragStateRef.current.startedFromDragHandle = true;

    // Get current transform value
    const currentTransform = window.getComputedStyle(
      sidebarRef.current
    ).transform;
    if (currentTransform && currentTransform !== "none") {
      const matrix = new DOMMatrix(currentTransform);
      dragStateRef.current.startTranslateY = matrix.m42 || 0;
    } else {
      dragStateRef.current.startTranslateY = 0;
    }
    dragStateRef.current.currentTranslateY =
      dragStateRef.current.startTranslateY;
  };

  const handleTouchMove = (e) => {
    if (!sidebarRef.current) return;

    // Only allow drag if it started from drag handle
    if (
      !dragStateRef.current.startedFromDragHandle ||
      dragStateRef.current.startY === 0
    ) {
      return;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const currentY = touch.clientY;
    const deltaY = currentY - dragStateRef.current.startY;
    const absDeltaY = Math.abs(deltaY);

    // Minimum movement threshold (10px) before starting drag
    if (!isDragging && absDeltaY > 10) {
      // Only start dragging if moving down
      if (deltaY > 0) {
        const newTranslateY = Math.max(
          0,
          dragStateRef.current.startTranslateY + deltaY
        );
        if (sidebarRef.current) {
          sidebarRef.current.style.transition = "none";
          sidebarRef.current.style.transform = `translateY(${newTranslateY}px)`;
        }

        dragStateRef.current.currentTranslateY = newTranslateY;
        dragStateRef.current.hasMoved = true;
        setIsDragging(true);

        // Prevent body scroll during drag
        document.body.style.overflow = "hidden";

        try {
          if (e.cancelable !== false) {
            e.preventDefault();
          }
        } catch (err) {
          // Ignore preventDefault errors
        }
        e.stopPropagation();
        return;
      } else {
        // Moving up - reset and allow scroll
        dragStateRef.current.startY = 0;
        dragStateRef.current.startedFromDragHandle = false;
        return;
      }
    }

    if (!isDragging || !dragStateRef.current.hasMoved) return;

    try {
      if (e.cancelable !== false) {
        e.preventDefault();
      }
    } catch (err) {
      // Ignore preventDefault errors
    }
    e.stopPropagation();

    // Calculate new translateY based on starting position + delta
    let newTranslateY = dragStateRef.current.startTranslateY + deltaY;

    // Only allow dragging down (positive translateY)
    newTranslateY = Math.max(0, newTranslateY);

    // Apply transform in pixels for smooth movement
    sidebarRef.current.style.transform = `translateY(${newTranslateY}px)`;
    dragStateRef.current.currentTranslateY = newTranslateY;

    // Update overlay opacity based on drag progress
    const sidebarHeight =
      sidebarRef.current.offsetHeight || window.innerHeight * 0.9;
    const progress = Math.min(newTranslateY / sidebarHeight, 1);
    const opacity = 1 - progress * 0.5;

    const overlay = document.querySelector(".mobile-sidebar-overlay");
    if (overlay) {
      overlay.style.opacity = opacity;
      overlay.style.transition = "none";
    }
  };

  const handleTouchEnd = (e) => {
    // If no actual drag happened, just reset
    if (!isDragging && !dragStateRef.current.hasMoved) {
      dragStateRef.current = {
        startY: 0,
        startTranslateY: 0,
        currentTranslateY: 0,
        hasMoved: false,
        startedFromDragHandle: false,
      };
      return;
    }

    try {
      if (e.cancelable !== false) {
        e.preventDefault();
      }
    } catch (err) {
      // Ignore preventDefault errors
    }
    e.stopPropagation();

    const finalTranslateY = dragStateRef.current.currentTranslateY;
    const sidebarHeight =
      sidebarRef.current?.offsetHeight || window.innerHeight * 0.9;
    // Close if dragged down 20% or more of sidebar height
    const closeThreshold = sidebarHeight * 0.2;

    // Re-enable transition for smooth animation
    if (sidebarRef.current) {
      sidebarRef.current.style.transition =
        "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    }

    const overlay = document.querySelector(".mobile-sidebar-overlay");
    if (overlay) {
      overlay.style.transition = "opacity 0.3s ease-out";
    }

    // Close if dragged down 20% or more
    if (isDragging && finalTranslateY >= closeThreshold) {
      setIsClosingViaDrag(true);
      setIsDragging(false);

      // Animate to bottom
      if (sidebarRef.current) {
        sidebarRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        sidebarRef.current.style.transform = "translateY(100%)";
      }

      if (overlay) {
        overlay.style.transition = "opacity 0.3s ease-out";
        overlay.style.opacity = "0";
      }

      // Close after animation completes
      setTimeout(() => {
        onClose();
        document.body.style.overflowY = "auto";
        // Reset transform after close
        setTimeout(() => {
          if (sidebarRef.current) {
            sidebarRef.current.style.transition = "none";
            sidebarRef.current.style.transform = "translateY(100%)";
          }
          setIsClosingViaDrag(false);
        }, 50);
      }, 300);
    } else {
      // Reset to original position smoothly
      setIsDragging(false);
      if (sidebarRef.current) {
        sidebarRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        sidebarRef.current.style.transform = "translateY(0px)";
      }
      if (overlay) {
        overlay.style.transition = "opacity 0.3s ease-out";
        overlay.style.opacity = "1";
      }
    }

    // Reset drag state
    dragStateRef.current = {
      startY: 0,
      startTranslateY: 0,
      currentTranslateY: 0,
      hasMoved: false,
      startedFromDragHandle: false,
    };
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e) => {
    // Only allow drag if started from drag handle
    const target = e.target.closest("[data-drag-handle]");
    if (!target) {
      dragStateRef.current.startY = 0;
      dragStateRef.current.startedFromDragHandle = false;
      return;
    }

    try {
      if (e.cancelable !== false) {
        e.preventDefault();
      }
    } catch (err) {
      // Ignore preventDefault errors
    }
    e.stopPropagation();
    if (!sidebarRef.current) return;

    dragStateRef.current.startY = e.clientY;
    dragStateRef.current.hasMoved = false;
    dragStateRef.current.startedFromDragHandle = true;

    // Get current transform value
    const currentTransform = window.getComputedStyle(
      sidebarRef.current
    ).transform;
    if (currentTransform && currentTransform !== "none") {
      const matrix = new DOMMatrix(currentTransform);
      dragStateRef.current.startTranslateY = matrix.m42 || 0;
    } else {
      dragStateRef.current.startTranslateY = 0;
    }
    dragStateRef.current.currentTranslateY =
      dragStateRef.current.startTranslateY;
  };

  const handleMouseMove = (e) => {
    if (!sidebarRef.current) return;

    // Only allow drag if it started from drag handle
    if (
      !dragStateRef.current.startedFromDragHandle ||
      dragStateRef.current.startY === 0
    ) {
      return;
    }

    const currentY = e.clientY;
    const deltaY = currentY - dragStateRef.current.startY;
    const absDeltaY = Math.abs(deltaY);

    // Minimum movement threshold (10px) before starting drag
    if (!isDragging && absDeltaY > 10) {
      // Only start dragging if moving down
      if (deltaY > 0) {
        const newTranslateY = Math.max(
          0,
          dragStateRef.current.startTranslateY + deltaY
        );
        if (sidebarRef.current) {
          sidebarRef.current.style.transition = "none";
          sidebarRef.current.style.transform = `translateY(${newTranslateY}px)`;
        }

        dragStateRef.current.currentTranslateY = newTranslateY;
        dragStateRef.current.hasMoved = true;
        setIsDragging(true);

        // Prevent body scroll during drag
        document.body.style.overflow = "hidden";

        try {
          if (e.cancelable !== false) {
            e.preventDefault();
          }
        } catch (err) {
          // Ignore preventDefault errors
        }
        e.stopPropagation();
        return;
      } else {
        // Moving up - reset and allow scroll
        dragStateRef.current.startY = 0;
        dragStateRef.current.startedFromDragHandle = false;
        return;
      }
    }

    if (!isDragging || !dragStateRef.current.hasMoved) return;

    try {
      if (e.cancelable !== false) {
        e.preventDefault();
      }
    } catch (err) {
      // Ignore preventDefault errors
    }
    e.stopPropagation();

    // Calculate new translateY based on starting position + delta
    let newTranslateY = dragStateRef.current.startTranslateY + deltaY;

    // Only allow dragging down (positive translateY)
    newTranslateY = Math.max(0, newTranslateY);

    // Apply transform in pixels for smooth movement
    sidebarRef.current.style.transform = `translateY(${newTranslateY}px)`;
    dragStateRef.current.currentTranslateY = newTranslateY;

    // Update overlay opacity
    const sidebarHeight =
      sidebarRef.current.offsetHeight || window.innerHeight * 0.9;
    const progress = Math.min(newTranslateY / sidebarHeight, 1);
    const opacity = 1 - progress * 0.5;

    const overlay = document.querySelector(".mobile-sidebar-overlay");
    if (overlay) {
      overlay.style.opacity = opacity;
      overlay.style.transition = "none";
    }
  };

  const handleMouseUp = (e) => {
    // If no actual drag happened, just reset
    if (!isDragging && !dragStateRef.current.hasMoved) {
      dragStateRef.current = {
        startY: 0,
        startTranslateY: 0,
        currentTranslateY: 0,
        hasMoved: false,
        startedFromDragHandle: false,
      };
      return;
    }

    try {
      if (e.cancelable !== false) {
        e.preventDefault();
      }
    } catch (err) {
      // Ignore preventDefault errors
    }
    e.stopPropagation();

    const finalTranslateY = dragStateRef.current.currentTranslateY;
    const sidebarHeight =
      sidebarRef.current?.offsetHeight || window.innerHeight * 0.9;
    // Close if dragged down 20% or more of sidebar height
    const closeThreshold = sidebarHeight * 0.2;

    // Re-enable transition for smooth animation
    if (sidebarRef.current) {
      sidebarRef.current.style.transition =
        "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    }

    const overlay = document.querySelector(".mobile-sidebar-overlay");
    if (overlay) {
      overlay.style.transition = "opacity 0.3s ease-out";
    }

    // Close if dragged down 20% or more
    if (isDragging && finalTranslateY >= closeThreshold) {
      setIsClosingViaDrag(true);
      setIsDragging(false);

      // Animate to bottom
      if (sidebarRef.current) {
        sidebarRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        sidebarRef.current.style.transform = "translateY(100%)";
      }

      if (overlay) {
        overlay.style.transition = "opacity 0.3s ease-out";
        overlay.style.opacity = "0";
      }

      // Close after animation completes
      setTimeout(() => {
        onClose();
        document.body.style.overflowY = "auto";
        // Reset transform after close
        setTimeout(() => {
          if (sidebarRef.current) {
            sidebarRef.current.style.transition = "none";
            sidebarRef.current.style.transform = "translateY(100%)";
          }
          setIsClosingViaDrag(false);
        }, 50);
      }, 300);
    } else {
      // Reset to original position smoothly
      setIsDragging(false);
      if (sidebarRef.current) {
        sidebarRef.current.style.transition =
          "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        sidebarRef.current.style.transform = "translateY(0px)";
      }
      if (overlay) {
        overlay.style.transition = "opacity 0.3s ease-out";
        overlay.style.opacity = "1";
      }
    }

    // Reset drag state
    dragStateRef.current = {
      startY: 0,
      startTranslateY: 0,
      currentTranslateY: 0,
      hasMoved: false,
      startedFromDragHandle: false,
    };
  };

  // Global mouse and touch event listeners for drag
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
    };

    const handleGlobalMouseUp = (e) => {
      handleMouseUp(e);
    };

    const handleGlobalTouchMove = (e) => {
      handleTouchMove(e);
    };

    const handleGlobalTouchEnd = (e) => {
      handleTouchEnd(e);
    };

    // Always add listeners when sidebar is open
    document.addEventListener("mousemove", handleGlobalMouseMove, {
      passive: false,
    });
    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: false,
    });
    document.addEventListener("touchend", handleGlobalTouchEnd);
    document.addEventListener("touchcancel", handleGlobalTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
      document.removeEventListener("touchcancel", handleGlobalTouchEnd);
    };
  }, [isOpen, isDragging]);

  // Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, [isOpen]);

  // Handle sidebar position when opening/closing (without drag)
  useEffect(() => {
    if (!sidebarRef.current) return;

    // Only apply transform if not dragging and not closing via drag
    if (!isDragging && !isClosingViaDrag && !dragStateRef.current.hasMoved) {
      const timeoutId = setTimeout(() => {
        if (!sidebarRef.current) return;
        // Don't interfere if we're in the middle of a drag operation
        if (dragStateRef.current.hasMoved || isDragging) return;

        if (isOpen) {
          sidebarRef.current.style.transition =
            "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
          requestAnimationFrame(() => {
            if (
              sidebarRef.current &&
              !dragStateRef.current.hasMoved &&
              !isDragging
            ) {
              sidebarRef.current.style.transform = "translateY(0px)";
            }
          });
        } else {
          sidebarRef.current.style.transition =
            "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
          sidebarRef.current.style.transform = "translateY(100%)";
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isDragging, isClosingViaDrag]);

  // Set initial position on mount
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.style.transform = "translateY(100%)";
      sidebarRef.current.style.transition = "none";
    }
  }, []);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="mobile-sidebar-overlay fixed inset-0 bg-black/20 z-50 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          style={{
            opacity: 1,
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        ref={sidebarRef}
        id="mobile-sidebar"
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl dark:shadow-none z-50 lg:hidden"
        style={{
          maxHeight: "90vh",
          willChange: isDragging ? "transform" : "auto",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Drag Handle */}
        <div
          data-drag-handle
          className="flex justify-center items-center py-4 cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onMouseDown={handleMouseDown}
          style={{
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Sidebar Content */}
        <div
          className="px-4 pb-4 overflow-y-auto"
          style={{
            maxHeight: "calc(90vh - 60px)",
            touchAction: isDragging ? "none" : "pan-y",
            pointerEvents: isDragging ? "none" : "auto",
          }}
        >
          {/* Children Content */}
          {children}
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
