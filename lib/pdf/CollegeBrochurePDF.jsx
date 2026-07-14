import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles with react-pdf compatible properties
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // Cover Page Styles
  coverPage: {
    backgroundColor: "#1e3a8a",
    padding: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%", // Fill A4 height dynamically
  },
  siteLogo: {
    width: 80,
    height: 80,
    marginTop: 20,
    marginBottom: 30,
  },
  collegeLogoContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  collegeLogo: {
    width: 120,
    height: 120,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 30,
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#bfdbfe",
    textAlign: "center",
    marginBottom: 40,
  },
  coverDivider: {
    width: "80%",
    height: 2,
    backgroundColor: "#ffffff",
    opacity: 0.3,
    marginVertical: 20,
  },
  coverTagline: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  highlightsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
  },
  highlightBox: {
    alignItems: "center",
    width: "30%",
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fbbf24",
    marginBottom: 5,
  },
  highlightLabel: {
    fontSize: 10,
    color: "#bfdbfe",
    textAlign: "center",
  },
  coverLocation: {
    fontSize: 13,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
  },
  coverFooter: {
    fontSize: 11,
    color: "#bfdbfe",
    textAlign: "center",
    marginTop: "auto",
  },

  // Content Page Styles
  contentPage: {
    padding: 35,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 3,
    borderBottomStyle: "solid",
    borderBottomColor: "#1e3a8a",
  },
  sectionHeaderAlt: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    paddingBottom: 8,
  },

  // Info Boxes
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    width: "48%",
    marginBottom: 12,
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#1e3a8a",
    borderLeftStyle: "solid",
  },
  infoLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "bold",
  },

  // Description
  descriptionBox: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.5,
    textAlign: "justify",
  },

  // Contact Box
  contactBox: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 8,
    marginTop: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  contactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  contactItem: {
    width: "48%",
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 8,
    color: "#bfdbfe",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  contactValue: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
  },

  // Courses
  coursesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  courseBox: {
    width: "48%",
    marginBottom: 10,
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#1e3a8a",
    borderLeftStyle: "solid",
  },
  courseTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  courseDetail: {
    fontSize: 9,
    color: "#6b7280",
  },

  // Facilities
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  facilityBox: {
    width: "31%",
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  facilityText: {
    fontSize: 8,
    color: "#111827",
    fontWeight: "bold",
    textAlign: "center",
  },

  // Why Choose
  whyChooseBox: {
    backgroundColor: "#eff6ff",
    padding: 18,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  whyChooseTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 12,
  },
  whyChooseList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  whyChooseItem: {
    width: "48%",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkIcon: {
    fontSize: 12,
    color: "#1e3a8a",
    fontWeight: "bold",
    marginRight: 6,
  },
  whyChooseText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
  },

  // CTA Box
  ctaBox: {
    backgroundColor: "#1e3a8a",
    padding: 15,
    borderRadius: 8,
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  ctaSubtitle: {
    fontSize: 10,
    color: "#bfdbfe",
  },

  // Page Footer
  pageFooter: {
    marginTop: "auto",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    textAlign: "center",
  },
  footerWebsite: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 3,
  },
  footerPage: {
    fontSize: 8,
    color: "#9ca3af",
  },
  footerContact: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 3,
  },
});

const CollegeBrochurePDF = ({ college }) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://ccic.com";

  // Helper to get full URL
  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  return (
    <Document
      title={`${college.name} - Admission Brochure 2025`}
      author="CCIC"
      subject={`Admission Brochure for ${college.name}`}
      keywords="CCIC, Education, Courses, Streams, Colleges, Admission"
    >
      {/* PAGE 1: COVER PAGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          {/* Site Logo - Commented out to prevent loading issues */}
          {/* <Image
            src={getFullUrl('/logo.png')}
            style={styles.siteLogo}
          /> */}

          {/* College Logo - Temporarily disabled to prevent hanging */}
          {/* {college.logo && (
            <View style={styles.collegeLogoContainer}>
              <Image
                src={getFullUrl(college.logo)}
                style={styles.collegeLogo}
              />
            </View>
          )} */}

          {/* College Name */}
          <Text style={styles.coverTitle}>{college.name}</Text>

          {/* Popular Name */}
          {college.popularName && (
            <Text style={styles.coverSubtitle}>({college.popularName})</Text>
          )}

          {/* Divider */}
          <View style={styles.coverDivider} />

          {/* Tagline */}
          <Text style={styles.coverTagline}>
            CCIC - Your Gateway to Medical Excellence
          </Text>

          {/* Key Highlights */}
          <View style={styles.highlightsContainer}>
            {college.estdYear && (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightValue}>{college.estdYear}</Text>
                <Text style={styles.highlightLabel}>Established</Text>
              </View>
            )}

            {college.campusSize && (
              <View style={styles.highlightBox}>
                <Text style={styles.highlightValue}>{college.campusSize}</Text>
                <Text style={styles.highlightLabel}>Campus Size</Text>
              </View>
            )}

            {college.affiliation?.name && (
              <View style={styles.highlightBox}>
                <Text style={[styles.highlightValue, { fontSize: 12 }]}>
                  {college.affiliation.name.substring(0, 20)}
                </Text>
                <Text style={styles.highlightLabel}>Affiliated To</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.coverDivider} />

          {/* Location */}
          <Text style={styles.coverLocation}>
            {[college.location, college.district?.name, college.state?.name]
              .filter(Boolean)
              .join(", ")}
          </Text>

          {/* Footer */}
          <Text style={styles.coverFooter}>www.ccic.com</Text>
        </View>
      </Page>

      {/* PAGE 2: ABOUT COLLEGE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {/* Header */}
          <Text style={styles.sectionHeader}>About the College</Text>

          {/* College Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>College Name</Text>
              <Text style={styles.infoValue}>{college.name}</Text>
            </View>

            {college.popularName && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Popular Name</Text>
                <Text style={styles.infoValue}>{college.popularName}</Text>
              </View>
            )}

            {college.estdYear && (
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: "#f0fdf4", borderLeftColor: "#10b981" },
                ]}
              >
                <Text style={styles.infoLabel}>Established Year</Text>
                <Text style={styles.infoValue}>{college.estdYear}</Text>
              </View>
            )}

            {college.ownership?.name && (
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: "#f0fdf4", borderLeftColor: "#10b981" },
                ]}
              >
                <Text style={styles.infoLabel}>Ownership Type</Text>
                <Text style={styles.infoValue}>{college.ownership.name}</Text>
              </View>
            )}

            {college.affiliation?.name && (
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: "#faf5ff", borderLeftColor: "#a855f7" },
                ]}
              >
                <Text style={styles.infoLabel}>Affiliation</Text>
                <Text style={styles.infoValue}>{college.affiliation.name}</Text>
              </View>
            )}

            {college.approvedThrough &&
              (Array.isArray(college.approvedThrough)
                ? college.approvedThrough.length > 0
                : college.approvedThrough.name) && (
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: "#faf5ff", borderLeftColor: "#a855f7" },
                  ]}
                >
                  <Text style={styles.infoLabel}>Approved Through</Text>
                  <Text style={styles.infoValue}>
                    {Array.isArray(college.approvedThrough)
                      ? college.approvedThrough
                          .map((item) => item.name || item)
                          .join(", ")
                      : college.approvedThrough.name}
                  </Text>
                </View>
              )}

            {college.campusSize && (
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: "#fef3c7", borderLeftColor: "#f59e0b" },
                ]}
              >
                <Text style={styles.infoLabel}>Campus Size</Text>
                <Text style={styles.infoValue}>{college.campusSize}</Text>
              </View>
            )}

            {college.courseType && (
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: "#fef3c7", borderLeftColor: "#f59e0b" },
                ]}
              >
                <Text style={styles.infoLabel}>Course Type</Text>
                <Text style={styles.infoValue}>
                  {college.courseType.replace("-", " ").toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {college.shortDescription && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>Overview</Text>
              <Text style={styles.descriptionText}>
                {college.shortDescription
                  .replace(/<[^>]*>/g, "")
                  .substring(0, 800)}
              </Text>
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Contact Information</Text>
            <View style={styles.contactGrid}>
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>
                  {[
                    college.addressLine1,
                    college.addressLine2,
                    college.location,
                    college.district?.name,
                    college.state?.name,
                    college.pinCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Phone Numbers</Text>
                <Text style={styles.contactValue}>+91-09525664566, +91-9334154407</Text>
              </View>

              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Email Address</Text>
                <Text style={styles.contactValue}>
                  ccic.patna@gmail.com
                </Text>
              </View>

              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>www.ccic.com</Text>
              </View>
            </View>
          </View>

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerWebsite}>
              www.ccic.com
            </Text>
            <Text style={styles.footerPage}>Page 1 of 3</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 3: COURSES & FACILITIES */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {/* Courses Section */}
          {college.courses && college.courses.length > 0 && (
            <View style={{ marginBottom: 25 }}>
              <Text style={styles.sectionHeader}>Courses Offered</Text>
              <View style={styles.coursesGrid}>
                {college.courses.slice(0, 8).map((course, index) => (
                  <View key={index} style={styles.courseBox}>
                    <Text style={styles.courseTitle}>
                      {course.name || course}
                    </Text>
                    {course.duration && (
                      <Text style={styles.courseDetail}>
                        Duration: {course.duration}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* College Facilities */}
          {college.facilities && college.facilities.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={[
                  styles.sectionHeaderAlt,
                  { color: "#7c3aed", borderBottomColor: "#7c3aed" },
                ]}
              >
                College Facilities
              </Text>
              <View style={styles.facilitiesGrid}>
                {college.facilities.slice(0, 12).map((facility, index) => (
                  <View
                    key={index}
                    style={[styles.facilityBox, { backgroundColor: "#f5f3ff" }]}
                  >
                    <Text style={styles.facilityText}>
                      {facility.name || facility}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Hospital Facilities */}
          {college.hospitalFacilities &&
            college.hospitalFacilities.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={[
                    styles.sectionHeaderAlt,
                    { color: "#059669", borderBottomColor: "#059669" },
                  ]}
                >
                  Hospital Facilities
                </Text>
                <View style={styles.facilitiesGrid}>
                  {college.hospitalFacilities
                    .slice(0, 12)
                    .map((facility, index) => (
                      <View
                        key={index}
                        style={[
                          styles.facilityBox,
                          { backgroundColor: "#ecfdf5" },
                        ]}
                      >
                        <Text style={styles.facilityText}>
                          {facility.name || facility}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}

          {/* Hostel Facilities */}
          {college.hostelFacilities && college.hostelFacilities.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={[
                  styles.sectionHeaderAlt,
                  { color: "#ea580c", borderBottomColor: "#ea580c" },
                ]}
              >
                Hostel Facilities
              </Text>
              <View style={styles.facilitiesGrid}>
                {college.hostelFacilities
                  .slice(0, 12)
                  .map((facility, index) => (
                    <View
                      key={index}
                      style={[
                        styles.facilityBox,
                        { backgroundColor: "#fff7ed" },
                      ]}
                    >
                      <Text style={styles.facilityText}>
                        {facility.name || facility}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Page Footer */}
          <View style={styles.pageFooter}>
            <Text style={styles.footerWebsite}>
              www.ccic.com
            </Text>
            <Text style={styles.footerPage}>Page 2 of 3</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 4: WHY CHOOSE & CTA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          <Text style={styles.sectionHeader}>Why Choose {college.name}?</Text>

          {/* Why Choose Points */}
          <View style={styles.whyChooseBox}>
            <View style={styles.whyChooseList}>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Highly Qualified & Experienced Faculty
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Modern Infrastructure & Well-Equipped Laboratories
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  100% Placement Assistance & Career Support
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Industry Exposure Through Internships
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Research & Innovation Opportunities
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  State-of-the-Art Hospital Facilities
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Comfortable & Safe Hostel Accommodation
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Sports & Recreational Activities
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Regular Guest Lectures & Industry Workshops
                </Text>
              </View>
              <View style={styles.whyChooseItem}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.whyChooseText}>
                  Comprehensive Career Guidance & Counseling
                </Text>
              </View>
            </View>
          </View>

          {/* Long Description (if available) */}
          {college.longDescription && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>Admission Details</Text>
              <Text style={styles.descriptionText}>
                {college.longDescription
                  .replace(/<[^>]*>/g, "")
                  .substring(0, 1000)}
              </Text>
            </View>
          )}

          {/* Call to Action */}
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitle}>
              🎓 Start Your MBBS Journey Today!
            </Text>
            <Text style={styles.ctaSubtitle}>
              Visit www.ccic.com for online application and
              complete admission details
            </Text>
          </View>

          {/* Contact Footer */}
          <View
            style={[styles.pageFooter, { borderTopWidth: 0, marginTop: 20 }]}
          >
            <Text style={styles.footerWebsite}>www.ccic.com</Text>
            <Text style={styles.footerContact}>
              +91-09525664566 | +91-9334154407 | ccic.patna@gmail.com | Patna, Bihar
            </Text>
            <Text style={[styles.footerPage, { marginTop: 8 }]}>
              Page 3 of 3
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default CollegeBrochurePDF;
