"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-lg w-full">
        <div className="rounded-2xl border border-red-100 dark:border-red-500/20 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-red-500 to-rose-600 p-6 text-center text-white">
            <div className="mx-auto h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-white/90 text-sm">
              You do not have permission to access this page.
            </p>
          </div>

          <div className="p-6 space-y-3">
            <Link
              href="/admin/dashboard"
              className="block w-full bg-primary text-white py-3 px-4 rounded-xl hover:bg-primary-600 transition-colors font-medium text-center"
            >
              Go to Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="block w-full bg-gray-800 text-white py-3 px-4 rounded-xl hover:bg-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Sign Out
            </button>

            <Link
              href="/login"
              className="block w-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white/80 py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
