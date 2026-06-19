"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaModal from "@/components/utils/ApnaModal";
import {
  showError,
  showSuccess,
  showWarning,
} from "@/components/utils/ApnaNotify";
import { useAuth } from "@/contexts/AuthContext";

const defaultModalState = {
  isOpen: false,
  rankingId: null,
  activeTab: 0,
};

export default function CollegeRankingsPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const collegeId = params?.collegeId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState(null);

  const [rankingsOptions, setRankingsOptions] = useState([]);
  const [selectedRankingIds, setSelectedRankingIds] = useState([]);
  const [assignedRankings, setAssignedRankings] = useState([]);

  const [rankingModalState, setRankingModalState] = useState(defaultModalState);

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

        const [collegeRes, rankingsRes, collegeRankingsRes] = await Promise.all(
          [
            fetch(`/api/colleges/${collegeId}`),
            fetch("/api/master/ranking?all=true"),
            fetch(`/api/colleges/${collegeId}/rankings`),
          ]
        );

        const collegeData = await collegeRes.json();
        const rankingsData = await rankingsRes.json();
        const collegeRankingsData = await collegeRankingsRes.json();

        if (!collegeData.success) {
          showError(collegeData.error || "Failed to load college information.");
        } else {
          setCollegeInfo(collegeData.data);
        }

        if (!rankingsData.success) {
          showError(rankingsData.error || "Failed to load rankings.");
        } else {
          const options = (rankingsData.data || []).map((ranking) => ({
            value: ranking._id,
            label: ranking.name,
            meta: ranking,
          }));
          setRankingsOptions(options);
        }

        if (collegeRankingsData.success && collegeRankingsData.data) {
          const normalized = (collegeRankingsData.data.rankings || []).map(
            (item) => ({
              rankingId: item.rankingId || "",
              rankingName: item.rankingName || "Selected Ranking",
              rankValue: item.rankValue || "",
              yearRankings: (item.yearRankings || []).map((yr) => ({
                year: yr.year || new Date().getFullYear(),
                rank: yr.rank !== undefined ? yr.rank.toString() : "",
                outOf: yr.outOf || 0,
                notes: yr.notes || "",
              })),
            })
          );

          setAssignedRankings(normalized);
          setSelectedRankingIds(
            normalized.map((entry) => entry.rankingId).filter(Boolean)
          );
        }
      } catch (error) {
        console.error("Error loading college rankings data:", error);
        showError("Failed to load college rankings.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [collegeId]);

  const handleRankingSelectionChange = (value) => {
    const values = Array.isArray(value) ? value : [];

    const addedRankings = values.filter(
      (rankingId) => !selectedRankingIds.includes(rankingId)
    );
    const removedRankings = selectedRankingIds.filter(
      (rankingId) => !values.includes(rankingId)
    );

    if (addedRankings.length) {
      setAssignedRankings((prev) => {
        const additions = addedRankings.map((rankingId) => {
          const option = rankingsOptions.find(
            (ranking) => ranking.value === rankingId
          );
          const outOfValue = option?.meta?.rankValue
            ? parseInt(option.meta.rankValue, 10) || 0
            : 0;
          return {
            rankingId,
            rankingName: option?.label || "Selected Ranking",
            rankValue: option?.meta?.rankValue || "",
            yearRankings: [],
          };
        });
        return [...prev, ...additions];
      });
    }

    if (removedRankings.length) {
      setAssignedRankings((prev) =>
        prev.filter((entry) => !removedRankings.includes(entry.rankingId))
      );
    }

    setSelectedRankingIds(values);
  };

  const handleOpenRankingModal = (rankingId) => {
    const entry = assignedRankings.find((r) => r.rankingId === rankingId);
    if (!entry) return;

    // Ensure at least one year ranking exists
    if (!entry.yearRankings || entry.yearRankings.length === 0) {
      setAssignedRankings((prev) =>
        prev.map((r) =>
          r.rankingId === rankingId
            ? {
                ...r,
                yearRankings: [
                  {
                    year: new Date().getFullYear(),
                    rank: "",
                    outOf: parseInt(r.rankValue, 10) || 0,
                    notes: "",
                  },
                ],
              }
            : r
        )
      );
    }

    setRankingModalState({
      isOpen: true,
      rankingId,
      activeTab: 0,
    });
  };

  const handleCloseRankingModal = () => {
    setRankingModalState(defaultModalState);
  };

  const activeRankingEntry = useMemo(
    () =>
      assignedRankings.find(
        (r) => r.rankingId === rankingModalState.rankingId
      ) || null,
    [assignedRankings, rankingModalState.rankingId]
  );

  const handleAddYear = () => {
    const rankingId = rankingModalState.rankingId;
    if (!rankingId) return;

    const entry = assignedRankings.find((r) => r.rankingId === rankingId);
    if (!entry) return;

    const newYearRanking = {
      year: new Date().getFullYear(),
      rank: "",
      outOf: parseInt(entry.rankValue, 10) || 0,
      notes: "",
    };

    setAssignedRankings((prev) =>
      prev.map((r) =>
        r.rankingId === rankingId
          ? {
              ...r,
              yearRankings: [...r.yearRankings, newYearRanking],
            }
          : r
      )
    );

    setRankingModalState((prev) => ({
      ...prev,
      activeTab: activeRankingEntry
        ? activeRankingEntry.yearRankings.length
        : 0,
    }));
  };

  const handleRemoveYear = (index) => {
    const rankingId = rankingModalState.rankingId;
    if (rankingId === null) return;

    setAssignedRankings((prev) =>
      prev.map((r) => {
        if (r.rankingId !== rankingId) return r;
        const nextYearRankings = r.yearRankings.filter(
          (_, idx) => idx !== index
        );
        return { ...r, yearRankings: nextYearRankings };
      })
    );

    setRankingModalState((prev) => ({
      ...prev,
      activeTab: Math.max(0, prev.activeTab - 1),
    }));
  };

  const handleYearFieldChange = (rankingId, yearIndex, field, value) => {
    setAssignedRankings((prev) =>
      prev.map((r) => {
        if (r.rankingId !== rankingId) return r;
        const yearRankings = r.yearRankings.map((yr, idx) =>
          idx === yearIndex ? { ...yr, [field]: value } : yr
        );
        return { ...r, yearRankings };
      })
    );
  };

  const handleRankingModalSubmit = () => {
    const entry = activeRankingEntry;
    if (!entry) {
      handleCloseRankingModal();
      return;
    }

    const hasMissing = entry.yearRankings.some((yr) => {
      if (!yr.year || yr.year < 2000 || yr.year > 2100) return true;
      if (!yr.rank || Number(yr.rank) < 1) return true;
      if (Number(yr.rank) > yr.outOf) return true;
      return false;
    });

    if (hasMissing) {
      showWarning(
        "Please provide valid year and rank for every year ranking before saving."
      );
      return;
    }

    handleCloseRankingModal();
  };

  const handleSaveRankings = async () => {
    if (!selectedRankingIds.length) {
      showWarning("Please select at least one ranking to assign.");
      return;
    }

    const invalidEntries = assignedRankings.filter((entry) => {
      if (!entry.yearRankings || entry.yearRankings.length === 0) return true;
      return entry.yearRankings.some((yr) => {
        if (!yr.year || yr.year < 2000 || yr.year > 2100) return true;
        if (!yr.rank || Number(yr.rank) < 1) return true;
        if (Number(yr.rank) > yr.outOf) return true;
        return false;
      });
    });

    if (invalidEntries.length) {
      showError(
        "Please ensure all rankings have valid year rankings configured."
      );
      return;
    }

    const payload = assignedRankings.map((entry) => ({
      ranking: entry.rankingId,
      yearRankings: entry.yearRankings.map((yr) => ({
        year: Number(yr.year),
        rank: Number(yr.rank),
        outOf: Number(yr.outOf),
        notes: yr.notes || undefined,
      })),
    }));

    try {
      setSaving(true);
      const data = await makeAuthenticatedRequest(
        `/api/colleges/${collegeId}/rankings`,
        {
          method: "PUT",
          body: JSON.stringify({ rankings: payload }),
        }
      );

      if (data.success) {
        showSuccess("Rankings saved successfully!");
        const updated = (data.data?.rankings || []).map((item) => ({
          rankingId: item.rankingId || "",
          rankingName: item.rankingName || "Selected Ranking",
          rankValue: item.rankValue || "",
          yearRankings: (item.yearRankings || []).map((yr) => ({
            year: yr.year || new Date().getFullYear(),
            rank: yr.rank !== undefined ? yr.rank.toString() : "",
            outOf: yr.outOf || 0,
            notes: yr.notes || "",
          })),
        }));
        setAssignedRankings(updated);
        setSelectedRankingIds(updated.map((entry) => entry.rankingId));
      } else {
        showError(data.error || "Failed to save rankings.");
      }
    } catch (error) {
      console.error("Error saving rankings:", error);
      showError("Failed to save rankings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="mb-4">
          <div className="h-6 w-56 bg-gray-200 dark:bg-slate-800 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-72 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-4 shadow-sm"
            >
              <div className="h-4 w-40 bg-gray-200 dark:bg-slate-800 rounded animate-pulse mb-3"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
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
            <span>Rankings</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {collegeInfo?.name || "Assign Rankings"}
          </h1>
          <p className="text-xs text-gray-600 dark:text-white/70">
            Assign rankings to the college and configure year-wise ranking
            details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSaveRankings}
            disabled={saving}
            className="px-4 py-1.5 text-xs bg-primary hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Rankings"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
            Select Rankings to Assign
          </label>
          <ApnaSelect
            title=""
            options={rankingsOptions}
            value={selectedRankingIds}
            onChange={handleRankingSelectionChange}
            placeholder="Search and select rankings..."
            searchable={true}
            multiple={true}
            className="w-full"
          />
        </div>

        {!selectedRankingIds.length ? (
          <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center text-sm text-gray-600 dark:text-white/60">
            Select one or more rankings from the dropdown above to begin
            assigning ranking details.
          </div>
        ) : (
          <div className="space-y-4">
            {assignedRankings.map((entry) => (
              <div
                key={entry.rankingId}
                className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 bg-gray-50/60 dark:bg-slate-900/40 shadow-sm transition-colors"
              >
                <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {entry.rankingName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/60">
                      Out of: {entry.rankValue || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleRankingSelectionChange(
                        selectedRankingIds.filter(
                          (rankingId) => rankingId !== entry.rankingId
                        )
                      )
                    }
                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenRankingModal(entry.rankingId)}
                    className="px-3 py-2 text-xs bg-primary text-white rounded hover:bg-primary-700 transition-colors"
                  >
                    Configure Rankings
                  </button>
                </div>

                {entry.yearRankings && entry.yearRankings.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-white/50 mb-2">
                      Configured Year Rankings
                    </p>
                    <div className="space-y-2">
                      {entry.yearRankings.map((yr, idx) => (
                        <div
                          key={`${entry.rankingId}-year-${idx}`}
                          className="border border-gray-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900/80"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700 dark:text-white/80">
                              Year {yr.year}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-white/70">
                              Rank: {yr.rank || "--"} / {yr.outOf}
                            </span>
                          </div>
                          {yr.notes && (
                            <p className="text-[11px] text-gray-500 dark:text-white/60 mt-1">
                              {yr.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ApnaModal
        isOpen={rankingModalState.isOpen}
        onClose={handleCloseRankingModal}
        onSubmit={handleRankingModalSubmit}
        title={
          activeRankingEntry
            ? `Configure Rankings • ${activeRankingEntry.rankingName}`
            : "Configure Rankings"
        }
        submitText="Save Rankings"
        cancelText="Cancel"
        size="lg"
      >
        {activeRankingEntry ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {activeRankingEntry.yearRankings.map((yr, idx) => (
                <div
                  key={`${activeRankingEntry.rankingId}-tab-${idx}`}
                  className={`relative group flex items-center gap-1 pl-3 pr-1 py-1 text-xs rounded border transition-colors ${
                    rankingModalState.activeTab === idx
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-white/70 dark:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() =>
                      setRankingModalState((prev) => ({
                        ...prev,
                        activeTab: idx,
                      }))
                    }
                    className="flex-1"
                  >
                    {yr.year ? `Year ${yr.year}` : `Year ${idx + 1}`}
                  </button>
                  {activeRankingEntry.yearRankings.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveYear(idx);
                      }}
                      className={`ml-1 p-0.5 rounded hover:bg-red-500/20 transition-colors ${
                        rankingModalState.activeTab === idx
                          ? "text-white hover:text-white"
                          : "text-gray-400 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400"
                      }`}
                      title="Remove year"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
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
                  )}
                </div>
              ))}
              <button
                onClick={handleAddYear}
                type="button"
                className="px-2 py-1 text-xs border border-dashed border-primary text-primary rounded hover:bg-primary/5 transition-colors"
              >
                + Add Year
              </button>
            </div>

            {activeRankingEntry.yearRankings.length === 0 ? (
              <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-500 dark:text-white/60 text-center">
                Add a year to start configuring rankings.
              </div>
            ) : (
              activeRankingEntry.yearRankings.map((yr, idx) => {
                if (idx !== rankingModalState.activeTab) return null;
                return (
                  <div
                    key={`${activeRankingEntry.rankingId}-year-form-${idx}`}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                          Year *
                        </label>
                        <input
                          type="number"
                          min="2000"
                          max="2100"
                          value={yr.year}
                          onChange={(e) =>
                            handleYearFieldChange(
                              activeRankingEntry.rankingId,
                              idx,
                              "year",
                              e.target.value
                            )
                          }
                          placeholder="e.g., 2024"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                          Rank *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={yr.rank}
                          onChange={(e) =>
                            handleYearFieldChange(
                              activeRankingEntry.rankingId,
                              idx,
                              "rank",
                              e.target.value
                            )
                          }
                          placeholder="Enter rank"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                          Out Of *
                        </label>
                        <input
                          type="text"
                          value={
                            yr.outOf || activeRankingEntry.rankValue || "N/A"
                          }
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-gray-100 dark:bg-slate-800/50 text-gray-600 dark:text-white/60 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                        Notes
                      </label>
                      <textarea
                        value={yr.notes}
                        onChange={(e) =>
                          handleYearFieldChange(
                            activeRankingEntry.rankingId,
                            idx,
                            "notes",
                            e.target.value
                          )
                        }
                        placeholder="Optional notes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 dark:text-white/60">
            Select a ranking to configure year-wise rankings.
          </div>
        )}
      </ApnaModal>
    </div>
  );
}
