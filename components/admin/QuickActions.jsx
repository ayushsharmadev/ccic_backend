"use client";

import Link from "next/link";

const actions = [
  {
    name: "My Profile",
    description: "Update profile and settings",
    href: "/admin/profile",
    icon: (
      <svg
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
    color: "bg-primary hover:bg-primary-600",
  },
  {
    name: "Add College",
    description: "Create a new college record for any stream or course",
    href: "/admin/college/add",
    icon: (
      <svg
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    ),
    color: "bg-secondary hover:bg-secondary-600",
  },
  {
    name: "Manage States",
    description: "Add or edit state information",
    href: "/admin/location/state",
    icon: (
      <svg
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    ),
    color: "bg-primary-600 hover:bg-primary-700",
  },
  {
    name: "Add MBBS Exam",
    description: "Create new Bangladesh exam entry",
    href: "/admin/exam/add",
    icon: (
      <svg
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
    ),
    color: "bg-secondary-600 hover:bg-secondary-700",
  },
  {
    name: "User Management",
    description: "Manage system users",
    href: "/admin/users",
    icon: (
      <svg
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
    color: "bg-primary-500 hover:bg-primary-600",
  },
];

export default function QuickActions() {
  return (
    <div className="card p-3 sm:p-4 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
        Quick Actions
      </h3>
      <div className="space-y-1.5 sm:space-y-2">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className={`flex items-center p-2 sm:p-2.5 rounded-lg text-white transition-colors ${action.color}`}
          >
            <div className="shrink-0">{action.icon}</div>
            <div className="ml-2 sm:ml-2.5 min-w-0 flex-1">
              <p className="text-xs sm:text-xs font-medium truncate">
                {action.name}
              </p>
              <p className="text-xs opacity-90 truncate">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
