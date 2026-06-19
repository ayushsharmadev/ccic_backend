"use client";

import { createContext, useContext } from "react";
import apiServices from "@/lib/api/services";

// Create API Context
const APIContext = createContext();

// API Provider Component
export const APIProvider = ({ children }) => {
  const value = {
    // Public APIs (No auth required)
    publicColleges: apiServices.publicColleges,
    publicCollegeDetails: apiServices.publicCollegeDetails,
    publicCourseDetails: apiServices.publicCourseDetails,
    publicCollegesListing: apiServices.publicCollegesListing,
    publicNews: apiServices.publicNews,
    publicBlogs: apiServices.publicBlogs,
    publicCourses: apiServices.publicCourses,
    publicExams: apiServices.publicExams,
    publicTestimonials: apiServices.publicTestimonials,
    publicStates: apiServices.publicStates,
    publicSearch: apiServices.publicSearch,
    publicCoursesListing: apiServices.publicCoursesListing,

    // Authenticated APIs
    colleges: apiServices.colleges,
    masterData: apiServices.masterData,
    upload: apiServices.upload,
    dashboard: apiServices.dashboard,
    newsCategories: apiServices.newsCategories,
    news: apiServices.news,
    testimonials: apiServices.testimonials,
    users: apiServices.users,
    newsletter: apiServices.newsletterSubscriptions,

    // All services for advanced usage
    services: apiServices,
  };

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
};

// Custom hook to use API context
export const useAPI = () => {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error("useAPI must be used within an APIProvider");
  }
  return context;
};

// Export individual API hooks for convenience
export const usePublicCollegesAPI = () => {
  const { publicColleges } = useAPI();
  return publicColleges;
};

export const usePublicCollegeDetailsAPI = () => {
  const { publicCollegeDetails } = useAPI();
  return publicCollegeDetails;
};

export const usePublicCourseDetailsAPI = () => {
  const { publicCourseDetails } = useAPI();
  return publicCourseDetails;
};

export const usePublicCollegesListingAPI = () => {
  const { publicCollegesListing } = useAPI();
  return publicCollegesListing;
};

export const usePublicCoursesListingAPI = () => {
  const { publicCoursesListing } = useAPI();
  return publicCoursesListing;
};

export const usePublicNewsAPI = () => {
  const { publicNews } = useAPI();
  return publicNews;
};

export const usePublicBlogsAPI = () => {
  const { publicBlogs } = useAPI();
  return publicBlogs;
};

export const usePublicCoursesAPI = () => {
  const { publicCourses } = useAPI();
  return publicCourses;
};

export const usePublicExamsAPI = () => {
  const { publicExams } = useAPI();
  return publicExams;
};

export const usePublicTestimonialsAPI = () => {
  const { publicTestimonials } = useAPI();
  return publicTestimonials;
};

export const usePublicStatesAPI = () => {
  const { publicStates } = useAPI();
  return publicStates;
};

export const usePublicSearchAPI = () => {
  const { publicSearch } = useAPI();
  return publicSearch;
};

export const useCollegesAPI = () => {
  const { colleges } = useAPI();
  return colleges;
};

export const useMasterDataAPI = () => {
  const { masterData } = useAPI();
  return masterData;
};

export const useUploadAPI = () => {
  const { upload } = useAPI();
  return upload;
};

export const useDashboardAPI = () => {
  const { dashboard } = useAPI();
  return dashboard;
};

export const useNewsCategoriesAPI = () => {
  const { newsCategories } = useAPI();
  return newsCategories;
};

export const useNewsAPI = () => {
  const { news } = useAPI();
  return news;
};

export const useTestimonialsAPI = () => {
  const { testimonials } = useAPI();
  return testimonials;
};

export const useUsersAPI = () => {
  const { users } = useAPI();
  return users;
};

export const useNewsletterAPI = () => {
  const { newsletter } = useAPI();
  return newsletter;
};

export default APIContext;
