"use client";

import { useState, useEffect, useCallback } from "react";
import ApnaSelect from "./ApnaSelect";

export default function LocationSelects({
  country = "",
  state = "",
  district = "",
  onCountryChange,
  onStateChange,
  onDistrictChange,
  showDistrict = true,
  labelClassName = "block text-sm font-medium text-gray-700 dark:text-white/80 mb-1",
  selectButtonClassName = "",
  disabled = false,
  countryLabel = "Country",
  stateLabel = "State",
  districtLabel = "District",
  gridClassName = "grid grid-cols-2 gap-4",
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) {
      setStates([]);
      return;
    }

    setLoadingStates(true);
    try {
      const response = await fetch(
        `/api/locations/states?all=true&country=${countryId}`
      );
      const result = await response.json();
      if (result.success) {
        setStates(
          result.data.map((item) => ({
            value: item._id,
            label: item.name,
          }))
        );
      } else {
        setStates([]);
      }
    } catch {
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const loadDistricts = useCallback(async (stateId) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    try {
      const response = await fetch(
        `/api/locations/districts?all=true&state=${stateId}`
      );
      const result = await response.json();
      if (result.success) {
        setDistricts(
          result.data.map((item) => ({
            value: item._id,
            label: item.name,
          }))
        );
      } else {
        setDistricts([]);
      }
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch("/api/locations/countries?all=true");
        const result = await response.json();
        if (result.success) {
          setCountries(
            result.data.map((item) => ({
              value: item._id,
              label: item.name,
            }))
          );
        }
      } catch {
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (country) {
      loadStates(country);
    } else {
      setStates([]);
    }
  }, [country, loadStates]);

  useEffect(() => {
    if (showDistrict && state) {
      loadDistricts(state);
    } else {
      setDistricts([]);
    }
  }, [state, showDistrict, loadDistricts]);

  const handleCountryChange = (value) => {
    onCountryChange?.(value);
    onStateChange?.("");
    onDistrictChange?.("");
    setStates([]);
    setDistricts([]);
    if (value) {
      loadStates(value);
    }
  };

  const handleStateChange = (value) => {
    onStateChange?.(value);
    onDistrictChange?.("");
    setDistricts([]);
    if (showDistrict && value) {
      loadDistricts(value);
    }
  };

  const cols = showDistrict ? 3 : 2;

  return (
    <div
      className={gridClassName}
      style={
        gridClassName.includes("grid-cols")
          ? undefined
          : { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "1rem" }
      }
    >
      <div>
        <label className={labelClassName}>{countryLabel}</label>
        <ApnaSelect
          title=""
          options={countries}
          value={country}
          onChange={handleCountryChange}
          placeholder={
            loadingCountries ? "Loading countries..." : "-- Select Country --"
          }
          searchable={true}
          disabled={disabled || loadingCountries}
          buttonClassName={selectButtonClassName}
        />
      </div>

      <div>
        <label className={labelClassName}>{stateLabel}</label>
        <ApnaSelect
          title=""
          options={states}
          value={state}
          onChange={handleStateChange}
          placeholder={
            !country
              ? "Select country first"
              : loadingStates
                ? "Loading states..."
                : "-- Select State --"
          }
          searchable={true}
          disabled={disabled || !country || loadingStates}
          buttonClassName={selectButtonClassName}
        />
      </div>

      {showDistrict && (
        <div>
          <label className={labelClassName}>{districtLabel}</label>
          <ApnaSelect
            title=""
            options={districts}
            value={district}
            onChange={onDistrictChange}
            placeholder={
              !state
                ? "Select state first"
                : loadingDistricts
                  ? "Loading districts..."
                  : "-- Select District --"
            }
            searchable={true}
            disabled={disabled || !state || loadingDistricts}
            buttonClassName={selectButtonClassName}
          />
        </div>
      )}
    </div>
  );
}
