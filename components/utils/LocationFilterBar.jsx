"use client";

import { useState, useEffect, useCallback } from "react";
import ApnaSelect from "./ApnaSelect";

const filterButtonClassName =
  "w-full px-3 py-1.5 rounded text-sm text-left flex items-center justify-between outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-700 dark:text-white/80 cursor-pointer";

export default function LocationFilterBar({
  country = "",
  state = "",
  district = "",
  onCountryChange,
  onStateChange,
  onDistrictChange,
  showCountry = true,
  showState = true,
  showDistrict = false,
  countryLabel = "Country",
  stateLabel = "State",
  districtLabel = "District",
  className = "flex gap-3 items-end flex-wrap",
  itemClassName = "min-w-48",
  countryApiUrl = "/api/locations/country-master",
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(showCountry);
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

  const loadDistricts = useCallback(async (stateId, countryId) => {
    if (!stateId && !countryId) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    try {
      const params = new URLSearchParams({ all: "true" });
      if (stateId) params.set("state", stateId);
      else if (countryId) params.set("country", countryId);

      const response = await fetch(`/api/locations/districts?${params}`);
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
    if (!showCountry) return;

    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch(`${countryApiUrl}?all=true`);
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
  }, [showCountry, countryApiUrl]);

  useEffect(() => {
    if (!showState) return;
    if (country) {
      loadStates(country);
    } else {
      setStates([]);
    }
  }, [country, showState, loadStates]);

  useEffect(() => {
    if (!showDistrict) return;
    if (state) {
      loadDistricts(state, "");
    } else if (country) {
      loadDistricts("", country);
    } else {
      setDistricts([]);
    }
  }, [state, country, showDistrict, loadDistricts]);

  const handleCountryChange = (value) => {
    onCountryChange?.(value);
    onStateChange?.("");
    onDistrictChange?.("");
  };

  const handleStateChange = (value) => {
    onStateChange?.(value);
    onDistrictChange?.("");
  };

  return (
    <div className={className}>
      {showCountry && (
        <div className={itemClassName}>
          <ApnaSelect
            title={countryLabel}
            options={[{ value: "", label: `All ${countryLabel}s` }, ...countries]}
            value={country}
            onChange={handleCountryChange}
            placeholder={
              loadingCountries ? "Loading..." : `All ${countryLabel}s`
            }
            searchable={true}
            disabled={loadingCountries}
            buttonClassName={filterButtonClassName}
          />
        </div>
      )}

      {showState && (
        <div className={itemClassName}>
          <ApnaSelect
            title={stateLabel}
            options={[{ value: "", label: `All ${stateLabel}s` }, ...states]}
            value={state}
            onChange={handleStateChange}
            placeholder={
              showCountry && !country
                ? "Select country first"
                : loadingStates
                  ? "Loading..."
                  : `All ${stateLabel}s`
            }
            searchable={true}
            disabled={(showCountry && !country) || loadingStates}
            buttonClassName={filterButtonClassName}
          />
        </div>
      )}

      {showDistrict && (
        <div className={itemClassName}>
          <ApnaSelect
            title={districtLabel}
            options={[
              { value: "", label: `All ${districtLabel}s` },
              ...districts,
            ]}
            value={district}
            onChange={onDistrictChange}
            placeholder={
              !state && !country
                ? "Select location first"
                : loadingDistricts
                  ? "Loading..."
                  : `All ${districtLabel}s`
            }
            searchable={true}
            disabled={(!state && !country) || loadingDistricts}
            buttonClassName={filterButtonClassName}
          />
        </div>
      )}
    </div>
  );
}
