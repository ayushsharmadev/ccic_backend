"use client";

import Link from "next/link";

export default function StatsCard({ name, value, icon, color, href }) {
  const Content = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center min-w-0 flex-1">
        <div className="flex-shrink-0">
          <div
            className={`inline-flex items-center justify-center p-1.5 sm:p-2 ${color} rounded-md shadow-lg text-white`}
          >
            <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex items-center justify-center">
              {icon}
            </div>
          </div>
        </div>
        <div className="ml-2 sm:ml-4 flex-1 min-w-0">
          <div>
            <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-white/70 overflow-hidden text-ellipsis whitespace-nowrap">
              {name}
            </div>
            <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
              {value.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      {href && (
        <div className="flex-shrink-0 ml-2">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm p-3 sm:p-4 cursor-pointer hover:shadow-md hover:shadow-primary/10 transition-shadow transition-colors duration-300 h-full">
          <Content />
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm p-3 sm:p-4 transition-colors duration-300 h-full">
      <Content />
    </div>
  );
}
