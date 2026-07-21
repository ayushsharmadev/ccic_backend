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

const FEE_TYPE_OPTIONS = [
  { value: "annual", label: "Annual" },
  { value: "semester", label: "Semester Wise" },
];

const defaultModalState = {
  isOpen: false,
  courseId: null,
  activeTab: 0,
};

const toNumberOrZero = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const buildDurationLabel = (duration) => {
  if (!duration) return "";
  const value = Number(duration.value);
  const unit = duration.unit;
  if (!value || !unit) {
    return duration.name || "Duration";
  }
  const formatter = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
  const formattedValue = formatter.format(value);
  if (unit === "years") {
    return `${formattedValue} ${value === 1 ? "Year" : "Years"}`;
  }
  if (unit === "months") {
    return `${formattedValue} ${value === 1 ? "Month" : "Months"}`;
  }
  return `${formattedValue} ${unit}`;
};

const formatAmountWithCurrency = (amount, currency) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "--";
  if (!currency?.code) return numeric.toLocaleString("en-IN");

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.code,
    }).format(numeric);
  } catch {
    return `${currency.symbol || currency.code} ${numeric.toLocaleString("en-IN")}`;
  }
};
export default function CollegeCoursesAllocationPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const collegeId = params?.collegeId;

  const SESSION_REGEX = /^\d{4}-\d{4}$/;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState(null);

  const [coursesOptions, setCoursesOptions] = useState([]);
  const [courseDurationOptions, setCourseDurationOptions] = useState([]);
  const [courseDurationMap, setCourseDurationMap] = useState({});
  const [examTypeOptions, setExamTypeOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [suggestedCurrencyId, setSuggestedCurrencyId] = useState("");

  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);

  const [feeModalState, setFeeModalState] = useState(defaultModalState);

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

  const resolveDurationMeta = useCallback(
    (durationId) => {
      if (!durationId) return { value: 0, unit: "years" };

      const mapEntry = courseDurationMap[durationId];
      const optionEntry = courseDurationOptions.find(
        (option) => option.value === durationId
      );

      let candidateTexts = [];
      if (mapEntry?.name) candidateTexts.push(mapEntry.name);
      if (optionEntry?.label) candidateTexts.push(optionEntry.label);
      if (optionEntry?.meta?.name) candidateTexts.push(optionEntry.meta.name);

      let value = toNumberOrZero(mapEntry?.value);
      let unit = mapEntry?.unit;

      if (!value) {
        value = toNumberOrZero(optionEntry?.meta?.value);
      }

      if (!unit && optionEntry?.meta?.unit) {
        unit = optionEntry.meta.unit;
      }

      if (!value || !unit) {
        candidateTexts.some((text) => {
          if (!text) return false;
          const lower = text.toLowerCase();
          if (!unit) {
            if (lower.includes("month")) unit = "months";
            else if (lower.includes("year")) unit = "years";
          }
          if (!value) {
            const match = text.match(/[\d.]+/);
            if (match) {
              value = parseFloat(match[0]);
            }
          }
          return Boolean(unit && value);
        });
      }

      return {
        value: toNumberOrZero(value),
        unit: unit || "years",
      };
    },
    [courseDurationMap, courseDurationOptions]
  );

  const computePeriodLabels = useCallback(
    (durationId, feeType) => {
      if (!durationId || !feeType) return [];

      const { value, unit } = resolveDurationMeta(durationId);
      if (!value) return [];

      let count = 1;

      if (feeType === "semester") {
        if (unit === "months") {
          count = Math.max(1, Math.ceil(value / 6));
        } else {
          count = Math.max(1, Math.ceil(value * 2));
        }
        return Array.from({ length: count }, (_, idx) => `Semester ${idx + 1}`);
      }

      if (unit === "months") {
        count = Math.max(1, Math.ceil(value / 12));
      } else {
        count = Math.max(1, Math.ceil(value));
      }

      return Array.from({ length: count }, (_, idx) => `Year ${idx + 1}`);
    },
    [resolveDurationMeta]
  );

  const syncPeriodsWithLabels = useCallback((periods, labels) => {
    const amountMap = new Map(
      (periods || []).map((period) => [
        period.label,
        period.amount !== undefined && period.amount !== null
          ? period.amount.toString()
          : "",
      ])
    );

    return labels.map((label) => ({
      label,
      amount: amountMap.get(label) ?? "",
    }));
  }, []);

  const ensureFeeStructures = useCallback(
    (entry) => {
      if (!entry) return entry;

      const courseDurationId = entry.courseDurationId;
      const derivedDefault =
        entry.defaultStructureType ||
        entry.feeStructures?.[0]?.structureType ||
        "annual";
      const defaultType = derivedDefault || "annual";

      if (!courseDurationId) {
        return {
          ...entry,
          defaultStructureType: defaultType,
          feeStructures: [],
        };
      }

      let feeStructures =
        entry.feeStructures && entry.feeStructures.length
          ? entry.feeStructures
          : [];

      feeStructures = feeStructures.map((structure) => {
        const structureType = structure.structureType || defaultType;
        const labels = computePeriodLabels(courseDurationId, structureType);

        if (!labels.length) {
          return {
            ...structure,
            session: structure.session || "",
            structureType,
            seats: structure.seats !== undefined ? structure.seats : undefined,
            periods: [],
          };
        }

        const synced = syncPeriodsWithLabels(structure.periods, labels).map(
          (period) => ({
            label: period.label,
            amount:
              period.amount !== undefined && period.amount !== null
                ? period.amount
                : "",
          })
        );

        return {
          ...structure,
          session: structure.session || "",
          structureType,
          seats: structure.seats !== undefined ? structure.seats : undefined,
          periods: synced,
        };
      });

      if (!feeStructures.length) {
        const structureType = defaultType;
        const labels = computePeriodLabels(courseDurationId, structureType);

        feeStructures.push({
          currency: suggestedCurrencyId,
          session: "",
          structureType,
          seats: undefined,
          periods: labels.map((label) => ({ label, amount: "" })),
        });
      }

      return {
        ...entry,
        defaultStructureType: defaultType,
        feeStructures,
      };
    },
    [computePeriodLabels, suggestedCurrencyId, syncPeriodsWithLabels]
  );

  const updateCourseEntry = useCallback((courseId, updater) => {
    setAssignedCourses((prev) =>
      prev.map((entry) =>
        entry.courseId === courseId ? updater(entry) : entry
      )
    );
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!collegeId) return;
      try {
        setLoading(true);

        const [
          collegeRes,
          coursesRes,
          durationRes,
          examTypeRes,
          currencyRes,
          allocationRes,
        ] = await Promise.all([
          fetch(`/api/colleges/${collegeId}`),
          fetch("/api/courses?all=true"),
          fetch("/api/master/course-duration?all=true"),
          fetch("/api/master/exam-type?all=true"),
          fetch("/api/currencies?status=active&limit=200"),
          fetch(`/api/colleges/${collegeId}/course-allocations`),
        ]);

        const collegeData = await collegeRes.json();
        const coursesData = await coursesRes.json();
        const durationData = await durationRes.json();
        const examTypeData = await examTypeRes.json();
        const currencyData = await currencyRes.json();
        const allocationData = await allocationRes.json();

        if (!collegeData.success) {
          showError(collegeData.error || "Failed to load college information.");
        } else {
          setCollegeInfo(collegeData.data);
        }

        if (!coursesData.success) {
          showError(coursesData.error || "Failed to load courses.");
        } else {
          const options = (coursesData.data || []).map((course) => ({
            value: course._id,
            label: course.name,
            meta: course,
          }));
          setCoursesOptions(options);
        }

        if (!durationData.success) {
          showError(durationData.error || "Failed to load course durations.");
        } else {
          const options = (durationData.data || []).map((duration) => ({
            value: duration._id,
            label: buildDurationLabel(duration),
            meta: duration,
          }));

          const map = {};
          options.forEach((option) => {
            map[option.value] = option.meta;
          });

          setCourseDurationOptions(options);
          setCourseDurationMap(map);
        }

        if (!examTypeData.success) {
          showError(examTypeData.error || "Failed to load exam types.");
        } else {
          const options = (examTypeData.data || []).map((examType) => ({
            value: examType._id,
            label: examType.name,
            meta: examType,
          }));
          setExamTypeOptions(options);
        }

        if (!currencyData.success) {
          showError(currencyData.error || "Failed to load currencies.");
        } else {
          setCurrencyOptions(
            (currencyData.data || []).map((currency) => ({
              value: currency._id,
              label: `${currency.code} - ${currency.name}${currency.symbol ? ` (${currency.symbol})` : ""}`,
              meta: currency,
            }))
          );
        }

        // Process allocation data separately
        if (allocationData.success && allocationData.data) {
          const defaultCurrencyId =
            allocationData.data.suggestedCurrency?._id || "";
          setSuggestedCurrencyId(defaultCurrencyId);
          const normalized = (allocationData.data.assignedCourses || []).map(
            (item) => {
              // API se directly courseId, courseName, courseDurationId, examTypeId aur defaultStructureType milte hain
              const courseId = item.courseId || "";
              const courseName = item.courseName || "Selected Course";
              const courseDurationId = item.courseDurationId || "";
              const examTypeId = item.examTypeId || "";
              const defaultStructureType =
                item.defaultStructureType || "annual";

              const feeStructures = (item.feeStructures || []).map(
                (structure) => ({
                  currency:
                    structure.currency?._id ||
                    structure.currency ||
                    defaultCurrencyId,
                  session: structure.session || "",
                  structureType: structure.structureType || "annual",
                  seats:
                    structure.seats !== undefined && structure.seats !== null
                      ? structure.seats
                      : structure.seats === 0
                      ? 0
                      : undefined,
                  periods: (structure.periods || []).map((period) => ({
                    label: period.label,
                    amount:
                      period.amount !== undefined && period.amount !== null
                        ? period.amount.toString()
                        : "",
                  })),
                })
              );

              // Agar feeStructures already valid periods ke saath hain to ensureFeeStructures skip karo
              const hasValidPeriods = feeStructures.some(
                (structure) => structure.periods && structure.periods.length > 0
              );

              const result = hasValidPeriods
                ? {
                    courseId,
                    courseName,
                    courseDurationId,
                    examTypeId,
                    defaultStructureType,
                    feeStructures,
                    isActive:
                      item.isActive !== undefined ? !!item.isActive : true,
                    notes: item.notes || "",
                  }
                : ensureFeeStructures({
                    courseId,
                    courseName,
                    courseDurationId,
                    examTypeId,
                    defaultStructureType,
                    feeStructures,
                    isActive:
                      item.isActive !== undefined ? !!item.isActive : true,
                    notes: item.notes || "",
                  });

              return result;
            }
          );

          const courseIds = normalized
            .map((entry) => entry.courseId)
            .filter(Boolean);
          setAssignedCourses(normalized);
          setSelectedCourseIds(courseIds);
        }
      } catch (error) {
        console.error("Error loading course allocation data:", error);
        showError("Failed to load course allocations.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const handleCourseSelectionChange = (value) => {
    const values = Array.isArray(value) ? value : [];

    const addedCourses = values.filter(
      (courseId) => !selectedCourseIds.includes(courseId)
    );
    const removedCourses = selectedCourseIds.filter(
      (courseId) => !values.includes(courseId)
    );

    if (addedCourses.length) {
      setAssignedCourses((prev) => {
        const additions = addedCourses.map((courseId) => {
          const option = coursesOptions.find(
            (course) => course.value === courseId
          );
          return {
            courseId,
            courseName: option?.label || "Selected Course",
            courseDurationId: "",
            examTypeId: "",
            defaultStructureType: "annual",
            feeStructures: [],
            isActive: true,
            notes: "",
          };
        });
        return [...prev, ...additions];
      });
    }

    if (removedCourses.length) {
      setAssignedCourses((prev) =>
        prev.filter((entry) => !removedCourses.includes(entry.courseId))
      );
    }

    setSelectedCourseIds(values);
  };

  const handleDurationChange = (courseId, durationId) => {
    updateCourseEntry(courseId, (entry) =>
      ensureFeeStructures({
        ...entry,
        courseDurationId: durationId || "",
        feeStructures: durationId ? entry.feeStructures : [],
      })
    );
  };

  const handleExamTypeChange = (courseId, examTypeId) => {
    updateCourseEntry(courseId, (entry) => ({
      ...entry,
      examTypeId: examTypeId || "",
    }));
  };

  const handleFeeTypeChange = (courseId, feeType, structureIndex = null) => {
    updateCourseEntry(courseId, (entry) => {
      const normalizedType = ["annual", "semester"].includes(feeType)
        ? feeType
        : null;

      if (structureIndex === null) {
        const updatedEntry = {
          ...entry,
          defaultStructureType:
            normalizedType || entry.defaultStructureType || "annual",
        };
        return ensureFeeStructures(updatedEntry);
      }

      const currentType =
        normalizedType ||
        entry.feeStructures?.[structureIndex]?.structureType ||
        entry.defaultStructureType ||
        "annual";

      const feeStructures = entry.feeStructures.map((structure, idx) =>
        idx === structureIndex
          ? {
              ...structure,
              structureType: currentType,
            }
          : structure
      );

      return ensureFeeStructures({
        ...entry,
        defaultStructureType: currentType,
        feeStructures,
      });
    });
  };

  const handleOpenFeeModal = (courseId) => {
    const entry = assignedCourses.find(
      (course) => course.courseId === courseId
    );
    if (!entry) return;

    if (!entry.courseDurationId) {
      showWarning("Please select a course duration first.");
      return;
    }

    setAssignedCourses((prev) =>
      prev.map((course) =>
        course.courseId === courseId ? ensureFeeStructures(course) : course
      )
    );

    setFeeModalState({
      isOpen: true,
      courseId,
      activeTab: 0,
    });
  };

  const handleCloseFeeModal = () => {
    setFeeModalState(defaultModalState);
  };

  const activeCourseEntry = useMemo(
    () =>
      assignedCourses.find(
        (course) => course.courseId === feeModalState.courseId
      ) || null,
    [assignedCourses, feeModalState.courseId]
  );

  const handleCurrencyChange = (courseId, index, currency) => {
    updateCourseEntry(courseId, (entry) => ({
      ...entry,
      feeStructures: entry.feeStructures.map((structure, idx) =>
        idx === index ? { ...structure, currency } : structure
      ),
    }));
  };

  const handleSessionChange = (courseId, index, value) => {
    updateCourseEntry(courseId, (entry) => {
      const feeStructures = entry.feeStructures.map((structure, idx) =>
        idx === index ? { ...structure, session: value } : structure
      );
      return { ...entry, feeStructures };
    });
  };

  const handleSeatsChange = (courseId, index, value) => {
    if (value !== "" && (Number.isNaN(Number(value)) || Number(value) < 0)) {
      return;
    }
    updateCourseEntry(courseId, (entry) => {
      const feeStructures = entry.feeStructures.map((structure, idx) =>
        idx === index
          ? { ...structure, seats: value === "" ? undefined : Number(value) }
          : structure
      );
      return { ...entry, feeStructures };
    });
  };

  const handleFeeAmountChange = (
    courseId,
    structureIndex,
    periodIndex,
    value
  ) => {
    if (value !== "" && (Number.isNaN(Number(value)) || Number(value) < 0)) {
      return;
    }
    updateCourseEntry(courseId, (entry) => {
      const feeStructures = entry.feeStructures.map((structure, idx) => {
        if (idx !== structureIndex) return structure;
        const periods = structure.periods.map((period, pIdx) =>
          pIdx === periodIndex ? { ...period, amount: value } : period
        );
        return { ...structure, periods };
      });
      return { ...entry, feeStructures };
    });
  };

  const handleAddAcademicYear = () => {
    const courseId = feeModalState.courseId;
    if (!courseId) return;

    const entry = assignedCourses.find(
      (course) => course.courseId === courseId
    );
    if (!entry) return;

    if (!entry.courseDurationId) {
      showWarning("Please select a course duration before adding fees.");
      return;
    }

    const lastStructureType =
      entry.feeStructures[entry.feeStructures.length - 1]?.structureType;
    const structureType =
      entry.defaultStructureType || lastStructureType || "annual";
    const labels = computePeriodLabels(entry.courseDurationId, structureType);

    if (!labels.length) {
      showWarning("Unable to generate fee periods for the selected duration.");
      return;
    }

    const newStructure = {
      currency:
        entry.feeStructures[entry.feeStructures.length - 1]?.currency ||
        suggestedCurrencyId,
      session: "",
      structureType,
      seats: undefined,
      periods: labels.map((label) => ({ label, amount: "" })),
    };

    setAssignedCourses((prev) =>
      prev.map((course) =>
        course.courseId === courseId
          ? {
              ...course,
              feeStructures: [...course.feeStructures, newStructure],
            }
          : course
      )
    );

    setFeeModalState((prev) => ({
      ...prev,
      activeTab: activeCourseEntry ? activeCourseEntry.feeStructures.length : 0,
    }));
  };

  const handleRemoveSession = (index) => {
    const courseId = feeModalState.courseId;
    if (courseId === null) return;

    setAssignedCourses((prev) =>
      prev.map((course) => {
        if (course.courseId !== courseId) return course;
        const nextStructures = course.feeStructures.filter(
          (_, idx) => idx !== index
        );
        return { ...course, feeStructures: nextStructures };
      })
    );

    setFeeModalState((prev) => ({
      ...prev,
      activeTab: Math.max(0, prev.activeTab - 1),
    }));
  };

  const handleFeeModalSubmit = () => {
    const entry = activeCourseEntry;
    if (!entry) {
      handleCloseFeeModal();
      return;
    }

    const hasMissing = entry.feeStructures.some((structure) => {
      if (!structure.currency) return true;

      const session = structure.session?.trim();
      if (!session || !SESSION_REGEX.test(session)) {
        return true;
      }

      const type = structure.structureType || entry.defaultStructureType || "";
      if (!["annual", "semester"].includes(type)) {
        return true;
      }

      return structure.periods.some(
        (period) =>
          period.amount === "" ||
          period.amount === null ||
          Number.isNaN(Number(period.amount))
      );
    });

    if (hasMissing) {
      showWarning(
        "Please select a currency and provide session (e.g., 2024-2025) and fee amount for every period before saving."
      );
      return;
    }

    handleCloseFeeModal();
  };

  const handleSaveAssignments = async () => {
    if (!selectedCourseIds.length) {
      showWarning("Please select at least one course to assign.");
      return;
    }

    const invalidEntries = assignedCourses.filter((entry) => {
      if (!entry.courseDurationId) {
        return true;
      }

      if (!entry.feeStructures.length) {
        return true;
      }

      return entry.feeStructures.some((structure) => {
        if (!structure.currency) return true;

        const session = structure.session?.trim();
        if (!session || !SESSION_REGEX.test(session)) {
          return true;
        }

        const type =
          structure.structureType || entry.defaultStructureType || "";
        if (!["annual", "semester"].includes(type)) {
          return true;
        }

        return structure.periods.some(
          (period) =>
            period.amount === "" ||
            period.amount === null ||
            Number.isNaN(Number(period.amount))
        );
      });
    });

    if (invalidEntries.length) {
      showError(
        "Please ensure every selected course has duration, currency, fee type, session formatted like 2024-2025, and all fee amounts filled."
      );
      return;
    }

    const payload = assignedCourses.map((entry) => ({
      course: entry.courseId,
      courseDuration: entry.courseDurationId,
      examType: entry.examTypeId || undefined,
      isActive: entry.isActive,
      notes: entry.notes || undefined,
      feeStructures: entry.feeStructures.map((structure) => {
        const seatsValue =
          structure.seats !== undefined &&
          structure.seats !== null &&
          structure.seats !== ""
            ? Number(structure.seats)
            : structure.seats === 0
            ? 0
            : undefined;

        return {
          currency: structure.currency?._id || structure.currency,
          session: structure.session.trim(),
          structureType:
            structure.structureType || entry.defaultStructureType || "annual",
          seats: seatsValue !== undefined ? seatsValue : undefined,
          periods: structure.periods.map((period) => ({
            label: period.label,
            amount: Number(period.amount),
          })),
        };
      }),
    }));

    try {
      setSaving(true);
      const data = await makeAuthenticatedRequest(
        `/api/colleges/${collegeId}/course-allocations`,
        {
          method: "PUT",
          body: JSON.stringify({ assignedCourses: payload }),
        }
      );

      if (data.success) {
        showSuccess("Courses assigned successfully!");
        const updated = (data.data?.assignedCourses || []).map((item) => {
          const courseId =
            item.course && typeof item.course === "object"
              ? item.course._id
              : item.course;
          const courseName =
            item.course?.name ||
            coursesOptions.find((course) => course.value === courseId)?.label ||
            "Selected Course";
          const courseDurationId =
            item.courseDuration && typeof item.courseDuration === "object"
              ? item.courseDuration._id
              : item.courseDuration;
          const examTypeId =
            item.examType && typeof item.examType === "object"
              ? item.examType._id
              : item.examTypeId || item.examType || "";

          const feeStructures = (item.feeStructures || []).map((structure) => ({
            currency: structure.currency?._id || structure.currency || "",
            session: structure.session || "",
            structureType: structure.structureType || "annual",
            seats:
              structure.seats !== undefined && structure.seats !== null
                ? structure.seats
                : structure.seats === 0
                ? 0
                : undefined,
            periods: (structure.periods || []).map((period) => ({
              label: period.label,
              amount:
                period.amount !== undefined && period.amount !== null
                  ? period.amount.toString()
                  : "",
            })),
          }));

          const defaultStructureType =
            item.defaultStructureType ||
            feeStructures.find((s) => s.structureType)?.structureType ||
            "annual";

          return ensureFeeStructures({
            courseId,
            courseName,
            courseDurationId: courseDurationId || "",
            examTypeId: examTypeId || "",
            defaultStructureType,
            feeStructures,
            isActive: item.isActive !== undefined ? !!item.isActive : true,
            notes: item.notes || "",
          });
        });
        setAssignedCourses(updated);
        setSelectedCourseIds(updated.map((entry) => entry.courseId));
      } else {
        showError(data.error || "Failed to save course allocations.");
      }
    } catch (error) {
      console.error("Error saving course allocations:", error);
      showError("Failed to save course allocations.");
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
            <span>Course Allocation</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {collegeInfo?.name || "Assign Courses"}
          </h1>
          <p className="text-xs text-gray-600 dark:text-white/70">
            Assign courses to the college and configure academic fee structures.
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
            onClick={handleSaveAssignments}
            disabled={saving}
            className="px-4 py-1.5 text-xs bg-primary hover:bg-primary-700 text-white rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Assignments"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-white/80 mb-2">
            Select Courses to Assign
          </label>
          <ApnaSelect
            title=""
            options={coursesOptions}
            value={selectedCourseIds}
            onChange={handleCourseSelectionChange}
            placeholder="Search and select courses..."
            searchable={true}
            multiple={true}
            className="w-full"
          />
        </div>

        {!selectedCourseIds.length ? (
          <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 text-center text-sm text-gray-600 dark:text-white/60">
            Select one or more courses from the dropdown above to begin
            assigning durations and fee structures.
          </div>
        ) : (
          <div className="space-y-4">
            {assignedCourses.map((entry) => (
              <div
                key={entry.courseId}
                className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 bg-gray-50/60 dark:bg-slate-900/40 shadow-sm transition-colors"
              >
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {entry.courseName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/60">
                      Configure duration, fee structure type, and detailed fees.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleCourseSelectionChange(
                        selectedCourseIds.filter(
                          (courseId) => courseId !== entry.courseId
                        )
                      )
                    }
                    className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                      Course Duration
                    </label>
                    <ApnaSelect
                      title=""
                      options={courseDurationOptions}
                      value={entry.courseDurationId}
                      onChange={(value) =>
                        handleDurationChange(entry.courseId, value)
                      }
                      placeholder="Select duration"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                      Exam Type
                    </label>
                    <ApnaSelect
                      title=""
                      options={examTypeOptions}
                      value={entry.examTypeId}
                      onChange={(value) =>
                        handleExamTypeChange(entry.courseId, value)
                      }
                      placeholder="Select exam type"
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleOpenFeeModal(entry.courseId)}
                      disabled={!entry.courseDurationId}
                      className="w-full px-3 py-2 text-xs bg-primary text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Configure Fees
                    </button>
                  </div>
                </div>

                {entry.feeStructures.some((structure) =>
                  structure.periods.some(
                    (period) =>
                      period.amount !== "" &&
                      period.amount !== null &&
                      !Number.isNaN(Number(period.amount))
                  )
                ) && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-white/50 mb-2">
                      Saved Fee Structures
                    </p>
                    <div className="space-y-2">
                      {entry.feeStructures.map((structure, idx) => (
                        <div
                          key={`${entry.courseId}-structure-${idx}`}
                          className="border border-gray-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900/80"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-white/80">
                              {structure.session || `Session ${idx + 1}`}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-white/50">
                              {structure.structureType === "semester"
                                ? "Semester wise"
                                : structure.structureType === "annual"
                                ? "Annual"
                                : "Not configured"}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {structure.periods.map((period, periodIndex) => (
                              <div
                                key={`${entry.courseId}-structure-${idx}-period-${periodIndex}`}
                                className="text-[11px] text-gray-600 dark:text-white/70 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded px-2 py-1 flex justify-between"
                              >
                                <span>{period.label}</span>
                                <span className="font-semibold">
                                  {period.amount !== "" && period.amount !== null
                                    ? formatAmountWithCurrency(
                                        period.amount,
                                        currencyOptions.find(
                                          (option) =>
                                            option.value ===
                                            (structure.currency?._id ||
                                              structure.currency)
                                        )?.meta
                                      )
                                    : "--"}
                                </span>
                              </div>
                            ))}
                          </div>
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
        isOpen={feeModalState.isOpen}
        onClose={handleCloseFeeModal}
        onSubmit={handleFeeModalSubmit}
        title={
          activeCourseEntry
            ? `Configure Fees â€¢ ${activeCourseEntry.courseName}`
            : "Configure Fees"
        }
        submitText="Save Fees"
        cancelText="Cancel"
        size="lg"
      >
        {activeCourseEntry ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {activeCourseEntry.feeStructures.map((structure, idx) => (
                <div
                  key={`${activeCourseEntry.courseId}-tab-${idx}`}
                  className={`relative group flex items-center gap-1 pl-3 pr-1 py-1 text-xs rounded border transition-colors ${
                    feeModalState.activeTab === idx
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-white/70 dark:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() =>
                      setFeeModalState((prev) => ({
                        ...prev,
                        activeTab: idx,
                      }))
                    }
                    className="flex-1"
                  >
                    {structure.session
                      ? structure.session
                      : `Session ${idx + 1}`}
                  </button>
                  {activeCourseEntry.feeStructures.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSession(idx);
                      }}
                      className={`ml-1 p-0.5 rounded hover:bg-red-500/20 transition-colors ${
                        feeModalState.activeTab === idx
                          ? "text-white hover:text-white"
                          : "text-gray-400 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400"
                      }`}
                      title="Remove session"
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
                onClick={handleAddAcademicYear}
                type="button"
                disabled={!activeCourseEntry.defaultStructureType}
                className="px-2 py-1 text-xs border border-dashed border-primary text-primary rounded hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Session
              </button>
            </div>

            {activeCourseEntry.feeStructures.length === 0 ? (
              <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-500 dark:text-white/60 text-center">
                Add a session to start configuring fees.
              </div>
            ) : (
              activeCourseEntry.feeStructures.map((structure, idx) => {
                if (idx !== feeModalState.activeTab) return null;
                return (
                  <div
                    key={`${activeCourseEntry.courseId}-structure-form-${idx}`}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-white/90 mb-3">
                        Fee Structure
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pb-4 border-b border-gray-200 dark:border-slate-700">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                            Session *
                          </label>
                          <input
                            type="text"
                            value={structure.session}
                            onChange={(e) =>
                              handleSessionChange(
                                activeCourseEntry.courseId,
                                idx,
                                e.target.value
                              )
                            }
                            placeholder="e.g., 2024-2025"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                            Seats
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={
                              structure.seats !== undefined
                                ? structure.seats
                                : ""
                            }
                            onChange={(e) =>
                              handleSeatsChange(
                                activeCourseEntry.courseId,
                                idx,
                                e.target.value
                              )
                            }
                            placeholder="Enter seats"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                            Currency *
                          </label>
                          <ApnaSelect
                            title=""
                            options={currencyOptions}
                            value={structure.currency || ""}
                            onChange={(value) =>
                              handleCurrencyChange(
                                activeCourseEntry.courseId,
                                idx,
                                value
                              )
                            }
                            placeholder="Select currency"
                            searchable={true}
                            buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 transition focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
                            textClassName="overflow-hidden text-ellipsis whitespace-nowrap text-gray-700 dark:text-white/80 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-white/70 mb-1.5">
                            Structure Type *
                          </label>
                          <ApnaSelect
                            title=""
                            options={FEE_TYPE_OPTIONS}
                            value={structure.structureType || ""}
                            onChange={(value) =>
                              handleFeeTypeChange(
                                activeCourseEntry.courseId,
                                value,
                                idx
                              )
                            }
                            placeholder="Select type"
                            className="w-full"
                            buttonClassName="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 transition focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
                            textClassName="overflow-hidden text-ellipsis whitespace-nowrap text-gray-700 dark:text-white/80 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {structure.periods.map((period, periodIndex) => (
                        <div
                          key={`${activeCourseEntry.courseId}-period-${idx}-${periodIndex}`}
                          className="border border-gray-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900/70 space-y-2"
                        >
                          <p className="text-xs font-semibold text-gray-700 dark:text-white/80">
                            {period.label}
                          </p>
                          <input
                            type="number"
                            min="0"
                            value={period.amount}
                            onChange={(e) =>
                              handleFeeAmountChange(
                                activeCourseEntry.courseId,
                                idx,
                                periodIndex,
                                e.target.value
                              )
                            }
                            placeholder="Enter fee amount"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 dark:text-white/60">
            Select a course to configure fees.
          </div>
        )}
      </ApnaModal>
    </div>
  );
}
