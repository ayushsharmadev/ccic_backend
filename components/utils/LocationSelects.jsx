"use client";

import { useState, useEffect, useCallback } from "react";
import ApnaSelect from "./ApnaSelect";

export default function LocationSelects({
  country = "", state = "", district = "", onCountryChange, onStateChange,
  onDistrictChange, showDistrict = true,
  labelClassName = "block text-sm font-medium text-gray-700 dark:text-white/80 mb-1",
  selectButtonClassName = "", disabled = false, countryLabel = "Country",
  stateLabel = "State", districtLabel = "District",
  gridClassName = "grid grid-cols-2 gap-4",
  countryApiUrl = "/api/locations/countries",
  onAddCountry, onAddState, onAddDistrict,
  stateRefreshKey = 0, districtRefreshKey = 0,
  addButtonClassName = "shrink-0 px-3 rounded-r text-sm font-semibold text-white bg-primary hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50",
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const loadStates = useCallback(async (countryId) => {
    if (!countryId) { setStates([]); return; }
    setLoadingStates(true);
    try {
      const response = await fetch(`/api/locations/states?all=true&country=${countryId}`);
      const result = await response.json();
      setStates(result.success ? result.data.map((item) => ({ value: item._id, label: item.name })) : []);
    } catch { setStates([]); } finally { setLoadingStates(false); }
  }, []);

  const loadDistricts = useCallback(async (stateId) => {
    if (!stateId) { setDistricts([]); return; }
    setLoadingDistricts(true);
    try {
      const response = await fetch(`/api/locations/districts?all=true&state=${stateId}`);
      const result = await response.json();
      setDistricts(result.success ? result.data.map((item) => ({ value: item._id, label: item.name })) : []);
    } catch { setDistricts([]); } finally { setLoadingDistricts(false); }
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await fetch(`${countryApiUrl}?all=true`);
        const result = await response.json();
        setCountries(result.success ? result.data.map((item) => ({ value: item._id, label: item.name })) : []);
      } catch { setCountries([]); } finally { setLoadingCountries(false); }
    };
    fetchCountries();
  }, [countryApiUrl]);

  useEffect(() => { if (country) loadStates(country); else setStates([]); }, [country, loadStates, stateRefreshKey]);
  useEffect(() => { if (showDistrict && state) loadDistricts(state); else setDistricts([]); }, [state, showDistrict, loadDistricts, districtRefreshKey]);

  const handleCountryChange = (value) => {
    onCountryChange?.(value); onStateChange?.(""); onDistrictChange?.("");
    setStates([]); setDistricts([]); if (value) loadStates(value);
  };
  const handleStateChange = (value) => {
    onStateChange?.(value); onDistrictChange?.(""); setDistricts([]);
    if (showDistrict && value) loadDistricts(value);
  };
  const cols = showDistrict ? 3 : 2;
  const joinedButtonClass = (hasAdd) => hasAdd ? `${selectButtonClassName} rounded-r-none` : selectButtonClassName;

  return (
    <div className={gridClassName} style={gridClassName.includes("grid-cols") ? undefined : { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "1rem" }}>
      <div>
        <label className={labelClassName}>{countryLabel}</label>
        <div className="relative">
          <ApnaSelect title="" options={countries} value={country} onChange={handleCountryChange}
            placeholder={loadingCountries ? "Loading countries..." : "-- Select Country --"}
            searchable disabled={disabled || loadingCountries} buttonClassName={joinedButtonClass(Boolean(onAddCountry))} className="min-w-0 flex-1" />
          {onAddCountry && <button type="button" onClick={onAddCountry} className={addButtonClassName} title="Add detailed country">+</button>}
        </div>
      </div>
      <div>
        <label className={labelClassName}>{stateLabel}</label>
        <div className="relative">
          <ApnaSelect title="" options={states} value={state} onChange={handleStateChange}
            placeholder={!country ? "Select country first" : loadingStates ? "Loading states..." : "-- Select State --"}
            searchable disabled={disabled || !country || loadingStates} buttonClassName={joinedButtonClass(Boolean(onAddState))} className="min-w-0 flex-1" />
          {onAddState && <button type="button" onClick={onAddState} className={addButtonClassName} title={country ? "Quick add state" : "Select country first"}>+</button>}
        </div>
      </div>
      {showDistrict && <div>
        <label className={labelClassName}>{districtLabel}</label>
        <div className="relative">
          <ApnaSelect title="" options={districts} value={district} onChange={onDistrictChange}
            placeholder={!state ? "Select state first" : loadingDistricts ? "Loading districts..." : "-- Select District --"}
            searchable disabled={disabled || !state || loadingDistricts} buttonClassName={joinedButtonClass(Boolean(onAddDistrict))} className="min-w-0 flex-1" />
          {onAddDistrict && <button type="button" onClick={onAddDistrict} className={addButtonClassName} title={state ? "Quick add district" : "Select state first"}>+</button>}
        </div>
      </div>}
    </div>
  );
}