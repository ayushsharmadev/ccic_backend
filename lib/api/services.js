"use client";

import apiClient from "./axios";

function appendLocationQuery(queryParams, params = {}) {
  if (params?.country) queryParams.append("country", params.country);
  if (params?.state) queryParams.append("state", params.state);
  if (params?.district) queryParams.append("district", params.district);
}

function toLocationQueryString(params = {}) {
  const queryParams = new URLSearchParams();
  appendLocationQuery(queryParams, params);
  const queryString = queryParams.toString();
  return queryString ? `&${queryString}` : "";
}

// ================================
// PUBLIC API SERVICES (No Auth Required)
// ================================

/**
 * Public News API Service
 */
export const publicNewsAPI = {
  // Get total news count
  getTotalCount: async () => {
    try {
      const response = await apiClient.get("/api/public/news?count=true");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch news count"
      );
    }
  },

  // Get featured news
  getFeaturedNews: async (limit = 6) => {
    try {
      const response = await apiClient.get(
        `/api/public/news?featured=true&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch featured news"
      );
    }
  },

  // Get all news with pagination
  getAllNews: async (limit = 10, page = 1) => {
    try {
      const response = await apiClient.get(
        `/api/public/news?limit=${limit}&page=${page}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch news"
      );
    }
  },

  // Get single news article by slug
  getNewsBySlug: async (slug) => {
    try {
      const response = await apiClient.get(`/api/public/news/${slug}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch news article"
      );
    }
  },
};

/**
 * Public Blogs API Service
 */
export const publicBlogsAPI = {
  // Get total blogs count
  getTotalCount: async () => {
    try {
      const response = await apiClient.get("/api/public/blogs?count=true");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch blogs count"
      );
    }
  },

  // Get featured blogs
  getFeaturedBlogs: async (limit = 6) => {
    try {
      const response = await apiClient.get(
        `/api/public/blogs?featured=true&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch featured blogs"
      );
    }
  },

  // Get all blogs with pagination
  getAllBlogs: async (limit = 10, page = 1) => {
    try {
      const response = await apiClient.get(
        `/api/public/blogs?limit=${limit}&page=${page}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch blogs"
      );
    }
  },
};

/**
 * Public Courses API Service
 */
export const publicCoursesAPI = {
  // Get total courses count
  getTotalCount: async () => {
    try {
      const response = await apiClient.get("/api/public/courses?count=true");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch courses count"
      );
    }
  },

  // Get featured courses
  getFeaturedCourses: async (limit = 6) => {
    try {
      const response = await apiClient.get(
        `/api/public/courses?featured=true&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch featured courses"
      );
    }
  },

  // Get courses listing with filters (similar to colleges listing)
  getCoursesListing: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        stream = "",
        degree = "",
        feeRange = "",
        featured = "",
        sortBy = "alphabetical",
      } = params;

      const queryParams = new URLSearchParams({
        listing: "true",
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (search) queryParams.append("search", search);
      if (stream) queryParams.append("stream", stream);
      if (degree) queryParams.append("degree", degree);
      if (feeRange) queryParams.append("feeRange", feeRange);
      if (featured) queryParams.append("featured", featured);

      const response = await apiClient.get(
        `/api/public/courses?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch courses listing"
      );
    }
  },
};

/**
 * Public Exams API Service
 */
export const publicExamsAPI = {
  // Get total exams count
  getTotalCount: async (params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/exams?count=true${toLocationQueryString(params)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch exams count"
      );
    }
  },

  // Get featured exams
  getFeaturedExams: async (limit = 6, params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/exams?featured=true&limit=${limit}${toLocationQueryString(params)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch featured exams"
      );
    }
  },
};

/**
 * Public Colleges API Service
 */
export const publicCollegesAPI = {
  // Get total college count
  getTotalCount: async (params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/colleges?count=true${toLocationQueryString(params)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch college count"
      );
    }
  },

  // Get featured colleges
  getFeaturedColleges: async (limit = 6, params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/colleges?featured=true&limit=${limit}${toLocationQueryString(params)}`
      );
      // API returns: { success: true, data: { colleges: [], totalCount: ... } }
      // Return the full response as components expect response.data.colleges
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch featured colleges"
      );
    }
  },

  // Get top colleges (ranked)
  getTopColleges: async (limit = 6, params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/colleges?top=true&limit=${limit}${toLocationQueryString(params)}`
      );
      // API returns: { success: true, data: { colleges: [], totalCount: ... } }
      // Return the full response as components expect response.data.colleges
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch top colleges"
      );
    }
  },

  // Get popular colleges
  getPopularColleges: async (limit = 6, params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/colleges?popular=true&limit=${limit}${toLocationQueryString(params)}`
      );
      // API returns: { success: true, data: { colleges: [], totalCount: ... } }
      // Return the full response as components expect response.data.colleges
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch popular colleges"
      );
    }
  },

  // Get all active colleges
  getAllColleges: async (limit = 10, params = {}) => {
    try {
      const response = await apiClient.get(
        `/api/public/colleges?limit=${limit}${toLocationQueryString(params)}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch colleges"
      );
    }
  },

  // Get single college by ID
  getCollegeById: async (id) => {
    try {
      const response = await apiClient.get(`/api/public/colleges/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch college");
    }
  },
};

/**
 * Newsletter Subscriptions API Service
 */
export const newsletterSubscriptionsAPI = {
  subscribe: async ({ email, source = "footer", meta } = {}) => {
    try {
      const response = await apiClient.post("/api/newsletter-subscriptions", {
        email,
        source,
        meta,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to subscribe to newsletter"
      );
    }
  },

  getSubscriptions: async ({ page = 1, limit = 10, search = "" } = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      const response = await apiClient.get(
        `/api/newsletter-subscriptions?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to load subscriptions"
      );
    }
  },

  getSubscription: async (id) => {
    try {
      const response = await apiClient.get(`/api/newsletter-subscriptions/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to load subscription"
      );
    }
  },

  deleteSubscription: async (id) => {
    try {
      const response = await apiClient.delete(
        `/api/newsletter-subscriptions/${id}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to delete subscription"
      );
    }
  },
};

// ================================
// AUTHENTICATED API SERVICES
// ================================

/**
 * Colleges API Service (Admin)
 */
export const collegesAPI = {
  // Get all colleges with pagination and filters
  getAllColleges: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/colleges", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch colleges"
      );
    }
  },

  // Get single college
  getCollege: async (id) => {
    try {
      const response = await apiClient.get(`/api/colleges/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch college");
    }
  },

  // Create new college
  createCollege: async (data) => {
    try {
      const response = await apiClient.post("/api/colleges", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to create college"
      );
    }
  },

  // Update college
  updateCollege: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/colleges/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to update college"
      );
    }
  },

  // Delete college
  deleteCollege: async (id) => {
    try {
      const response = await apiClient.delete(`/api/colleges/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to delete college"
      );
    }
  },

  // Update college brochure
  updateBrochure: async (id, brochure) => {
    try {
      const response = await apiClient.put(`/api/colleges/${id}/brochure`, {
        brochure,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to update brochure"
      );
    }
  },

  // Update college gallery
  updateGallery: async (id, galleryType, images) => {
    try {
      const response = await apiClient.put(`/api/colleges/${id}/gallery`, {
        galleryType,
        images,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to update gallery"
      );
    }
  },

  // Get college gallery
  getGallery: async (id) => {
    try {
      const response = await apiClient.get(`/api/colleges/${id}/gallery`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch gallery");
    }
  },
};

/**
 * Master Data API Service
 */
export const masterDataAPI = {
  // Countries
  getCountries: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.all) queryParams.append("all", "true");
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);

      const response = await apiClient.get(
        `/api/locations/countries?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch countries"
      );
    }
  },

  // States
  getStates: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.all) queryParams.append("all", "true");
      if (params.country) queryParams.append("country", params.country);
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);

      const response = await apiClient.get(
        `/api/locations/states?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch states");
    }
  },

  // Districts
  getDistricts: async (stateId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (stateId) queryParams.append("state", stateId);
      if (params.country) queryParams.append("country", params.country);
      if (params.all) queryParams.append("all", "true");
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);

      const response = await apiClient.get(
        `/api/locations/districts?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch districts"
      );
    }
  },

  // Streams
  getStreams: async () => {
    try {
      const response = await apiClient.get("/api/streams");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch streams");
    }
  },

  // Courses
  getCourses: async () => {
    try {
      const response = await apiClient.get("/api/courses");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch courses");
    }
  },

  // Degrees
  getDegrees: async () => {
    try {
      const response = await apiClient.get("/api/master/degree");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch degrees");
    }
  },

  // Ownership Types
  getOwnershipTypes: async () => {
    try {
      const response = await apiClient.get("/api/master/ownership");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch ownership types"
      );
    }
  },

  // Affiliations
  getAffiliations: async () => {
    try {
      const response = await apiClient.get("/api/master/affiliation");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch affiliations"
      );
    }
  },

  // Rankings
  getRankings: async () => {
    try {
      const response = await apiClient.get("/api/master/ranking");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch rankings"
      );
    }
  },

  // Approved Through
  getApprovedThrough: async () => {
    try {
      const response = await apiClient.get("/api/master/approved-through");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch approved through"
      );
    }
  },

  // Exam Types
  getExamTypes: async () => {
    try {
      const response = await apiClient.get("/api/master/exam-type");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch exam types"
      );
    }
  },

  // Course Durations
  getCourseDurations: async () => {
    try {
      const response = await apiClient.get("/api/master/course-duration");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch course durations"
      );
    }
  },

  // College Facilities
  getCollegeFacilities: async () => {
    try {
      const response = await apiClient.get("/api/master/college-facility");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch college facilities"
      );
    }
  },

  // Hospital Facilities
  getHospitalFacilities: async () => {
    try {
      const response = await apiClient.get("/api/master/hospital-facility");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch hospital facilities"
      );
    }
  },

  // Hostel Facilities
  getHostelFacilities: async () => {
    try {
      const response = await apiClient.get("/api/master/hostel-facility");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch hostel facilities"
      );
    }
  },
};

/**
 * File Upload API Service
 */
export const uploadAPI = {
  // Upload single file
  uploadFile: async (
    file,
    type,
    identifier,
    allowedTypes,
    maxSize,
    overwrite = false
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("identifier", identifier);
      formData.append("allowedTypes", allowedTypes);
      formData.append("maxSize", maxSize.toString());
      formData.append("overwrite", overwrite.toString());

      const response = await apiClient.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to upload file");
    }
  },
};

/**
 * Dashboard API Service
 */
export const dashboardAPI = {
  // Get dashboard stats
  getStats: async () => {
    try {
      const response = await apiClient.get("/api/stats");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch stats");
    }
  },
};

/**
 * News Categories API Service
 */
export const newsCategoriesAPI = {
  // Get all news categories
  getAllCategories: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/news-categories", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch news categories"
      );
    }
  },

  // Get single news category
  getCategory: async (id) => {
    try {
      const response = await apiClient.get(`/api/news-categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch news category"
      );
    }
  },

  // Create new news category
  createCategory: async (data) => {
    try {
      const response = await apiClient.post("/api/news-categories", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to create news category"
      );
    }
  },

  // Update news category
  updateCategory: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/news-categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to update news category"
      );
    }
  },

  // Delete news category
  deleteCategory: async (id) => {
    try {
      const response = await apiClient.delete(`/api/news-categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to delete news category"
      );
    }
  },
};

/**
 * News API Service
 */
export const newsAPI = {
  // Get all news with pagination and filters
  getAllNews: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/news", { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch news");
    }
  },

  // Get single news article
  getNews: async (id) => {
    try {
      const response = await apiClient.get(`/api/news/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch news");
    }
  },

  // Create new news article
  createNews: async (data) => {
    try {
      const response = await apiClient.post("/api/news", data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to create news");
    }
  },

  // Update news article
  updateNews: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/news/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to update news");
    }
  },

  // Delete news article
  deleteNews: async (id) => {
    try {
      const response = await apiClient.delete(`/api/news/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to delete news");
    }
  },
};

/**
 * Users API Service
 */
export const usersAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/users", { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to fetch users");
    }
  },

  // Create user
  createUser: async (data) => {
    try {
      const response = await apiClient.post("/api/users", data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to create user");
    }
  },

  // Update user
  updateUser: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to update user");
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to delete user");
    }
  },
};

/**
 * Testimonials API Service
 */
export const testimonialsAPI = {
  // Get all testimonials
  getAllTestimonials: async (params = {}) => {
    try {
      const response = await apiClient.get("/api/testimonials", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch testimonials"
      );
    }
  },

  // Get single testimonial
  getTestimonial: async (id) => {
    try {
      const response = await apiClient.get(`/api/testimonials/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to fetch testimonial"
      );
    }
  },

  // Create testimonial
  createTestimonial: async (data) => {
    try {
      const response = await apiClient.post("/api/testimonials", data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to create testimonial"
      );
    }
  },

  // Update testimonial
  updateTestimonial: async (id, data) => {
    try {
      const response = await apiClient.put(`/api/testimonials/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to update testimonial"
      );
    }
  },

  // Delete testimonial
  deleteTestimonial: async (id) => {
    try {
      const response = await apiClient.delete(`/api/testimonials/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to delete testimonial"
      );
    }
  },
};

/**
 * Public Testimonials API Service
 */
export const publicTestimonialsAPI = {
  // Get total testimonials count
  getTotalCount: async () => {
    try {
      const response = await fetch("/api/public/testimonials?count=true");
      return response.json();
    } catch {
      throw new Error("Failed to fetch testimonials count");
    }
  },

  // Get featured testimonials
  getFeaturedTestimonials: async (limit = 6) => {
    try {
      const response = await fetch(
        `/api/public/testimonials?featured=true&limit=${limit}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch featured testimonials");
    }
  },

  // Get all published testimonials
  getAllTestimonials: async (limit = 10) => {
    try {
      const response = await fetch(`/api/public/testimonials?limit=${limit}`);
      return response.json();
    } catch {
      throw new Error("Failed to fetch testimonials");
    }
  },
};

/**
 * Public Countries API Service
 */
export const publicCountriesAPI = {
  getCountries: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);

      const response = await fetch(
        `/api/public/countries?${queryParams.toString()}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch countries");
    }
  },
};

/**
 * Public Districts API Service
 */
export const publicDistrictsAPI = {
  getDistricts: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.country) queryParams.append("country", params.country);
      if (params.state) queryParams.append("state", params.state);

      const response = await fetch(
        `/api/public/districts?${queryParams.toString()}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch districts");
    }
  },
};

/**
 * Public States API Service
 */
export const publicStatesAPI = {
  // Get all states
  getStates: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.status) queryParams.append("status", params.status);
      if (params.country) queryParams.append("country", params.country);

      const response = await fetch(
        `/api/public/states?${queryParams.toString()}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch states");
    }
  },
};

export const publicSearchAPI = {
  // Perform global search
  search: async (query, type = "all", limit = 20, params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        q: query,
        type,
        limit: String(limit),
      });
      appendLocationQuery(queryParams, params);

      const response = await fetch(`/api/public/search?${queryParams.toString()}`);
      return response.json();
    } catch {
      throw new Error("Failed to perform search");
    }
  },

  // Get popular colleges for search modal
  getPopularColleges: async (limit = 6, params = {}) => {
    try {
      const queryParams = new URLSearchParams({ limit: String(limit) });
      appendLocationQuery(queryParams, params);

      const response = await fetch(
        `/api/public/popular-colleges?${queryParams.toString()}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch popular colleges");
    }
  },
};

/**
 * Public College Details API Service
 */
export const publicCollegeDetailsAPI = {
  // Get college details by slug
  getCollegeDetails: async (slug) => {
    try {
      const response = await fetch(`/api/public/college-details/${slug}`);
      return response.json();
    } catch {
      throw new Error("Failed to fetch college details");
    }
  },
};

/**
 * Public Course Details API Service
 */
export const publicCourseDetailsAPI = {
  // Get course details by slug
  getCourseDetails: async (slug) => {
    try {
      const response = await fetch(`/api/public/course-details/${slug}`);
      return response.json();
    } catch {
      throw new Error("Failed to fetch course details");
    }
  },
};

/**
 * Public Courses Listing API Service
 */
export const publicCoursesListingAPI = {
  // Get courses listing with filters
  getCoursesListing: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);

      // Add search
      if (params.search) queryParams.append("search", params.search);

      // Add filters
      if (params.stream) queryParams.append("stream", params.stream);
      if (params.degree) queryParams.append("degree", params.degree);
      if (params.feeRange) queryParams.append("feeRange", params.feeRange);
      if (params.featured) queryParams.append("featured", params.featured);

      // Add sorting
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);

      queryParams.append("listing", "true");

      const response = await fetch(
        `/api/public/courses?${queryParams}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch courses listing");
    }
  },

  // Get filter options
  getFilterOptions: async (search = "", type = "all") => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (type !== "all") queryParams.append("type", type);

      const response = await fetch(
        `/api/public/courses-filters?${queryParams}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch filter options");
    }
  },
};

/**
 * Public Colleges Listing API Service
 */
export const publicCollegesListingAPI = {
  // Get colleges listing with filters
  getCollegesListing: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);

      // Add search
      if (params.search) queryParams.append("search", params.search);

      // Add filters
      if (params.country) queryParams.append("country", params.country);
      if (params.state) queryParams.append("state", params.state);
      if (params.district) queryParams.append("district", params.district);
      if (params.city) queryParams.append("city", params.city);
      if (params.ownership) queryParams.append("ownership", params.ownership);
      if (params.exam) queryParams.append("exam", params.exam);
      if (params.course) queryParams.append("course", params.course);
      if (params.feeRange) queryParams.append("feeRange", params.feeRange);

      // Add sorting
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);

      const response = await fetch(
        `/api/public/colleges-listing?${queryParams}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch colleges listing");
    }
  },

  // Get filter options
  getFilterOptions: async (search = "", type = "all", params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (type !== "all") queryParams.append("type", type);
      if (params.country) queryParams.append("country", params.country);
      if (params.state) queryParams.append("state", params.state);

      const response = await fetch(
        `/api/public/colleges-filters?${queryParams}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch filter options");
    }
  },

  // Get college statistics
  getCollegeStats: async (type = "all", params = {}) => {
    try {
      const queryParams = new URLSearchParams({ type });
      appendLocationQuery(queryParams, params);

      const response = await fetch(
        `/api/public/colleges-stats?${queryParams.toString()}`
      );
      return response.json();
    } catch {
      throw new Error("Failed to fetch college statistics");
    }
  },
};

// ================================
// EXPORT ALL API SERVICES
// ================================
export const apiServices = {
  publicColleges: publicCollegesAPI,
  publicCollegeDetails: publicCollegeDetailsAPI,
  publicCourseDetails: publicCourseDetailsAPI,
  publicNews: publicNewsAPI,
  publicBlogs: publicBlogsAPI,
  publicCourses: publicCoursesAPI,
  publicExams: publicExamsAPI,
  publicTestimonials: publicTestimonialsAPI,
  publicCountries: publicCountriesAPI,
  publicDistricts: publicDistrictsAPI,
  publicStates: publicStatesAPI,
  publicSearch: publicSearchAPI,
  publicCollegesListing: publicCollegesListingAPI,
  publicCoursesListing: publicCoursesListingAPI,
  colleges: collegesAPI,
  masterData: masterDataAPI,
  upload: uploadAPI,
  dashboard: dashboardAPI,
  newsCategories: newsCategoriesAPI,
  news: newsAPI,
  testimonials: testimonialsAPI,
  users: usersAPI,
  newsletterSubscriptions: newsletterSubscriptionsAPI,
};

export default apiServices;
