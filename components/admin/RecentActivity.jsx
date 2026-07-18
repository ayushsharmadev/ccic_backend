"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HiCheckCircle,
  HiPencil,
  HiBars3,
  HiBookOpen,
  HiNewspaper,
  HiDocumentText,
  HiBell,
  HiMapPin,
  HiUser,
} from "react-icons/hi2";

// Icon mapping based on activity type
const getActivityIcon = (icon, color) => {
  const iconClass = `h-3 w-3 sm:h-4 sm:w-4 ${
    color === "green"
      ? "text-green-600 dark:text-green-400"
      : color === "secondary"
      ? "text-secondary dark:text-secondary-300"
      : "text-primary dark:text-primary-300"
  }`;

  switch (icon) {
    case "add":
      return <HiCheckCircle className={iconClass} />;
    case "edit":
    case "update":
      return <HiPencil className={iconClass} />;
    case "exam":
      return <HiBars3 className={iconClass} />;
    case "course":
      return <HiBookOpen className={iconClass} />;
    case "news":
      return <HiNewspaper className={iconClass} />;
    case "blog":
      return <HiDocumentText className={iconClass} />;
    case "notice":
      return <HiBell className={iconClass} />;
    case "location":
      return <HiMapPin className={iconClass} />;
    case "user":
      return <HiUser className={iconClass} />;
    default:
      return <HiCheckCircle className={iconClass} />;
  }
};

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch("/api/admin/recent-activities?limit=10", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setActivities(data.data);
        } else {
          console.error("Failed to fetch activities:", data.error);
          setActivities([]);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Refresh activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card p-3 sm:p-4 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 sm:mb-3">
          Recent Activity
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-2">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-slate-800 rounded w-3/4 mb-1 animate-pulse"></div>
                <div className="h-2 bg-gray-200 dark:bg-slate-800 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-3 sm:p-4 bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
          Recent Activity
        </h3>
      </div>

      <div className="flow-root">
        <ul role="list" className="-mb-3 sm:-mb-4">
          {activities.length === 0 && !loading ? (
            <li className="text-xs text-gray-500 dark:text-white/60 text-center py-4">
              No recent activity
            </li>
          ) : (
            activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-3 sm:pb-4">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute left-3 sm:left-4 top-3 sm:top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-slate-800"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex gap-2 sm:gap-3">
                    <div className="shrink-0">
                      <span
                        className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full ${
                          activity.color === "green"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : activity.color === "secondary"
                            ? "bg-secondary-50 dark:bg-secondary-900/20"
                            : "bg-primary-50 dark:bg-primary-900/20"
                        } flex items-center justify-center ring-2 sm:ring-4 ring-white dark:ring-slate-900`}
                      >
                        {getActivityIcon(activity.icon, activity.color)}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      {activity.href ? (
                        <Link
                          href={activity.href}
                          className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
                        >
                          <p className="text-xs font-medium text-gray-900 dark:text-white break-words">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white/60 break-words">
                            {activity.description}
                          </p>
                        </Link>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-white break-words">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white/60 break-words">
                            {activity.description}
                          </p>
                        </div>
                      )}
                      <div className="whitespace-nowrap text-left text-[11px] text-gray-500 dark:text-white/60 sm:shrink-0 sm:text-right sm:text-xs">
                        <time>{activity.time}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
