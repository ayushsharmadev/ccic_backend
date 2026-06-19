import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Create simple styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "#1e3a8a",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 10,
  },
});

const CollegeBrochurePDFSimple = ({ college }) => {
  return (
    <Document
      title={`${college.name} - Brochure`}
      author="CCIC"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{college.name}</Text>

        {college.popularName && (
          <View style={styles.section}>
            <Text style={styles.label}>Popular Name:</Text>
            <Text style={styles.text}>{college.popularName}</Text>
          </View>
        )}

        {college.estdYear && (
          <View style={styles.section}>
            <Text style={styles.label}>Established:</Text>
            <Text style={styles.text}>{college.estdYear}</Text>
          </View>
        )}

        {college.state?.name && (
          <View style={styles.section}>
            <Text style={styles.label}>State:</Text>
            <Text style={styles.text}>{college.state.name}</Text>
          </View>
        )}

        {college.district?.name && (
          <View style={styles.section}>
            <Text style={styles.label}>District:</Text>
            <Text style={styles.text}>{college.district.name}</Text>
          </View>
        )}

        {college.ownership?.name && (
          <View style={styles.section}>
            <Text style={styles.label}>Ownership:</Text>
            <Text style={styles.text}>{college.ownership.name}</Text>
          </View>
        )}

        {college.affiliation?.name && (
          <View style={styles.section}>
            <Text style={styles.label}>Affiliation:</Text>
            <Text style={styles.text}>{college.affiliation.name}</Text>
          </View>
        )}

        {college.shortDescription && (
          <View style={styles.section}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.text}>
              {college.shortDescription
                .replace(/<[^>]*>/g, "")
                .substring(0, 500)}
            </Text>
          </View>
        )}

        {college.phoneNumber && (
          <View style={styles.section}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.text}>{college.phoneNumber}</Text>
          </View>
        )}

        {college.emailAddress && (
          <View style={styles.section}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.text}>{college.emailAddress}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.text}>Visit: www.ccic.com</Text>
        </View>
      </Page>
    </Document>
  );
};

export default CollegeBrochurePDFSimple;
