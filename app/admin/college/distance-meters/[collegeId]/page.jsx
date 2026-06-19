"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import { showError, showSuccess } from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

export default function CollegeDistanceMetersPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const collegeId = params?.collegeId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState(null);

  const [distanceMetersOptions, setDistanceMetersOptions] = useState([]);
  const [selectedDistanceMeterIds, setSelectedDistanceMeterIds] = useState([]);
  const [assignedDistanceMeters, setAssignedDistanceMeters] = useState([]);

  const makeAuthenticatedRequest = useCallback(
    async (url, options = {}) => {
      const token = getAccessToken();
      if (!token) {
        showError("Authentication required. Please log in again.");
        return { success: false, error: "Authentication required" };
      }

      const defaultHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {}),
        },
      });

      return response.json();
    },
    [getAccessToken]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!collegeId) return;
      try {
        setLoading(true);

        const [collegeRes, distanceMetersRes, collegeDistanceMetersRes] =
          await Promise.all([
            fetch(`/api/colleges/${collegeId}`),
            fetch("/api/distance-meters?all=true"),
            fetch(`/api/colleges/${collegeId}/distance-meters`),
          ]);

        const collegeData = await collegeRes.json();
        const distanceMetersData = await distanceMetersRes.json();
        const collegeDistanceMetersData = await collegeDistanceMetersRes.json();

        if (!collegeData.success) {
          showError(collegeData.error || "Failed to load college information.");
        } else {
          setCollegeInfo(collegeData.data);
        }

        if (!distanceMetersData.success) {
          showError(
            distanceMetersData.error || "Failed to load distance meters."
          );
        } else {
          const options = (
            distanceMetersData.data?.distanceMeters ||
            distanceMetersData.data ||
            []
          ).map((distanceMeter) => ({
            value: distanceMeter._id,
            label: distanceMeter.name,
            meta: distanceMeter,
          }));
          setDistanceMetersOptions(options);
        }

        if (
          collegeDistanceMetersData.success &&
          collegeDistanceMetersData.data
        ) {
          const normalized = (
            collegeDistanceMetersData.data.distanceMeters || []
          ).map((item) => ({
            distanceMeterId: item.distanceMeterId || "",
            distanceMeterName:
              item.distanceMeterName || "Selected Distance Meter",
            value: item.value !== undefined ? item.value.toString() : "",
          }));

          setAssignedDistanceMeters(normalized);
          setSelectedDistanceMeterIds(
            normalized.map((entry) => entry.distanceMeterId).filter(Boolean)
          );
        }
      } catch (error) {
        console.error("Error loading college distance meters data:", error);
        showError("Failed to load college distance meters.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [collegeId]);

  const handleDistanceMeterSelectionChange = (value) => {
    const values = Array.isArray(value) ? value : [];

    const addedDistanceMeters = values.filter(
      (distanceMeterId) => !selectedDistanceMeterIds.includes(distanceMeterId)
    );
    const removedDistanceMeters = selectedDistanceMeterIds.filter(
      (distanceMeterId) => !values.includes(distanceMeterId)
    );

    if (addedDistanceMeters.length) {
      setAssignedDistanceMeters((prev) => {
        const additions = addedDistanceMeters.map((distanceMeterId) => {
          const option = distanceMetersOptions.find(
            (distanceMeter) => distanceMeter.value === distanceMeterId
          );
          return {
            distanceMeterId,
            distanceMeterName: option?.label || "Selected Distance Meter",
            value: "",
          };
        });
        return [...prev, ...additions];
      });
    }

    if (removedDistanceMeters.length) {
      setAssignedDistanceMeters((prev) =>
        prev.filter(
          (entry) => !removedDistanceMeters.includes(entry.distanceMeterId)
        )
      );
    }

    setSelectedDistanceMeterIds(values);
  };

  const handleValueChange = (distanceMeterId, value) => {
    if (value !== "" && (Number.isNaN(Number(value)) || Number(value) < 0)) {
      return;
    }
    setAssignedDistanceMeters((prev) =>
      prev.map((entry) =>
        entry.distanceMeterId === distanceMeterId ? { ...entry, value } : entry
      )
    );
  };

  const handleSave = async () => {
    const invalidEntries = assignedDistanceMeters.filter(
      (entry) => !entry.value || entry.value === "" || Number(entry.value) < 0
    );

    if (invalidEntries.length) {
      showError(
        "Please enter valid distance values for all selected distance meters."
      );
      return;
    }

    const payload = assignedDistanceMeters.map((entry) => ({
      distanceMeter: entry.distanceMeterId,
      value: Number(entry.value),
    }));

    try {
      setSaving(true);
      const data = await makeAuthenticatedRequest(
        `/api/colleges/${collegeId}/distance-meters`,
        {
          method: "PUT",
          body: JSON.stringify({ distanceMeters: payload }),
        }
      );

      if (data.success) {
        showSuccess("Distance meters saved successfully!");
        const updated = (data.data?.distanceMeters || []).map((item) => ({
          distanceMeterId: item.distanceMeterId || "",
          distanceMeterName:
            item.distanceMeterName || "Selected Distance Meter",
          value: item.value !== undefined ? item.value.toString() : "",
        }));
        setAssignedDistanceMeters(updated);
        setSelectedDistanceMeterIds(
          updated.map((entry) => entry.distanceMeterId)
        );
      } else {
        showError(data.error || "Failed to save distance meters.");
      }
    } catch (error) {
      console.error("Error saving distance meters:", error);
      showError("Failed to save distance meters.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-gray-200 dark:bg-slate-800 rounded"></div>
            <div className="h-12 w-full bg-gray-200 dark:bg-slate-800 rounded"></div>
            <div className="h-64 w-full bg-gray-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/60 mb-1">
              <Link
                href="/admin/college"
                className="hover:underline text-primary no-underline"
              >
                Colleges
              </Link>
              <span>/</span>
              <span>Distance Meters</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Assign Distance Meters
              {collegeInfo && (
                <span className="text-sm font-normal text-gray-600 dark:text-white/70 ml-2">
                  • {collegeInfo.name}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/college"
              className="px-4 py-2 text-sm text-gray-700 dark:text-white/80 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !selectedDistanceMeterIds.length}
              className="px-4 py-2 text-sm text-white bg-primary rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Distance Meters"}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
              Select Distance Meters to Assign
            </label>
            <ApnaSelect
              title=""
              options={distanceMetersOptions}
              value={selectedDistanceMeterIds}
              onChange={handleDistanceMeterSelectionChange}
              placeholder="Search and select distance meters..."
              searchable={true}
              multiple={true}
              className="w-full"
            />
          </div>

          {!selectedDistanceMeterIds.length ? (
            <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center text-sm text-gray-600 dark:text-white/60">
              Select one or more distance meters from the dropdown above to
              begin assigning distance values.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedDistanceMeters.map((entry) => (
                <div
                  key={entry.distanceMeterId}
                  className="border border-gray-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900/70 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 flex-1">
                      {entry.distanceMeterName}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedDistanceMeterIds((prev) =>
                          prev.filter((id) => id !== entry.distanceMeterId)
                        );
                        setAssignedDistanceMeters((prev) =>
                          prev.filter(
                            (item) =>
                              item.distanceMeterId !== entry.distanceMeterId
                          )
                        );
                      }}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors shrink-0"
                      title="Remove"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1">
                      Distance Value (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.value}
                      onChange={(e) =>
                        handleValueChange(entry.distanceMeterId, e.target.value)
                      }
                      placeholder="Enter distance"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
