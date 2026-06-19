"use client";

import { useState, useEffect } from "react";
import { HiRefresh } from "react-icons/hi";
import StatsCard from "@/components/admin/StatsCard";
import RecentActivity from "@/components/admin/RecentActivity";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalStates: 0,
    totalDistricts: 0,
    totalUsers: 0,
    totalExams: 0,
    totalCourses: 0,
    totalFacilities: 0,
    totalAffiliations: 0,
    totalStreams: 0,
    totalDegrees: 0,
    totalCourseDurations: 0,
    totalExamTypes: 0,
    totalRankings: 0,
    totalOwnerships: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error("Failed to fetch stats:", data.error);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const dashboardStats = [
    {
      name: "Users",
      value: stats.totalUsers,
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-primary",
      href: "/admin/users",
    },
    {
      name: "States",
      value: stats.totalStates,
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-secondary",
      href: "/admin/location/state",
    },
    {
      name: "Districts",
      value: stats.totalDistricts,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
      ),
      color: "bg-primary",
      href: "/admin/location/district",
    },
    {
      name: "Streams",
      value: stats.totalStreams,
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-secondary",
      href: "/admin/master/stream",
    },
    {
      name: "Degrees",
      value: stats.totalDegrees,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
      color: "bg-primary",
      href: "/admin/master/degree",
    },
    {
      name: "Courses",
      value: stats.totalCourses,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
      color: "bg-secondary",
      href: "/admin/master/course-name",
    },
    {
      name: "Affiliations",
      value: stats.totalAffiliations,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
          />
        </svg>
      ),
      color: "bg-primary-800",
      href: "/admin/master/affilication",
    },
    {
      name: "Exam Types",
      value: stats.totalExamTypes,
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-secondary-800",
      href: "/admin/exam/exam-type",
    },
    {
      name: "Rankings",
      value: stats.totalRankings,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228V2.721A47.778 47.778 0 0012 2.25c-2.291 0-4.545.16-6.75.47v1.516M7.73 9.728v-3.228l8.272 6.842m0 0a6.726 6.726 0 01-2.748 1.35m0 0V14.5c0 3.061 2.462 5.5 5.5 5.5v-3.226m-5.5-9.728H12m0 0c2.552 0 4.6-.852 6.248-2.226m-6.248 2.226c-2.552 0-4.6-.852-6.248-2.226m12.496 0a9.988 9.988 0 00-12.496 0"
          />
        </svg>
      ),
      color: "bg-primary",
      href: "/admin/master/ranking",
    },
    {
      name: "Ownerships",
      value: stats.totalOwnerships,
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-secondary",
      href: "/admin/master/ownership",
    },
    {
      name: "Facilities",
      value: stats.totalFacilities,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
          />
        </svg>
      ),
      color: "bg-primary-800",
      href: "/admin/master/college-facility",
    },
    {
      name: "Colleges",
      value: stats.totalColleges,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 01-7.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
          />
        </svg>
      ),
      color: "bg-secondary",
      href: "/admin/college",
    },
  ];

  if (loading) {
    return (
      <div className="h-full p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="mb-4 sm:mb-6">
          <div className="h-6 sm:h-8 bg-gray-200 dark:bg-slate-800 rounded-md w-48 sm:w-64 mb-2 animate-pulse"></div>
          <div className="h-4 sm:h-6 bg-gray-200 dark:bg-slate-800 rounded-md w-72 sm:w-96 animate-pulse"></div>
        </div>

        {/* Responsive loading grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 rounded-lg shadow-sm p-3 sm:p-4 transition-colors duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 sm:w-20 mb-2 animate-pulse"></div>
                    <div className="h-4 sm:h-5 bg-gray-200 dark:bg-slate-800 rounded w-12 sm:w-15 animate-pulse"></div>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page header - Responsive */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
            Welcome to CCIC Admin Panel. Here's an overview of your system.
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-white bg-white dark:bg-slate-900 hover:bg-primary-50 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {refreshing ? (
            <>
              <HiRefresh className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500 dark:text-white/70" />
              Refreshing...
            </>
          ) : (
            <>
              <HiRefresh className="-ml-1 mr-2 h-4 w-4" />
              Refresh Stats
            </>
          )}
        </button>
      </div>

      {/* Stats grid - Fully responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {dashboardStats.map((stat) => (
          <StatsCard
            key={stat.name}
            name={stat.name}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            href={stat.href}
          />
        ))}
      </div>

      {/* Recent Activity - Full Width */}
      <div>
        <RecentActivity />
      </div>
    </div>
  );
}
