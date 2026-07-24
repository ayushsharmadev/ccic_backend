"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LocationSelects from "@/components/utils/LocationSelects";
import ApnaSelect from "@/components/utils/ApnaSelect";
import ApnaEditor from "@/components/utils/ApnaEditor";
import ImageUpload from "@/components/utils/ImageUpload";
import ApnaModal from "@/components/utils/ApnaModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  showSuccess,
  showError,
  showWarning,
} from "@/components/utils/ApnaNotify";

export default function EditCollegePage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.id;
  const { getAccessToken } = useAuth();

  // Helper function for authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = getAccessToken();
    if (!token) {
      showError("Authentication required. Please log in again.");
      return { success: false, error: "No access token" };
    }

    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    return data;
  };

  // Basic data lists for college fields
  const [basicDataLists, setBasicDataLists] = useState({
    ownershipTypes: [],
    affiliations: [],
    languages: [],
    approvalAuthorities: [],
    facilities: [],
    hospitalFacilities: [],
    hostelFacilities: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    popularName: "",
    shortName: "",
    estdYear: "",
    campusSize: "",
    ownership: "",
    affiliation: "",
    languages: [],
    approvedThrough: [],
    facilities: [],
    hospitalFacilities: [],
    hostelFacilities: [],
    haveHostel: "",
    haveHospital: "",
    hospitalBeds: "",
    intake: [],

    // Address Information
    addressLine1: "",
    addressLine2: "",
    country: "",
    state: "",
    district: "",
    location: "",
    landmark: "",
    pinCode: "",

    // Contact Information
    phoneNumber: "",
    tollFreeNumber: "",
    helplineNumber: "",
    websiteUrl: "",
    emailAddress: "",

    // Social Media Links
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",

    // Media & Documents
    logo: null,
    banner: null,

    // Description
    shortDescription: "",
    longDescription: "",

    // Status and Metadata
    status: "active",
    isFeatured: false,
    isPopular: false,
    isVerified: false,
    displayOrder: 0,
  });

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Master data states
  const [showAffiliationModal, setShowAffiliationModal] = useState(false);
  const [showApprovedThroughModal, setShowApprovedThroughModal] =
    useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showFacilitiesModal, setShowFacilitiesModal] = useState(false);
  const [showHospitalFacilitiesModal, setShowHospitalFacilitiesModal] =
    useState(false);
  const [showHostelFacilitiesModal, setShowHostelFacilitiesModal] =
    useState(false);

  const [showStateModal, setShowStateModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [stateRefreshKey, setStateRefreshKey] = useState(0);
  const [districtRefreshKey, setDistrictRefreshKey] = useState(0);
  const [stateSubmitLoading, setStateSubmitLoading] = useState(false);
  const [districtSubmitLoading, setDistrictSubmitLoading] = useState(false);
  const [locationMasterCountries, setLocationMasterCountries] = useState([]);
  const [stateFormData, setStateFormData] = useState({ country: "", name: "", code: "", logo: null, map: null, status: "active" });
  const [stateLogoPreview, setStateLogoPreview] = useState(null);
  const [stateMapPreview, setStateMapPreview] = useState(null);
  const [districtFormData, setDistrictFormData] = useState({ country: "", state: "", name: "", status: "active" });

  useEffect(() => {
    if (!showStateModal) return;
    fetch("/api/locations/country-master?all=true").then((response) => response.json())
      .then((result) => setLocationMasterCountries(result.success ? result.data.map((item) => ({ value: item._id, label: item.name })) : []))
      .catch(() => setLocationMasterCountries([]));
  }, [showStateModal]);

  const uploadStateAsset = useCallback(async (asset, identifier) => {
    if (!asset || typeof asset === "string") return asset || undefined;
    const token = getAccessToken();
    if (!token) throw new Error("Authentication required");
    const uploadData = new FormData();
    uploadData.append("file", asset); uploadData.append("type", "states"); uploadData.append("identifier", identifier);
    const response = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: uploadData });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || `Failed to upload ${identifier}`);
    return result.file.fileUrl;
  }, [getAccessToken]);

  const handleStateSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!stateFormData.country || !stateFormData.name.trim() || !stateFormData.code.trim()) return showWarning("Location Master country, state name and code are required");
    try {
      setStateSubmitLoading(true);
      const [logo, map] = await Promise.all([uploadStateAsset(stateFormData.logo, "state-logo"), uploadStateAsset(stateFormData.map, "state-map")]);
      const data = await makeAuthenticatedRequest("/api/locations/states", { method: "POST", body: JSON.stringify({
        name: stateFormData.name.trim(), code: stateFormData.code.trim().toUpperCase(), country: stateFormData.country,
        status: stateFormData.status, ...(logo ? { logo } : {}), ...(map ? { map } : {}),
      }) });
      if (!data.success) return showError(data.error || "Failed to add state");
      let canSelectInCollege = false;
      if (formData.country) {
        const response = await fetch(`/api/locations/states?all=true&country=${formData.country}`);
        const result = await response.json();
        canSelectInCollege = result.success && result.data.some((item) => item._id === data.data._id);
      }
      if (canSelectInCollege) setFormData((prev) => ({ ...prev, state: data.data._id, district: "" }));
      setStateRefreshKey((key) => key + 1); setShowStateModal(false);
      setStateFormData({ country: "", name: "", code: "", logo: null, map: null, status: "active" });
      setStateLogoPreview(null); setStateMapPreview(null);
      showSuccess("State added successfully!");
    } catch (error) { console.error("Error adding state:", error); showError(error.message || "Error adding state"); }
    finally { setStateSubmitLoading(false); }
  }, [formData.country, makeAuthenticatedRequest, stateFormData, uploadStateAsset]);

  const handleDistrictSubmit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!districtFormData.country || !districtFormData.state || !districtFormData.name.trim()) return showWarning("Location Master country, state and district name are required");
    try {
      setDistrictSubmitLoading(true);
      const data = await makeAuthenticatedRequest("/api/locations/districts", { method: "POST", body: JSON.stringify({
        name: districtFormData.name.trim(), state: districtFormData.state, status: districtFormData.status,
      }) });
      if (!data.success) return showError(data.error || "Failed to add district");
      const canSelectInCollege = formData.state === districtFormData.state;
      if (canSelectInCollege) setFormData((prev) => ({ ...prev, district: data.data._id }));
      setDistrictRefreshKey((key) => key + 1); setShowDistrictModal(false);
      setDistrictFormData({ country: "", state: "", name: "", status: "active" });
      showSuccess("District added successfully!");
    } catch (error) { console.error("Error adding district:", error); showError(error.message || "Error adding district"); }
    finally { setDistrictSubmitLoading(false); }
  }, [districtFormData, formData.state, makeAuthenticatedRequest]);

  // Modal form states
  const [affiliationFormData, setAffiliationFormData] = useState({
    name: "",
    status: "active",
  });
  const [approvedThroughFormData, setApprovedThroughFormData] = useState({
    name: "",
    status: "active",
  });
  const [facilityFormData, setFacilityFormData] = useState({
    name: "",
    image: null,
    status: "active",
  });
  const [hospitalFacilityFormData, setHospitalFacilityFormData] = useState({
    name: "",
    image: null,
    status: "active",
  });
  const [hostelFacilityFormData, setHostelFacilityFormData] = useState({
    name: "",
    image: null,
    status: "active",
  });
  const [ownershipFormData, setOwnershipFormData] = useState({
    name: "",
    status: "active",
  });

  // Modal submit loading states
  const [affiliationSubmitLoading, setAffiliationSubmitLoading] =
    useState(false);
  const [approvedThroughSubmitLoading, setApprovedThroughSubmitLoading] =
    useState(false);
  const [facilitySubmitLoading, setFacilitySubmitLoading] = useState(false);
  const [hospitalFacilitySubmitLoading, setHospitalFacilitySubmitLoading] =
    useState(false);
  const [hostelFacilitySubmitLoading, setHostelFacilitySubmitLoading] =
    useState(false);
  const [ownershipSubmitLoading, setOwnershipSubmitLoading] = useState(false);

  // Load college data and dropdown data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log("🔄 Loading college data and dropdowns...");

        // Load college data and dropdown data in parallel
        const [
          collegeResponse,
          ownershipResponse,
          affiliationResponse,
          languagesResponse,
          approvedResponse,
          facilitiesResponse,
          hospitalFacilitiesResponse,
          hostelFacilitiesResponse,
        ] = await Promise.all([
          makeAuthenticatedRequest(`/api/colleges/${collegeId}`),
          fetch("/api/master/ownership?all=true"),
          fetch("/api/master/affiliation?all=true"),
          fetch("/api/languages?status=active&limit=100"),
          fetch("/api/master/approved-through?all=true"),
          fetch("/api/master/college-facility?all=true"),
          fetch("/api/master/hospital-facility?all=true"),
          fetch("/api/master/hostel-facility?all=true"),
        ]);

        const [
          ownershipData,
          affiliationData,
          languagesData,
          approvedData,
          facilitiesData,
          hospitalFacilitiesData,
          hostelFacilitiesData,
        ] = await Promise.all([
          ownershipResponse.json(),
          affiliationResponse.json(),
          languagesResponse.json(),
          approvedResponse.json(),
          facilitiesResponse.json(),
          hospitalFacilitiesResponse.json(),
          hostelFacilitiesResponse.json(),
        ]);

        if (!isMounted) return;

        // Set college data first
        if (collegeResponse.success) {
          const college = collegeResponse.data;
          setFormData({
            // Basic Information
            name: college.name || "",
            popularName: college.popularName || "",
            shortName: college.shortName || "",
            estdYear: college.estdYear || "",
            campusSize: college.campusSize || "",
            ownership: college.ownership?._id || college.ownership || "",
            affiliation: college.affiliation?._id || college.affiliation || "",
            languages: college.languages?.map((lang) => lang._id || lang) || [],
            approvedThrough: Array.isArray(college.approvedThrough)
              ? college.approvedThrough.map((item) => item._id || item)
              : college.approvedThrough?._id || college.approvedThrough
              ? [college.approvedThrough._id || college.approvedThrough]
              : [],
            facilities: college.facilities?.map((f) => f._id || f) || [],
            hospitalFacilities:
              college.hospitalFacilities?.map((f) => f._id || f) || [],
            hostelFacilities:
              college.hostelFacilities?.map((f) => f._id || f) || [],
            haveHostel: college.haveHostel ? "yes" : "no",
            haveHospital: college.haveHospital ? "yes" : "no",
            hospitalBeds: college.hospitalBeds || "",
            intake: college.intake || [],

            // Address Information
            addressLine1: college.addressLine1 || "",
            addressLine2: college.addressLine2 || "",
            country:
              college.country?._id ||
              college.country ||
              college.state?.country?._id ||
              college.state?.country ||
              "",
            state: college.state?._id || college.state || "",
            district: college.district?._id || college.district || "",
            location: college.location || "",
            landmark: college.landmark || "",
            pinCode: college.pinCode || "",

            // Contact Information
            phoneNumber: college.phoneNumber || "",
            tollFreeNumber: college.tollFreeNumber || "",
            helplineNumber: college.helplineNumber || "",
            websiteUrl: college.websiteUrl || "",
            emailAddress: college.emailAddress || "",

            // Social Media Links
            facebookUrl: college.facebookUrl || "",
            twitterUrl: college.twitterUrl || "",
            instagramUrl: college.instagramUrl || "",
            youtubeUrl: college.youtubeUrl || "",
            linkedinUrl: college.linkedinUrl || "",

            // Media & Documents
            logo: college.logo || null,
            banner: college.banner || null,

            // Description
            shortDescription: college.shortDescription || "",
            longDescription: college.longDescription || "",

            // Status and Metadata
            status: college.status || "active",
            isFeatured: college.isFeatured || false,
            isPopular: college.isPopular || false,
            isVerified: college.isVerified || false,
            displayOrder: college.displayOrder || 0,
          });

        } else {
          showError("Failed to load college data: " + collegeResponse.error);
          router.push("/admin/college");
          return;
        }

        // Update state with all dropdown data
        setBasicDataLists((prev) => ({
          ...prev,
          ownershipTypes: ownershipData.success
            ? ownershipData.data.map((own) => ({
                id: own._id,
                name: own.name,
              }))
            : [],
          affiliations: affiliationData.success
            ? affiliationData.data.map((aff) => ({
                id: aff._id,
                name: aff.name,
              }))
            : [],
          languages: languagesData.success
            ? languagesData.data.map((lang) => ({
                id: lang.id,
                name: lang.name,
              }))
            : [],
          approvalAuthorities: approvedData.success
            ? approvedData.data.map((app) => ({
                id: app._id,
                name: app.name,
              }))
            : [],
          facilities: facilitiesData.success
            ? facilitiesData.data.map((fac) => ({
                id: fac._id,
                name: fac.name,
                image: fac.image,
              }))
            : [],
          hospitalFacilities: hospitalFacilitiesData?.success
            ? hospitalFacilitiesData.data.map((fac) => ({
                id: fac._id,
                name: fac.name,
                image: fac.image,
              }))
            : [],
          hostelFacilities: hostelFacilitiesData?.success
            ? hostelFacilitiesData.data.map((fac) => ({
                id: fac._id,
                name: fac.name,
                image: fac.image,
              }))
            : [],
        }));

        console.log("✅ Dropdown data loaded successfully");
      } catch (error) {
        console.error("❌ Error loading dropdown data:", error);
        showError("Failed to load data. Please refresh the page.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [collegeId, getAccessToken, router]);

  // Memoized modal handlers
  const openAffiliationModal = useCallback(
    () => setShowAffiliationModal(true),
    []
  );
  const closeAffiliationModal = useCallback(
    () => setShowAffiliationModal(false),
    []
  );
  const openApprovedThroughModal = useCallback(
    () => setShowApprovedThroughModal(true),
    []
  );
  const closeApprovedThroughModal = useCallback(
    () => setShowApprovedThroughModal(false),
    []
  );
  const openFacilitiesModal = useCallback(
    () => setShowFacilitiesModal(true),
    []
  );
  const closeFacilitiesModal = useCallback(
    () => setShowFacilitiesModal(false),
    []
  );
  const openHospitalFacilitiesModal = useCallback(
    () => setShowHospitalFacilitiesModal(true),
    []
  );
  const closeHospitalFacilitiesModal = useCallback(
    () => setShowHospitalFacilitiesModal(false),
    []
  );
  const openHostelFacilitiesModal = useCallback(
    () => setShowHostelFacilitiesModal(true),
    []
  );
  const closeHostelFacilitiesModal = useCallback(
    () => setShowHostelFacilitiesModal(false),
    []
  );
  // Ownership modal handlers
  const openOwnershipModal = useCallback(() => setShowOwnershipModal(true), []);
  const closeOwnershipModal = useCallback(
    () => setShowOwnershipModal(false),
    []
  );

  // Handle ownership form submission
  const handleOwnershipSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      try {
        setOwnershipSubmitLoading(true);

        const data = await makeAuthenticatedRequest("/api/master/ownership", {
          method: "POST",
          body: JSON.stringify(ownershipFormData),
        });

        if (data.success) {
          // Add new ownership to the list
          const newOwnership = {
            id: data.data._id,
            name: data.data.name,
          };

          setBasicDataLists((prev) => ({
            ...prev,
            ownershipTypes: [...prev.ownershipTypes, newOwnership],
          }));

          // Select the newly added ownership
          setFormData((prev) => ({ ...prev, ownership: data.data._id }));

          // Close modal and reset form
          closeOwnershipModal();
          setOwnershipFormData({ name: "", description: "", status: "active" });

          showSuccess("Ownership type added successfully!");
        } else {
          showError("Failed to add ownership type: " + data.error);
        }
      } catch (error) {
        console.error("Error adding ownership type:", error);
        showError("Error adding ownership type");
      } finally {
        setOwnershipSubmitLoading(false);
      }
    },
    [ownershipFormData, closeOwnershipModal, makeAuthenticatedRequest]
  );

  // Handle affiliation form submission
  const handleAffiliationSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      try {
        setAffiliationSubmitLoading(true);

        const data = await makeAuthenticatedRequest("/api/master/affiliation", {
          method: "POST",
          body: JSON.stringify(affiliationFormData),
        });

        if (data.success) {
          // Add new affiliation to the list
          const newAffiliation = {
            id: data.data._id,
            name: data.data.name,
          };

          setBasicDataLists((prev) => ({
            ...prev,
            affiliations: [...prev.affiliations, newAffiliation],
          }));

          // Select the newly added affiliation
          setFormData((prev) => ({ ...prev, affiliation: data.data._id }));

          // Close modal and reset form
          closeAffiliationModal();
          setAffiliationFormData({
            name: "",
            description: "",
            status: "active",
          });

          showSuccess("Affiliation added successfully!");
        } else {
          showError("Failed to add affiliation: " + data.error);
        }
      } catch (error) {
        console.error("Error adding affiliation:", error);
        showError("Error adding affiliation");
      } finally {
        setAffiliationSubmitLoading(false);
      }
    },
    [affiliationFormData, closeAffiliationModal, makeAuthenticatedRequest]
  );

  // Handle approved through form submission
  const handleApprovedThroughSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      try {
        setApprovedThroughSubmitLoading(true);

        const data = await makeAuthenticatedRequest(
          "/api/master/approved-through",
          {
            method: "POST",
            body: JSON.stringify(approvedThroughFormData),
          }
        );

        if (data.success) {
          // Add new approved through to the list
          const newApprovedThrough = {
            id: data.data._id,
            name: data.data.name,
          };

          setBasicDataLists((prev) => ({
            ...prev,
            approvalAuthorities: [
              ...prev.approvalAuthorities,
              newApprovedThrough,
            ],
          }));

          // Add the newly added approved through to the array
          setFormData((prev) => ({
            ...prev,
            approvedThrough: Array.isArray(prev.approvedThrough)
              ? [...prev.approvedThrough, data.data._id]
              : [data.data._id],
          }));

          // Close modal and reset form
          closeApprovedThroughModal();
          setApprovedThroughFormData({
            name: "",
            description: "",
            status: "active",
          });

          showSuccess("Approval authority added successfully!");
        } else {
          showError("Failed to add approval authority: " + data.error);
        }
      } catch (error) {
        console.error("Error adding approval authority:", error);
        showError("Error adding approval authority");
      } finally {
        setApprovedThroughSubmitLoading(false);
      }
    },
    [
      approvedThroughFormData,
      closeApprovedThroughModal,
      makeAuthenticatedRequest,
    ]
  );

  // Handle facility form submission
  const handleFacilitySubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      try {
        setFacilitySubmitLoading(true);

        const data = await makeAuthenticatedRequest(
          "/api/master/college-facility",
          {
            method: "POST",
            body: JSON.stringify(facilityFormData),
          }
        );

        if (data.success) {
          const newFacility = {
            id: data.data._id,
            name: data.data.name,
            image: data.data.image,
          };

          setBasicDataLists((prev) => ({
            ...prev,
            facilities: [...prev.facilities, newFacility],
          }));

          // Close modal and reset form
          closeFacilitiesModal();
          setFacilityFormData({
            name: "",
            image: null,
            description: "",
            status: "active",
          });

          showSuccess("Facility added successfully!");
        } else {
          showError("Failed to add facility: " + data.error);
        }
      } catch (error) {
        console.error("Error adding facility:", error);
        showError("Error adding facility");
      } finally {
        setFacilitySubmitLoading(false);
      }
    },
    [facilityFormData, closeFacilitiesModal, makeAuthenticatedRequest]
  );

  // Handle hospital facility form submission
  const handleHospitalFacilitySubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      try {
        setHospitalFacilitySubmitLoading(true);

        const data = await makeAuthenticatedRequest(
          "/api/master/hospital-facility",
          {
            method: "POST",
            body: JSON.stringify(hospitalFacilityFormData),
          }
        );

        if (data.success) {
          const newFacility = {
            id: data.data._id,
            name: data.data.name,
            image: data.data.image,
          };

          setBasicDataLists((prev) => ({
            ...prev,
            hospitalFacilities: [...prev.hospitalFacilities, newFacility],
          }));

          setHospitalFacilityFormData({
            name: "",
            image: null,
            description: "",
            status: "active",
          });

          closeHospitalFacilitiesModal();
          showSuccess("Hospital facility added successfully!");
        } else {
          showError("Failed to add hospital facility: " + data.error);
        }
      } catch (error) {
        console.error("Error adding hospital facility:", error);
        showError("Error adding hospital facility");
      } finally {
        setHospitalFacilitySubmitLoading(false);
      }
    },
    [
      hospitalFacilityFormData,
      closeHospitalFacilitiesModal,
      makeAuthenticatedRequest,
    ]
  );

  // Handle hostel facility form submission
  const handleHostelFacilitySubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      try {
        setHostelFacilitySubmitLoading(true);

        const data = await makeAuthenticatedRequest(
          "/api/master/hostel-facility",
          {
            method: "POST",
            body: JSON.stringify(hostelFacilityFormData),
          }
        );

        if (data.success) {
          const newFacility = {
            id: data.data._id,
            name: data.data.name,
            image: data.data.image,
          };

          setBasicDataLists((prev) => ({
            ...prev,
            hostelFacilities: [...prev.hostelFacilities, newFacility],
          }));

          setHostelFacilityFormData({
            name: "",
            image: null,
            description: "",
            status: "active",
          });

          closeHostelFacilitiesModal();
          showSuccess("Hostel facility added successfully!");
        } else {
          showError("Failed to add hostel facility: " + data.error);
        }
      } catch (error) {
        console.error("Error adding hostel facility:", error);
        showError("Error adding hostel facility");
      } finally {
        setHostelFacilitySubmitLoading(false);
      }
    },
    [
      hostelFacilityFormData,
      closeHostelFacilitiesModal,
      makeAuthenticatedRequest,
    ]
  );

  // Handle select change
  const handleSelectChange = useCallback((name, value) => {
    console.log(
      `Select change - Field: ${name}, Value:`,
      value,
      "Type:",
      typeof value,
      "IsArray:",
      Array.isArray(value)
    );
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Convert basicDataLists to dropdown options format
  const ownershipOptions = basicDataLists.ownershipTypes
    .filter((own) => own._id || own.id)
    .map((own) => ({
      value: own._id || own.id,
      label: own.name,
    }));

  // Additional options for other dropdowns
  const affiliationOptions = basicDataLists.affiliations
    .filter((aff) => aff._id || aff.id)
    .map((aff) => ({
      value: aff._id || aff.id,
      label: aff.name,
    }));

  const languageOptions = basicDataLists.languages
    .filter((lang) => lang._id || lang.id)
    .map((lang) => ({
      value: lang._id || lang.id,
      label: lang.name,
    }));

  const approvedThroughOptions = basicDataLists.approvalAuthorities
    .filter((auth) => auth._id || auth.id)
    .map((auth) => ({
      value: auth._id || auth.id,
      label: auth.name,
    }));

  // Validation functions
  const validatePinCode = (value) => {
    // Only allow digits, max 10 characters
    return value.replace(/[^0-9]/g, "").slice(0, 10);
  };

  const validatePhoneNumber = (value) => {
    // Allow digits, +, -, spaces, parentheses - max 20 characters
    return value.replace(/[^0-9+\-\(\)\s]/g, "").slice(0, 20);
  };

  const validateTollFreeNumber = (value) => {
    // Allow digits, -, spaces - max 20 characters
    return value.replace(/[^0-9\-\s]/g, "").slice(0, 20);
  };

  const validateHelplineNumber = (value) => {
    // Allow digits, +, -, spaces, parentheses - max 20 characters
    return value.replace(/[^0-9+\-\(\)\s]/g, "").slice(0, 20);
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Apply specific validation based on field type
    switch (name) {
      case "pinCode":
        sanitizedValue = validatePinCode(value);
        break;
      case "phoneNumber":
        sanitizedValue = validatePhoneNumber(value);
        break;
      case "tollFreeNumber":
        sanitizedValue = validateTollFreeNumber(value);
        break;
      case "helplineNumber":
        sanitizedValue = validateHelplineNumber(value);
        break;
      default:
        sanitizedValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  }, []);

  // Memoized select handlers
  const handleOwnershipChange = useCallback(
    (value) => handleSelectChange("ownership", value),
    [handleSelectChange]
  );
  const handleAffiliationChange = useCallback(
    (value) => handleSelectChange("affiliation", value),
    [handleSelectChange]
  );
  const handleLanguageChange = useCallback(
    (value) => handleSelectChange("languages", value),
    [handleSelectChange]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        setSubmitLoading(true);

        // Prepare data for API
        const apiData = {
          ...formData,
          // Convert IDs to ObjectIds for API
          ownership: formData.ownership,
          affiliation: formData.affiliation,
          approvedThrough: formData.approvedThrough,
          country: formData.country,
          state: formData.state,
          district: formData.district,
          facilities: formData.facilities || [],
          logo: formData.logo || null,
          banner: formData.banner || null,
        };

        const data = await makeAuthenticatedRequest(
          `/api/colleges/${collegeId}`,
          {
            method: "PUT",
            body: JSON.stringify(apiData),
          }
        );

        if (data.success) {
          showSuccess("College updated successfully!");
          // Redirect to college list
          setTimeout(() => {
            router.push("/admin/college");
          }, 1500);
        } else {
          // Show specific validation errors if available, otherwise show generic error
          if (
            data.details &&
            Array.isArray(data.details) &&
            data.details.length > 0
          ) {
            // Show the first specific validation error
            showError("Validation Error: " + data.details[0]);
          } else {
            showError("Failed to update college: " + data.error);
          }
        }
      } catch (error) {
        console.error("Error updating college:", error);
        showError("Error updating college. Please try again.");
      } finally {
        setSubmitLoading(false);
      }
    },
    [formData, makeAuthenticatedRequest, collegeId, router]
  );

  // Master data handlers
  const handleAddAffiliation = useCallback((name) => {
    console.log("Adding affiliation:", name);
    setShowAffiliationModal(false);
  }, []);

  const handleAddApprovedThrough = useCallback((name) => {
    console.log("Adding approved through:", name);
    setShowApprovedThroughModal(false);
  }, []);

  const handleAddFacility = useCallback((name) => {
    console.log("Adding facility:", name);
    setShowFacilitiesModal(false);
  }, []);

  // Ownership handler
  const handleAddOwnership = useCallback((name) => {
    console.log("Adding ownership:", name);
    setShowOwnershipModal(false);
  }, []);

  // Memoized onChange handlers for Short Description (limit 500 chars)
  const handleShortDescriptionChange = useCallback((content) => {
    const limited = (content || "").slice(0, 1500);
    setFormData((prev) => ({
      ...prev,
      shortDescription: limited,
    }));
  }, []);

  const handleLongDescriptionChange = useCallback((content) => {
    setFormData((prev) => ({
      ...prev,
      longDescription: content,
    }));
  }, []);

  const LoadingSkeleton = () => (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-32 mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-60 animate-pulse"></div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-18 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-18 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
                <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
              <div className="h-20 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
              <div className="h-32 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Form Actions Skeleton */}
        <div className="border-t border-gray-200 dark:border-slate-800 pt-4 flex justify-end gap-2 mt-6">
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-24 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  const labelClassName =
    "text-xs font-medium text-gray-700 dark:text-white/80 mb-1 block transition-colors";
  const inputClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50 transition-colors";
  const selectButtonClassName =
    "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded text-sm text-left flex items-center justify-between outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary/30 bg-white dark:bg-slate-900/70 text-gray-900 dark:text-white transition-colors cursor-pointer";
  const helperTextClassName =
    "text-xs text-gray-500 dark:text-white/60 transition-colors";
  const sectionHeadingClassName =
    "text-lg font-semibold text-gray-900 dark:text-white transition-colors";
  const checkboxClassName =
    "w-4 h-4 text-primary border-gray-300 dark:border-slate-700 rounded focus:ring-primary dark:bg-slate-900/70";
  const addIconButtonClassName =
    "absolute top-0 right-0 w-8 h-full bg-primary text-white rounded-r hover:bg-primary-700 transition-colors flex items-center justify-center text-sm font-bold z-10";
  const secondaryActionClassName =
    "px-4 py-2 text-sm text-gray-700 dark:text-white/80 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900/70 no-underline hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors";
  const primaryActionClassName =
    "px-4 py-2 text-sm text-white bg-primary border-none rounded cursor-pointer font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Page Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/admin/college"
            className="text-gray-600 dark:text-white/70 no-underline text-xs flex items-center gap-1 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-500 dark:text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Colleges
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5">
          Edit College
        </h1>
        <p className="text-xs text-gray-600 dark:text-white/70">
          Update college information for CCIC
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-colors">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Basic Information</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>College Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter college name"
                  required
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Popular Name</label>
                <input
                  type="text"
                  name="popularName"
                  value={formData.popularName}
                  onChange={handleInputChange}
                  placeholder="Enter college popular name"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Short Name</label>
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleInputChange}
                  placeholder="Enter college short name"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Estd. Year</label>
                <input
                  type="text"
                  name="estdYear"
                  value={formData.estdYear}
                  onChange={handleInputChange}
                  placeholder="e.g., 1995"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Campus Size</label>
                <input
                  type="text"
                  name="campusSize"
                  value={formData.campusSize}
                  onChange={handleInputChange}
                  placeholder="e.g., 50 Acres"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Ownership</label>
                <div className="relative">
                  <ApnaSelect
                    title=""
                    options={ownershipOptions}
                    value={formData.ownership}
                    onChange={handleOwnershipChange}
                    placeholder="-- Select Ownership --"
                    searchable={true}
                    buttonClassName={selectButtonClassName}
                  />
                  <button
                    type="button"
                    onClick={openOwnershipModal}
                    className={addIconButtonClassName}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClassName}>Affiliation*</label>
                <div className="relative">
                  <ApnaSelect
                    title=""
                    options={affiliationOptions}
                    value={formData.affiliation}
                    onChange={handleAffiliationChange}
                    placeholder="Select Affiliation --"
                    searchable={true}
                    buttonClassName={selectButtonClassName}
                  />
                  <button
                    type="button"
                    onClick={openAffiliationModal}
                    className={`${addIconButtonClassName} font-bold`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClassName}>Languages</label>
                <ApnaSelect
                  title=""
                  options={languageOptions}
                  value={formData.languages}
                  onChange={handleLanguageChange}
                  placeholder="Select Languages --"
                  searchable={true}
                  buttonClassName={selectButtonClassName}
                  multiple={true}
                />
              </div>
              {/* Approved Through */}
              <div>
                <label className={labelClassName}>Approval Authority</label>
                <div className="relative">
                  <ApnaSelect
                    title=""
                    options={approvedThroughOptions}
                    value={formData.approvedThrough}
                    onChange={(value) =>
                      handleSelectChange("approvedThrough", value)
                    }
                    placeholder="Select Approval Authority --"
                    searchable={true}
                    buttonClassName={selectButtonClassName}
                    multiple={true}
                  />
                  <button
                    type="button"
                    onClick={openApprovedThroughModal}
                    className={`${addIconButtonClassName} font-bold`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Master Data Fields */}
            <div className="mt-6">
              {/* Approval Authority, College Facilities, and Intake in same row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Hospital Facilities */}
                <div>
                  <label className={labelClassName}>Hospital Facilities</label>
                  <div className="relative">
                    <ApnaSelect
                      title=""
                      options={basicDataLists.hospitalFacilities
                        .filter((facility) => facility._id || facility.id)
                        .map((facility) => ({
                          value: facility._id || facility.id,
                          label: facility.name,
                        }))}
                      value={formData.hospitalFacilities}
                      onChange={(value) =>
                        handleSelectChange("hospitalFacilities", value)
                      }
                      placeholder="Select Hospital Facilities --"
                      searchable={true}
                      buttonClassName={selectButtonClassName}
                      multiple={true}
                    />
                    <button
                      type="button"
                      onClick={openHospitalFacilitiesModal}
                      className={addIconButtonClassName}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* College Facilities */}
                <div>
                  <label className={labelClassName}>College Facilities</label>
                  <div className="relative">
                    <ApnaSelect
                      title=""
                      options={basicDataLists.facilities
                        .filter((facility) => facility._id || facility.id)
                        .map((facility) => ({
                          value: facility._id || facility.id,
                          label: facility.name,
                        }))}
                      value={formData.facilities}
                      onChange={(value) =>
                        handleSelectChange("facilities", value)
                      }
                      placeholder="Select College Facilities --"
                      searchable={true}
                      buttonClassName={selectButtonClassName}
                      multiple={true}
                    />
                    <button
                      type="button"
                      onClick={openFacilitiesModal}
                      className={`${addIconButtonClassName} font-bold`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Intake */}
                <div>
                  <label className={labelClassName}>Intake</label>
                  <ApnaSelect
                    title=""
                    options={[
                      { value: "January", label: "January" },
                      { value: "February", label: "February" },
                      { value: "March", label: "March" },
                      { value: "April", label: "April" },
                      { value: "May", label: "May" },
                      { value: "June", label: "June" },
                      { value: "July", label: "July" },
                      { value: "August", label: "August" },
                      { value: "September", label: "September" },
                      { value: "October", label: "October" },
                      { value: "November", label: "November" },
                      { value: "December", label: "December" },
                    ]}
                    value={formData.intake}
                    onChange={(value) => handleSelectChange("intake", value)}
                    placeholder="Select Intake Months --"
                    searchable={true}
                    buttonClassName={selectButtonClassName}
                    multiple={true}
                  />
                </div>
              </div>

              {/* Hostel Facilities, Have Hostel, and Have Hospital in same row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Have Hostel */}
                <div>
                  <label className={labelClassName}>Have Hostel</label>
                  <ApnaSelect
                    title=""
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    value={formData.haveHostel}
                    onChange={(value) =>
                      handleSelectChange("haveHostel", value)
                    }
                    placeholder="Select --"
                    searchable={false}
                    buttonClassName={selectButtonClassName}
                  />
                </div>

                {/* Have Hospital with beds count */}
                <div className="relative">
                  <label className={labelClassName}>Have Hospital</label>
                  <div className="relative">
                    <ApnaSelect
                      title=""
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      value={formData.haveHospital}
                      onChange={(value) => {
                        handleSelectChange("haveHospital", value);
                        if (value !== "yes") {
                          handleSelectChange("hospitalBeds", "");
                        }
                      }}
                      placeholder="Select --"
                      searchable={false}
                      buttonClassName={selectButtonClassName}
                    />
                    {formData.haveHospital === "yes" && (
                      <input
                        type="number"
                        value={formData.hospitalBeds}
                        onChange={(e) =>
                          handleSelectChange("hospitalBeds", e.target.value)
                        }
                        placeholder="No of Beds"
                        min="0"
                        className="absolute top-0 w-1/2 right-0 px-3 py-2 rounded text-sm outline-none transition-all duration-200 border border-gray-300 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-l-none z-10"
                      />
                    )}
                  </div>
                </div>

                {/* Hostel Facilities */}
                <div>
                  <label className={labelClassName}>Hostel Facilities</label>
                  <div className="relative">
                    <ApnaSelect
                      title=""
                      options={basicDataLists.hostelFacilities
                        .filter((facility) => facility._id || facility.id)
                        .map((facility) => ({
                          value: facility._id || facility.id,
                          label: facility.name,
                        }))}
                      value={formData.hostelFacilities}
                      onChange={(value) =>
                        handleSelectChange("hostelFacilities", value)
                      }
                      placeholder="Select Hostel Facilities --"
                      searchable={true}
                      buttonClassName={selectButtonClassName}
                      multiple={true}
                    />
                    <button
                      type="button"
                      onClick={openHostelFacilitiesModal}
                      className={`${addIconButtonClassName} font-bold`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Address Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Address Line 1</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="Enter address line 1"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Enter address line 2"
                  className={inputClassName}
                />
              </div>

            <LocationSelects
              country={formData.country}
              state={formData.state}
              district={formData.district}
              onCountryChange={(value) => handleSelectChange("country", value)}
              onStateChange={(value) => handleSelectChange("state", value)}
              onDistrictChange={(value) => handleSelectChange("district", value)}
              labelClassName={labelClassName}
              selectButtonClassName={selectButtonClassName}
              gridClassName="col-span-2 grid grid-cols-3 gap-4"
              onAddCountry={() => { window.open("/admin/country/add", "_blank", "noopener,noreferrer"); }}
              onAddState={() => setShowStateModal(true)}
              onAddDistrict={() => setShowDistrictModal(true)}
              stateRefreshKey={stateRefreshKey}
              districtRefreshKey={districtRefreshKey}
              addButtonClassName={addIconButtonClassName}
            />
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className={labelClassName}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter Location"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Landmark</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  placeholder="Enter landmark Near college"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Pin Code</label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  placeholder="e.g., 123456 (digits only)"
                  maxLength={10}
                  pattern="[0-9]{1,10}"
                  title="Enter only digits (max 10 characters)"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Contact Information</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., +91-1234567890 (digits, +, -, spaces, ())"
                  maxLength={20}
                  pattern="[0-9+\-\(\)\s]{1,20}"
                  title="Enter phone number with digits, +, -, spaces, parentheses (max 20 characters)"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Toll Free Number</label>
                <input
                  type="text"
                  name="tollFreeNumber"
                  value={formData.tollFreeNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 1800-123-4567 (digits, -, spaces)"
                  maxLength={20}
                  pattern="[0-9\-\s]{1,20}"
                  title="Enter toll-free number with digits, -, spaces (max 20 characters)"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Helpline Number</label>
                <input
                  type="text"
                  name="helplineNumber"
                  value={formData.helplineNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., +91-9876543210 (digits, +, -, spaces, ())"
                  maxLength={20}
                  pattern="[0-9+\-\(\)\s]{1,20}"
                  title="Enter helpline number with digits, +, -, spaces, parentheses (max 20 characters)"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClassName}>Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  placeholder="e.g., https://www.collegename.edu"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Email Address</label>
                <input
                  type="text"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., info@collegename.edu"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Social Media Links</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Facebook URL</label>
                <input
                  type="url"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/collegename"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>Twitter URL</label>
                <input
                  type="url"
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/collegename"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className={labelClassName}>Instagram URL</label>
                <input
                  type="url"
                  name="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/collegename"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>YouTube URL</label>
                <input
                  type="url"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/@collegename"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className={labelClassName}>LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/collegename"
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Media & Documents */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Media & Documents</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <ImageUpload
                  title="College Logo"
                  type="image"
                  preview={formData.logo}
                  onFileChange={(file, preview) =>
                    setFormData((prev) => ({ ...prev, logo: preview }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, logo: null }))
                  }
                  accept="image/*"
                  maxSize="2MB"
                  width="200px"
                  height="200px"
                  className="w-full"
                  uploadType="colleges"
                  identifier="college-logo"
                  onUploadSuccess={(fileData) => {
                    setFormData((prev) => ({
                      ...prev,
                      logo: fileData.fileUrl,
                    }));
                  }}
                  onUploadError={(error) => {
                    console.error("Logo upload failed:", error);
                  }}
                  showUploadProgress={true}
                />
                <p className={`${helperTextClassName} mt-1`}>
                  Upload college logo (PNG, JPG - Max 2MB)
                </p>
              </div>

              <div>
                <ImageUpload
                  title="College Banner"
                  type="image"
                  preview={formData.banner}
                  onFileChange={(file, preview) =>
                    setFormData((prev) => ({ ...prev, banner: preview }))
                  }
                  onRemove={() =>
                    setFormData((prev) => ({ ...prev, banner: null }))
                  }
                  accept="image/*"
                  maxSize="5MB"
                  width="200px"
                  height="200px"
                  className="w-full"
                  uploadType="colleges"
                  identifier="college-banner"
                  onUploadSuccess={(fileData) => {
                    setFormData((prev) => ({
                      ...prev,
                      banner: fileData.fileUrl,
                    }));
                  }}
                  onUploadError={(error) => {
                    console.error("Banner upload failed:", error);
                  }}
                  showUploadProgress={true}
                />
                <p className={`${helperTextClassName} mt-1`}>
                  Upload college banner (PNG, JPG - Max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Description</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClassName}>
                  Short Description (max 1500 characters)
                </label>
                <textarea
                  className={`${inputClassName} min-h-[120px]`}
                  value={formData.shortDescription}
                  onChange={(e) => handleShortDescriptionChange(e.target.value)}
                  placeholder="Enter short description..."
                  maxLength={1500}
                />
              </div>

              <div>
                <label className={labelClassName}>Long Description</label>
                <ApnaEditor
                  value={formData.longDescription}
                  onChange={handleLongDescriptionChange}
                  placeholder="Enter detailed description..."
                />
              </div>
            </div>
          </div>

          {/* Status and Metadata */}
          <div className="border-b border-gray-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className={sectionHeadingClassName}>Status & Metadata</h2>
            </div>

            {/* Status and Display Order - 2 columns */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Status */}
              <div>
                <label className={labelClassName}>Status</label>
                <ApnaSelect
                  title=""
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "draft", label: "Draft" },
                    { value: "pending", label: "Pending" },
                  ]}
                  value={formData.status}
                  onChange={(value) => handleSelectChange("status", value)}
                  placeholder="-- Select Status --"
                  searchable={true}
                  buttonClassName={selectButtonClassName}
                />
              </div>

              {/* Display Order */}
              <div>
                <label className={labelClassName}>Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  placeholder="Enter display order"
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Checkboxes - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              {/* Featured */}
              <div>
                <label className={labelClassName}>Featured College</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isFeatured: e.target.checked,
                      }))
                    }
                    className={checkboxClassName}
                  />
                  <span className="text-xs text-gray-600 dark:text-white/70">
                    Mark as featured
                  </span>
                </div>
              </div>

              {/* Popular */}
              <div>
                <label className={labelClassName}>Popular College</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPopular: e.target.checked,
                      }))
                    }
                    className={checkboxClassName}
                  />
                  <span className="text-xs text-gray-600 dark:text-white/70">
                    Mark as popular
                  </span>
                </div>
              </div>

              {/* Verified */}
              <div>
                <label className={labelClassName}>Verified College</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isVerified"
                    checked={formData.isVerified}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isVerified: e.target.checked,
                      }))
                    }
                    className={checkboxClassName}
                  />
                  <span className="text-xs text-gray-600 dark:text-white/70">
                    Mark as verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Link href="/admin/college" className={secondaryActionClassName}>
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitLoading}
              className={primaryActionClassName}
            >
              {submitLoading ? "Updating..." : "Update College"}
            </button>
          </div>
        </form>
      </div>

      {/* Master Data Modals */}

      {/* Affiliation Modal */}
      <ApnaModal
        isOpen={showAffiliationModal}
        onClose={closeAffiliationModal}
        onSubmit={handleAffiliationSubmit}
        title="Add New Affiliation"
        size="md"
        submitText="Add Affiliation"
        loading={affiliationSubmitLoading}
      >
        <form onSubmit={handleAffiliationSubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Affiliation Name *</label>
            <input
              type="text"
              name="name"
              value={affiliationFormData.name}
              onChange={(e) =>
                setAffiliationFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter affiliation name (e.g., Ayush, Medical Council)"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              name="description"
              value={affiliationFormData.description}
              onChange={(e) =>
                setAffiliationFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter description (optional)"
              rows={3}
              className={inputClassName}
            />
          </div>
        </form>
      </ApnaModal>

      {/* Approved Through Modal */}
      <ApnaModal
        isOpen={showApprovedThroughModal}
        onClose={closeApprovedThroughModal}
        onSubmit={handleApprovedThroughSubmit}
        title="Add New Approval Authority"
        size="md"
        submitText="Add Authority"
        loading={approvedThroughSubmitLoading}
      >
        <form onSubmit={handleApprovedThroughSubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Approval Authority *</label>
            <input
              type="text"
              name="name"
              value={approvedThroughFormData.name}
              onChange={(e) =>
                setApprovedThroughFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter approval authority (e.g., AICTE, UGC, State Govt)"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              name="description"
              value={approvedThroughFormData.description}
              onChange={(e) =>
                setApprovedThroughFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter description (optional)"
              rows={3}
              className={inputClassName}
            />
          </div>
        </form>
      </ApnaModal>

      {/* Facilities Modal */}
      <ApnaModal
        isOpen={showFacilitiesModal}
        onClose={closeFacilitiesModal}
        onSubmit={handleFacilitySubmit}
        title="Add New Facility"
        size="lg"
        submitText="Add Facility"
        loading={facilitySubmitLoading}
      >
        <form onSubmit={handleFacilitySubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Facility Name *</label>
            <input
              type="text"
              name="name"
              value={facilityFormData.name}
              onChange={(e) =>
                setFacilityFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter facility name (e.g., Library, Laboratory, Auditorium)"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Facility Image</label>
            <ImageUpload
              title=""
              type="image"
              preview={facilityFormData.image}
              onFileChange={(file, preview) =>
                setFacilityFormData((prev) => ({ ...prev, image: preview }))
              }
              onRemove={() =>
                setFacilityFormData((prev) => ({ ...prev, image: null }))
              }
              accept="image/*"
              maxSize="2MB"
              width="200px"
              height="200px"
              className="w-full"
              uploadType="college-facilities"
              identifier="facility-image"
              onUploadSuccess={(fileData) => {
                setFacilityFormData((prev) => ({
                  ...prev,
                  image: fileData.fileUrl,
                }));
              }}
              onUploadError={(error) => {
                console.error("Facility image upload failed:", error);
              }}
              showUploadProgress={true}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              name="description"
              value={facilityFormData.description}
              onChange={(e) =>
                setFacilityFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter facility description (optional)"
              rows={3}
              className={inputClassName}
            />
          </div>
        </form>
      </ApnaModal>

      {/* Hospital Facilities Modal */}
      <ApnaModal
        isOpen={showHospitalFacilitiesModal}
        onClose={closeHospitalFacilitiesModal}
        onSubmit={handleHospitalFacilitySubmit}
        title="Add New Hospital Facility"
        size="lg"
        submitText="Add Hospital Facility"
        loading={hospitalFacilitySubmitLoading}
      >
        <form onSubmit={handleHospitalFacilitySubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Facility Name *</label>
            <input
              type="text"
              name="name"
              value={hospitalFacilityFormData.name}
              onChange={(e) =>
                setHospitalFacilityFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter hospital facility name (e.g., Emergency Ward, ICU, Operation Theater)"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Facility Image</label>
            <ImageUpload
              title=""
              type="image"
              preview={hospitalFacilityFormData.image}
              onFileChange={(file, preview) =>
                setHospitalFacilityFormData((prev) => ({
                  ...prev,
                  image: preview,
                }))
              }
              onRemove={() =>
                setHospitalFacilityFormData((prev) => ({
                  ...prev,
                  image: null,
                }))
              }
              accept="image/*"
              maxSize="2MB"
              width="200px"
              height="200px"
              className="w-full"
              uploadType="hospital-facilities"
              identifier="hospital-facility-image"
              onUploadSuccess={(fileData) => {
                setHospitalFacilityFormData((prev) => ({
                  ...prev,
                  image: fileData.fileUrl,
                }));
              }}
              onUploadError={(error) => {
                console.error("Hospital facility image upload failed:", error);
              }}
              showUploadProgress={true}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              name="description"
              value={hospitalFacilityFormData.description}
              onChange={(e) =>
                setHospitalFacilityFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter hospital facility description (optional)"
              rows={3}
              className={inputClassName}
            />
          </div>
        </form>
      </ApnaModal>

      {/* Hostel Facilities Modal */}
      <ApnaModal
        isOpen={showHostelFacilitiesModal}
        onClose={closeHostelFacilitiesModal}
        onSubmit={handleHostelFacilitySubmit}
        title="Add New Hostel Facility"
        size="lg"
        submitText="Add Hostel Facility"
        loading={hostelFacilitySubmitLoading}
      >
        <form onSubmit={handleHostelFacilitySubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Facility Name *</label>
            <input
              type="text"
              name="name"
              value={hostelFacilityFormData.name}
              onChange={(e) =>
                setHostelFacilityFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter hostel facility name (e.g., Common Room, Mess, Laundry, Study Hall)"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Facility Image</label>
            <ImageUpload
              title=""
              type="image"
              preview={hostelFacilityFormData.image}
              onFileChange={(file, preview) =>
                setHostelFacilityFormData((prev) => ({
                  ...prev,
                  image: preview,
                }))
              }
              onRemove={() =>
                setHostelFacilityFormData((prev) => ({ ...prev, image: null }))
              }
              accept="image/*"
              maxSize="2MB"
              width="200px"
              height="200px"
              className="w-full"
              uploadType="hostel-facilities"
              identifier="hostel-facility-image"
              onUploadSuccess={(fileData) => {
                setHostelFacilityFormData((prev) => ({
                  ...prev,
                  image: fileData.fileUrl,
                }));
              }}
              onUploadError={(error) => {
                console.error("Hostel facility image upload failed:", error);
              }}
              showUploadProgress={true}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              name="description"
              value={hostelFacilityFormData.description}
              onChange={(e) =>
                setHostelFacilityFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter hostel facility description (optional)"
              rows={3}
              className={inputClassName}
            />
          </div>
        </form>
      </ApnaModal>

      {/* Quick Add State Modal */}
      <ApnaModal isOpen={showStateModal} onClose={() => setShowStateModal(false)} onSubmit={handleStateSubmit} title="Add State" size="lg" submitText="Add State" loading={stateSubmitLoading}>
        <form onSubmit={handleStateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelClassName}>Location Master Country *</label><ApnaSelect title="" options={locationMasterCountries} value={stateFormData.country} onChange={(country) => setStateFormData((prev) => ({ ...prev, country }))} placeholder="-- Select Country --" searchable buttonClassName={selectButtonClassName} /></div>
            <div><label className={labelClassName}>State Name *</label><input value={stateFormData.name} onChange={(e) => setStateFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter state name" required className={inputClassName} /></div>
            <div><label className={labelClassName}>State Code *</label><input value={stateFormData.code} maxLength={2} onChange={(e) => setStateFormData((prev) => ({ ...prev, code: e.target.value }))} placeholder="e.g., MH" required className={`${inputClassName} uppercase`} /></div>
            <div><label className={labelClassName}>Status</label><ApnaSelect title="" value={stateFormData.status} onChange={(status) => setStateFormData((prev) => ({ ...prev, status }))} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} buttonClassName={selectButtonClassName} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload title="State Logo" type="logo" preview={stateLogoPreview} onFileChange={(file, preview) => { setStateFormData((prev) => ({ ...prev, logo: file })); setStateLogoPreview(preview); }} onRemove={() => { setStateFormData((prev) => ({ ...prev, logo: null })); setStateLogoPreview(null); }} maxSize="2" uploadType="states" identifier="state-logo" onUploadSuccess={(file) => setStateFormData((prev) => ({ ...prev, logo: file.fileUrl }))} showUploadProgress onUploadError={(error) => showError(`Logo upload failed: ${error}`)} />
            <ImageUpload title="State Map" type="map" preview={stateMapPreview} onFileChange={(file, preview) => { setStateFormData((prev) => ({ ...prev, map: file })); setStateMapPreview(preview); }} onRemove={() => { setStateFormData((prev) => ({ ...prev, map: null })); setStateMapPreview(null); }} maxSize="2" uploadType="states" identifier="state-map" onUploadSuccess={(file) => setStateFormData((prev) => ({ ...prev, map: file.fileUrl }))} showUploadProgress onUploadError={(error) => showError(`Map upload failed: ${error}`)} />
          </div>
        </form>
      </ApnaModal>

      {/* Quick Add District Modal */}
      <ApnaModal isOpen={showDistrictModal} onClose={() => setShowDistrictModal(false)} onSubmit={handleDistrictSubmit} title="Add District" size="md" submitText="Add District" loading={districtSubmitLoading}>
        <form onSubmit={handleDistrictSubmit} className="space-y-4">
          <LocationSelects country={districtFormData.country} state={districtFormData.state} onCountryChange={(country) => setDistrictFormData((prev) => ({ ...prev, country, state: "" }))} onStateChange={(state) => setDistrictFormData((prev) => ({ ...prev, state }))} showDistrict={false} gridClassName="grid grid-cols-2 gap-4" countryApiUrl="/api/locations/country-master" labelClassName={labelClassName} selectButtonClassName={selectButtonClassName} />
          <div><label className={labelClassName}>District Name *</label><input value={districtFormData.name} onChange={(e) => setDistrictFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter district name" required className={inputClassName} /></div>
          <div><label className={labelClassName}>Status</label><ApnaSelect title="" value={districtFormData.status} onChange={(status) => setDistrictFormData((prev) => ({ ...prev, status }))} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} buttonClassName={selectButtonClassName} className="relative z-10" portal /></div>
        </form>
      </ApnaModal>

      {/* Ownership Modal */}
      <ApnaModal
        isOpen={showOwnershipModal}
        onClose={closeOwnershipModal}
        onSubmit={handleOwnershipSubmit}
        title="Add New Ownership Type"
        size="md"
        submitText="Add Ownership"
        loading={ownershipSubmitLoading}
      >
        <form onSubmit={handleOwnershipSubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Ownership Type *</label>
            <input
              type="text"
              name="name"
              value={ownershipFormData.name}
              onChange={(e) =>
                setOwnershipFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter ownership type (e.g., Semi-Private, Private, Government, Deemed, Trust)"
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              name="description"
              value={ownershipFormData.description}
              onChange={(e) =>
                setOwnershipFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter description (optional)"
              rows={3}
              className={inputClassName}
            />
          </div>
          <div>
            <label className={labelClassName}>Status</label>
            <ApnaSelect
              title=""
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              value={ownershipFormData.status}
              onChange={(value) =>
                setOwnershipFormData((prev) => ({
                  ...prev,
                  status: value,
                }))
              }
              placeholder="Choose status"
              searchable={true}
              buttonClassName={selectButtonClassName}
            />
          </div>
        </form>
      </ApnaModal>
    </div>
  );
}
