const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

async function copyTempImages() {
  const tempDir = path.join(__dirname, "../temp");
  const uploadsDir = path.join(__dirname, "../uploads/colleges");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const logoSrc = path.join(tempDir, "akash.jpeg");
  const coverSrc = path.join(tempDir, "akash_cover.jpg");

  const timestamp = Date.now();
  const logoName = `college_logo_akash_${timestamp}.jpeg`;
  const coverName = `college_cover_akash_${timestamp}.jpg`;

  const logoDest = path.join(uploadsDir, logoName);
  const coverDest = path.join(uploadsDir, coverName);

  let logoUrl = null;
  let bannerUrl = null;

  if (fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, logoDest);
    logoUrl = `/uploads/colleges/${logoName}`;
  } else {
    console.warn("Logo not found in temp");
  }

  if (fs.existsSync(coverSrc)) {
    fs.copyFileSync(coverSrc, coverDest);
    bannerUrl = `/uploads/colleges/${coverName}`;
  } else {
    console.warn("Cover not found in temp");
  }

  return { logoUrl, bannerUrl };
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Register models
    const Country = require("../lib/models/Country.js").default || require("../lib/models/Country.js");
    const State = require("../lib/models/State.js").default || require("../lib/models/State.js");
    const District = require("../lib/models/District.js").default || require("../lib/models/District.js");
    const Ownership = require("../lib/models/Ownership.js").default || require("../lib/models/Ownership.js");
    const Affiliation = require("../lib/models/Affiliation.js").default || require("../lib/models/Affiliation.js");
    const Language = require("../lib/models/Language.js").default || require("../lib/models/Language.js");
    const ApprovedThrough = require("../lib/models/ApprovedThrough.js").default || require("../lib/models/ApprovedThrough.js");
    const CollegeFacility = require("../lib/models/CollegeFacility.js").default || require("../lib/models/CollegeFacility.js");
    const HospitalFacility = require("../lib/models/HospitalFacility.js").default || require("../lib/models/HospitalFacility.js");
    const HostelFacility = require("../lib/models/HostelFacility.js").default || require("../lib/models/HostelFacility.js");
    const Course = require("../lib/models/Course.js").default || require("../lib/models/Course.js");
    const CourseDuration = require("../lib/models/CourseDuration.js").default || require("../lib/models/CourseDuration.js");
    const ExamType = require("../lib/models/ExamType.js").default || require("../lib/models/ExamType.js");
    const College = require("../lib/models/College.js").default || require("../lib/models/College.js");
    const CollegeCourseAllocation = require("../lib/models/CollegeCourseAllocation.js").default || require("../lib/models/CollegeCourseAllocation.js");
    const CollegeReview = require("../lib/models/CollegeReview.js").default || require("../lib/models/CollegeReview.js");
    const Degree = require("../lib/models/Degree.js").default || require("../lib/models/Degree.js");
    const Stream = require("../lib/models/Stream.js").default || require("../lib/models/Stream.js");
    const Ranking = require("../lib/models/Ranking.js").default || require("../lib/models/Ranking.js");
    const CollegeRanking = require("../lib/models/CollegeRanking.js").default || require("../lib/models/CollegeRanking.js");
    const DistanceMeter = require("../lib/models/DistanceMeter.js").default || require("../lib/models/DistanceMeter.js");
    const CollegeDistanceMeter = require("../lib/models/CollegeDistanceMeter.js").default || require("../lib/models/CollegeDistanceMeter.js");
    const FacilitySection = require("../lib/models/FacilitySection.js").default || require("../lib/models/FacilitySection.js");

    // Copy images
    const { logoUrl, bannerUrl } = await copyTempImages();
    console.log("Images copied", logoUrl, bannerUrl);

    async function getOrCreate(Model, filter, createData) {
      let record = await Model.findOne(filter);
      if (!record) {
        record = new Model(createData);
        await record.save();
      }
      return record;
    }

    // Taxonomies
    const langEng = await getOrCreate(Language, { name: "English" }, { name: "English", code: "EN", status: "active" });
    const appWho = await getOrCreate(ApprovedThrough, { name: "WHO" }, { name: "WHO", description: "World Health Organization", status: "active" });
    const appNmc = await getOrCreate(ApprovedThrough, { name: "NMC" }, { name: "NMC", description: "National Medical Commission", status: "active" });
    const ownPvt = await getOrCreate(Ownership, { name: "Private" }, { name: "Private", status: "active" });
    const affilUniv = await getOrCreate(Affiliation, { name: "Dhaka University" }, { name: "Dhaka University", status: "active" });

    const degreeBachelors = await getOrCreate(Degree, { name: "Bachelors" }, { name: "Bachelors", code: "UG", level: "Undergraduate", status: "active" });
    const streamMed = await getOrCreate(Stream, { name: "Medical" }, { name: "Medical", code: "MED", status: "active" });

    // Location
    const countryBg = await getOrCreate(Country, { name: "Bangladesh" }, { name: "Bangladesh", code: "BD", status: "active" });
    const stateDh = await getOrCreate(State, { name: "Dhaka" }, { name: "Dhaka", code: "DH", country: countryBg._id, status: "active" });
    const distDh = await getOrCreate(District, { name: "Dhaka City" }, { name: "Dhaka City", state: stateDh._id, status: "active" });

    // Facilities
    const facLib = await getOrCreate(CollegeFacility, { name: "Modern Library" }, { name: "Modern Library", status: "active" });
    const facLab = await getOrCreate(CollegeFacility, { name: "Advanced Labs" }, { name: "Advanced Labs", status: "active" });
    const facWifi = await getOrCreate(CollegeFacility, { name: "Campus WiFi" }, { name: "Campus WiFi", status: "active" });

    const hospIcu = await getOrCreate(HospitalFacility, { name: "Intensive Care Unit (ICU)" }, { name: "Intensive Care Unit (ICU)", status: "active" });
    const hospOt = await getOrCreate(HospitalFacility, { name: "Operation Theatres" }, { name: "Operation Theatres", status: "active" });

    const hostAc = await getOrCreate(HostelFacility, { name: "AC Rooms" }, { name: "AC Rooms", status: "active" });
    const hostMess = await getOrCreate(HostelFacility, { name: "Indian Mess" }, { name: "Indian Mess", status: "active" });

    // Courses & Exams
    const courseMbbs = await getOrCreate(Course, { name: "MBBS" }, { name: "MBBS", code: "MBBS", status: "active", degreeId: degreeBachelors._id, streamId: streamMed._id });
    const courseBds = await getOrCreate(Course, { name: "BDS" }, { name: "BDS", code: "BDS", status: "active", degreeId: degreeBachelors._id, streamId: streamMed._id });
    const duration5y = await getOrCreate(CourseDuration, { name: "5 Years" }, { name: "5 Years", value: 5, unit: "years", status: "active" });
    const examNeet = await getOrCreate(ExamType, { name: "NEET" }, { name: "NEET", shortName: "NEET", code: "NEET", status: "active" });

    const richCollegePayload = {
      name: "Aakash Institute of Medical Sciences",
      popularName: "Aakash Medical College",
      shortName: "AIMS",
      estdYear: "2005",
      campusSize: "150 Acres",
      haveHostel: true,
      haveHospital: true,
      hospitalBeds: 1200,
      intake: ["September", "October"],
      ownership: ownPvt._id,
      affiliation: affilUniv._id,
      country: countryBg._id,
      state: stateDh._id,
      district: distDh._id,

      addressLine1: "Medical College Road",
      location: "Dhaka",
      pinCode: "1230",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3648.423985141018!2d90.3951!3d23.8759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c42bc2e3c09b%3A0xc3457a414167e435!2sUttara%2C%20Dhaka%2C%20Bangladesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",

      phoneNumber: "+880-1234567890",
      emailAddress: "info@aakashinstitute.edu",
      websiteUrl: "https://aakashinstitute.edu",

      facebookUrl: "https://www.facebook.com/aakashinstitute",
      twitterUrl: "https://twitter.com/aakashinstitute",
      instagramUrl: "https://instagram.com/aakashinstitute",
      youtubeUrl: "https://youtube.com/aakashinstitute",
      linkedinUrl: "https://linkedin.com/school/aakashinstitute",

      logo: logoUrl || "",
      banner: bannerUrl || "",

      collegeGallery: (bannerUrl || logoUrl) ? [
        ...(bannerUrl ? [{ url: bannerUrl, type: "image" }] : []),
        ...(logoUrl ? [{ url: logoUrl, type: "image" }] : [])
      ] : [],
      hostelGallery: (bannerUrl || logoUrl) ? [
        ...(bannerUrl ? [{ url: bannerUrl, type: "image" }] : []),
        ...(logoUrl ? [{ url: logoUrl, type: "image" }] : [])
      ] : [],
      campusGallery: (bannerUrl || logoUrl) ? [
        ...(bannerUrl ? [{ url: bannerUrl, type: "image" }] : []),
        ...(logoUrl ? [{ url: logoUrl, type: "image" }] : [])
      ] : [],

      slug: "aakash-institute-of-medical-sciences",
      shortDescription: "Aakash Institute of Medical Sciences (AIMS) is a top-tier medical institute renowned for its world-class hospital and modern campus infrastructure.",
      longDescription: `<h2>Welcome to Aakash Institute of Medical Sciences</h2><p>AIMS is a globally recognized institution dedicated to creating world-class medical professionals. It features a massive 1200-bed hospital providing immense clinical exposure to its students.</p><h3>Why Choose AIMS?</h3><p>We boast a curriculum identical to the Indian NMC guidelines, making it the top choice for Indian students. Our highly qualified faculty ensure strict academic discipline and excellent results in licensing exams.</p>`,

      status: "active",
      isFeatured: true,
      isPopular: true,
      isVerified: true,
      averageRating: 4.9,
      reviewsCount: 2,
      displayOrder: 1,

      languages: [langEng._id],
      approvedThrough: [appWho._id, appNmc._id],
      facilities: [facLib._id, facLab._id, facWifi._id],
      hospitalFacilities: [hospIcu._id, hospOt._id],
      hostelFacilities: [hostAc._id, hostMess._id]
    };

    const college = await College.findOneAndUpdate(
      { slug: "aakash-institute-of-medical-sciences" },
      { $set: richCollegePayload },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("Upserted College:", college.name);

    // Seed Courses
    const allocationPayload = {
      college: college._id,
      assignedCourses: [
        {
          course: courseMbbs._id,
          courseDuration: duration5y._id,
          examType: examNeet._id,
          isActive: true,
          feeStructures: [
            {
              session: "2026-2027",
              structureType: "annual",
              seats: 150,
              periods: [
                { label: "1st Year Tuition Fee", amount: 1500000 },
                { label: "2nd Year Tuition Fee", amount: 500000 },
                { label: "3rd Year Tuition Fee", amount: 500000 },
                { label: "4th Year Tuition Fee", amount: 500000 },
                { label: "5th Year Tuition Fee", amount: 500000 }
              ]
            }
          ]
        },
        {
          course: courseBds._id,
          courseDuration: duration5y._id,
          examType: examNeet._id,
          isActive: true,
          feeStructures: [
            {
              session: "2026-2027",
              structureType: "annual",
              seats: 50,
              periods: [
                { label: "1st Year Tuition Fee", amount: 800000 },
                { label: "2nd Year Tuition Fee", amount: 300000 },
                { label: "3rd Year Tuition Fee", amount: 300000 },
                { label: "4th Year Tuition Fee", amount: 300000 }
              ]
            }
          ]
        }
      ]
    };

    await CollegeCourseAllocation.findOneAndUpdate(
      { college: college._id },
      { $set: allocationPayload },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("Upserted Course Allocation");

    // Seed Reviews
    await CollegeReview.deleteMany({ college: college._id });
    await CollegeReview.create([
      {
        college: college._id,
        name: "Dr. Ananya Sharma",
        rating: 5,
        comment: "Excellent infrastructure and very supportive faculty. The hospital exposure is incredible.",
        status: "approved"
      },
      {
        college: college._id,
        name: "Rahul Verma",
        rating: 5,
        comment: "Best medical college! The hostels are very clean and the Indian food is amazing.",
        status: "approved"
      }
    ]);
    console.log("Seeded Reviews");

    // Seed Rankings
    const rankNirf = await getOrCreate(Ranking, { name: "NIRF Medical Rankings" }, { name: "NIRF Medical Rankings", rankValue: "#1", description: "National Institutional Ranking Framework - Medical Category", status: "active" });
    const rankWho = await getOrCreate(Ranking, { name: "WHO Global Recognition" }, { name: "WHO Global Recognition", rankValue: "A+", description: "World Health Organization Global Medical Recognition", status: "active" });
    const rankBd = await getOrCreate(Ranking, { name: "Bangladesh Medical Rankings" }, { name: "Bangladesh Medical Rankings", rankValue: "#3", description: "Top Medical Colleges of Bangladesh by BMDC", status: "active" });

    await CollegeRanking.findOneAndUpdate(
      { college: college._id },
      {
        $set: {
          college: college._id,
          rankings: [
            {
              ranking: rankNirf._id,
              yearRankings: [
                { year: 2024, rank: 1, outOf: 250, notes: "Ranked #1 among all medical colleges in Bangladesh" },
                { year: 2025, rank: 1, outOf: 265, notes: "Retained top position for second consecutive year" }
              ]
            },
            {
              ranking: rankWho._id,
              yearRankings: [
                { year: 2024, rank: 5, outOf: 500, notes: "WHO recognized globally for clinical training excellence" }
              ]
            },
            {
              ranking: rankBd._id,
              yearRankings: [
                { year: 2025, rank: 3, outOf: 120, notes: "3rd best private medical college in Bangladesh" }
              ]
            }
          ]
        }
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("Seeded Rankings");

    // Seed Distance Meters
    const dmAirport = await getOrCreate(DistanceMeter, { name: "Airport" }, { name: "Airport", shortDescription: "Nearest International Airport", icon: "plane", status: "active" });
    const dmRailway = await getOrCreate(DistanceMeter, { name: "Railway Station" }, { name: "Railway Station", shortDescription: "Nearest Railway Station", icon: "train", status: "active" });
    const dmBus = await getOrCreate(DistanceMeter, { name: "Bus Stand" }, { name: "Bus Stand", shortDescription: "Nearest Major Bus Terminal", icon: "bus", status: "active" });
    const dmCity = await getOrCreate(DistanceMeter, { name: "City Center" }, { name: "City Center", shortDescription: "Distance from City Center", icon: "building", status: "active" });

    await CollegeDistanceMeter.findOneAndUpdate(
      { college: college._id },
      {
        $set: {
          college: college._id,
          distanceMeters: [
            { distanceMeter: dmAirport._id, value: 12 },
            { distanceMeter: dmRailway._id, value: 8 },
            { distanceMeter: dmBus._id, value: 3 },
            { distanceMeter: dmCity._id, value: 5 }
          ]
        }
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("Seeded Distance Meters");

    // Seed Facility Sections (Dynamic CMS tabs)
    await FacilitySection.deleteMany({ college: college._id });
    await FacilitySection.create([
      {
        college: college._id,
        tabName: "Hostel Life",
        title: "Hostel & Dining Accommodation",
        slug: "hostel-life",
        content: `<div class="space-y-4">
             <p>This is a <strong>real-time preview</strong> showing how dynamic pages render HTML sections created by the admin CMS.</p>
             <h4 class="text-sm font-black text-foreground">Hostel Facilities:</h4>
             <ul class="list-disc list-inside space-y-1 text-muted-foreground">
               <li>Fully furnished AC & non-AC rooms (Single, Double, or Triple sharing)</li>
               <li>24/7 high-speed secure Wi-Fi access</li>
               <li>Dedicated study tables and bookshelf units</li>
               <li>Common recreation lobby with TV, indoor sports, and lounge seats</li>
             </ul>
             <h4 class="text-sm font-black text-foreground mt-4">Dining & Indian Mess:</h4>
             <p>A specialized mess catering to Indian dietary preferences is operational, providing hot, hygienic vegetarian and non-vegetarian meals prepared by qualified chefs.</p>
           </div>`,
        displayOrder: 1,
        status: "active"
      },
      {
        college: college._id,
        tabName: "Clinical Practice",
        title: "Clinical & Practical Hospital Exposure",
        slug: "clinical-practice",
        content: `<div class="space-y-4">
             <p>This is a <strong>real-time preview</strong> showing hospital and clinical learning metrics.</p>
             <h4 class="text-sm font-black text-foreground">Practical Hospital Exposure:</h4>
             <ul class="list-disc list-inside space-y-1 text-muted-foreground">
               <li>Hands-on bedside rotations starting from the 3rd year</li>
               <li>Observation inside modern operation theatres and intensive care wards</li>
               <li>Guidance by senior consultants across departments (Cardiology, Virology, Orthopedics)</li>
               <li>Exposure to a large daily OPD patient flow ensuring high clinical diversity</li>
             </ul>
           </div>`,
        displayOrder: 2,
        status: "active"
      }
    ]);
    console.log("Seeded Facility Sections (Dynamic Tabs)");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seed();
