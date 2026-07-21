"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

// Clean menu structure as array of objects based on provided HTML
const menuItems = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    type: "single",
  },
  {
    id: "users",
    name: "Users",
    href: "/admin/users",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
    type: "single",
  },

  {
    id: "location",
    name: "Location Directory",
    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
    type: "dropdown",
    children: [
      {
        name: "Country",
        href: "/admin/location/country",
        icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "State",
        href: "/admin/location/state",
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
      },
      {
        name: "District",
        href: "/admin/location/district",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      },
    ],
  },
  {
    id: "master",
    name: "Master Data",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
    type: "dropdown",
    children: [
      {
        name: "Stream",
        href: "/admin/master/stream",
        icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
      },
      {
        name: "Degree Type",
        href: "/admin/master/degree",
        icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
      },
      {
        name: "Course",
        href: "/admin/master/course",
        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      },
      {
        name: "Course Duration",
        href: "/admin/master/course-duration",
        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Currency",
        href: "/admin/master/currency",
        icon: "M12 6v12m3-9.5C15 7.12 13.66 6 12 6s-3 1.12-3 2.5 1.34 2.5 3 2.5 3 1.12 3 2.5S13.66 18 12 18s-3-1.12-3-2.5M5 12h14",
      },
      {
        name: "Affiliation Name",
        href: "/admin/master/affilication",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      },
      {
        name: "Approved Through",
        href: "/admin/master/approved-through",
        icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      },
      {
        name: "Exam Type",
        href: "/admin/master/exam-type",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
      {
        name: "Ranking",
        href: "/admin/master/ranking",
        icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
      },
      {
        name: "Ownership",
        href: "/admin/master/ownership",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      },
      {
        name: "College-Facilities",
        href: "/admin/master/college-facility",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      },
      {
        name: "Hospital-Facilities",
        href: "/admin/master/hospital-facility",
        icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      },
      {
        name: "Hostel-Facilities",
        href: "/admin/master/hostel-facility",
        icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5zM8 9h8M8 13h8M8 17h4",
      },
      {
        name: "Language",
        href: "/admin/languages",
        icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Distance Meter",
        href: "/admin/distance-meters",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
  {
    id: "college",
    name: "College Master",
    icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    type: "dropdown",
    children: [
      {
        name: "Add College",
        href: "/admin/college/add",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "College List",
        href: "/admin/college",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
  {
    id: "country",
    name: "Country Master",
    icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    type: "dropdown",
    children: [
      {
        name: "Add Country",
        href: "/admin/country/add",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "Country List",
        href: "/admin/country",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
  {
    id: "news",
    name: "News Management",
    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
    type: "dropdown",
    children: [
      {
        name: "Categories",
        href: "/admin/news-categories",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
      {
        name: "Add News",
        href: "/admin/news/add",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "News List",
        href: "/admin/news",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
  {
    id: "pages",
    name: "Page Master",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    type: "dropdown",
    children: [
      {
        name: "Categories",
        href: "/admin/page-categories",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
      {
        name: "Add Page",
        href: "/admin/pages/create",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "Pages List",
        href: "/admin/pages",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
  {
    id: "notices",
    name: "Global Notices",
    href: "/admin/notices",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    type: "single",
  },
  {
    id: "footer-sections",
    name: "Footer Sections",
    href: "/admin/footer-sections",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    type: "single",
  },
  {
    id: "enquiries",
    name: "Enquiry Master",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    type: "dropdown",
    children: [
      {
        name: "Student Enquiries",
        href: "/admin/enquiries/students",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
      {
        name: "Contact Enquiries",
        href: "/admin/enquiries/contacts",
        icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      },
      {
        name: "Eligibility Checks",
        href: "/admin/enquiries/eligibility-checks",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        name: "Newsletter Subscribers",
        href: "/admin/enquiries/newsletter-subscriptions",
        icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      },
    ],
  },
  {
    id: "reviews",
    name: "Reviews",
    href: "/admin/reviews",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    type: "single",
  },
  {
    id: "blogs",
    name: "Blog Management",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    type: "dropdown",
    children: [
      {
        name: "Categories",
        href: "/admin/blog-categories",
        icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
      },
      {
        name: "Add Blog",
        href: "/admin/blogs/add",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "Blogs List",
        href: "/admin/blogs",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
  {
    id: "testimonials",
    name: "Testimonials",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    type: "dropdown",
    children: [
      {
        name: "Add Testimonial",
        href: "/admin/testimonials/add",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "Testimonials List",
        href: "/admin/testimonials",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
  {
    id: "exam",
    name: "Exam Master",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    type: "dropdown",
    children: [
      {
        name: "Exam Level",
        href: "/admin/exam/level",
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
      },
      {
        name: "Add Exam",
        href: "/admin/exam/add",
        icon: "M12 4v16m8-8H4",
      },
      {
        name: "Exam List",
        href: "/admin/exam",
        icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
      },
    ],
  },
];

// Icon component
const Icon = ({ path, className = "h-5 w-5" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  // Helper function to determine if any child of a menu item is active
  const isParentActive = (children) =>
    children?.some((child) => pathname === child.href);

  // Helper function to get initially expanded items based on current path
  const getInitiallyExpandedItems = () => {
    const expanded = [];
    menuItems.forEach((item) => {
      if (item.type === "dropdown" && isParentActive(item.children)) {
        expanded.push(item.id);
      }
    });
    return expanded;
  };

  const [expandedItems, setExpandedItems] = useState(
    getInitiallyExpandedItems()
  );

  // Update expanded items when pathname changes
  useEffect(() => {
    setExpandedItems(getInitiallyExpandedItems());
  }, [pathname]);

  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isCurrentPath = (href) => pathname === href;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-colors duration-300 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 z-50 w-64 bg-white/90 dark:bg-slate-950/95 backdrop-blur-xl border-r border-white/20 dark:border-slate-900/60 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:bg-white dark:lg:bg-slate-950 lg:backdrop-blur-none lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-14 px-4 border-b border-white/10 dark:border-slate-900/60 backdrop-blur-sm lg:border-gray-200 dark:lg:border-slate-900 lg:backdrop-blur-none transition-colors duration-300">
            <div className="flex gap-2 items-center">
              {/* <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--primary-900))",
                }}
              >
                <span className="text-white font-bold text-sm">BA</span>
              </div> */}
              <Image src="/fav.png" alt="CCIC" className="h-8 w-8 object-contain" width={30} height={30} />
              <span className="font-bold text-gray-900 dark:text-white lg:text-gray-900 text-lg dark:lg:text-primary">
                CCIC
              </span>
              {/* <Image
                src="/mainLogo.png"
                alt="CCIC"
                width={130}
                height={30}
                className="h-8 w-auto object-contain"
                priority
              /> */}
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="ml-auto lg:hidden p-2 rounded-md text-gray-500 dark:text-white/70 hover:text-gray-700 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              <svg
                className="h-5 w-5"
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
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-1 p-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  {item.type === "single" ? (
                    <Link
                      href={item.href}
                      onClick={() => {
                        // Close sidebar on mobile when link is clicked
                        if (
                          typeof window !== "undefined" &&
                          window.innerWidth < 1024
                        ) {
                          onClose();
                        }
                      }}
                      className={`flex items-center justify-start px-3 py-2 text-sm font-medium rounded-md transition-all ${
                        isCurrentPath(item.href)
                          ? "bg-primary text-white shadow-lg"
                          : "text-gray-700 dark:text-white/70 hover:text-primary dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary/15"
                      }`}
                    >
                      <Icon
                        path={item.icon}
                        className="mr-3 h-5 w-5 flex-shrink-0"
                      />
                      <span className="text-left">{item.name}</span>
                    </Link>
                  ) : (
                    <div>
                      <button
                        type="button"
                        className={`flex items-center justify-start w-full px-3 py-2 text-sm font-medium rounded-md transition-all ${
                          isParentActive(item.children)
                            ? "bg-primary-50 text-primary dark:bg-primary/15 dark:text-primary-200"
                            : "text-gray-700 dark:text-white/70 hover:text-primary dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary/15"
                        }`}
                        onClick={() => toggleExpanded(item.id)}
                      >
                        <Icon
                          path={item.icon}
                          className="mr-3 h-5 w-5 flex-shrink-0"
                        />
                        <span className="flex-1 text-left">{item.name}</span>
                        <Icon
                          path="M8.25 4.5l7.5 7.5-7.5 7.5"
                          className={`h-4 w-4 ml-auto transition-transform flex-shrink-0 ${
                            expandedItems.includes(item.id) ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                      {expandedItems.includes(item.id) && (
                        <ul className="mt-1 space-y-1">
                          {item.children.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                onClick={() => {
                                  // Close sidebar on mobile when link is clicked
                                  if (
                                    typeof window !== "undefined" &&
                                    window.innerWidth < 1024
                                  ) {
                                    onClose();
                                  }
                                }}
                                className={`flex items-center justify-start pl-11 pr-3 py-2 text-sm rounded-md transition-all ${
                                  isCurrentPath(subItem.href)
                                    ? "bg-primary text-white font-medium shadow-md"
                                    : "text-gray-600 dark:text-white/60 hover:text-primary dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary/15"
                                }`}
                              >
                                <Icon
                                  path={subItem.icon}
                                  className="mr-3 h-4 w-4 flex-shrink-0"
                                />
                                <span className="text-left">
                                  {subItem.name}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
