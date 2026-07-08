const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mbbs";

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB at:", MONGODB_URI);

    // 1. Dynamically import and register all models
    console.log("📦 Registering Mongoose models...");
    const CountryMaster = require("../models/CountryMaster.js").default || require("../models/CountryMaster.js");
    const Country = require("../models/Country.js").default || require("../models/Country.js");
    const State = require("../models/State.js").default || require("../models/State.js");
    const District = require("../models/District.js").default || require("../models/District.js");
    const Ownership = require("../models/Ownership.js").default || require("../models/Ownership.js");
    const Affiliation = require("../models/Affiliation.js").default || require("../models/Affiliation.js");
    const Language = require("../models/Language.js").default || require("../models/Language.js");
    const ApprovedThrough = require("../models/ApprovedThrough.js").default || require("../models/ApprovedThrough.js");
    const CollegeFacility = require("../models/CollegeFacility.js").default || require("../models/CollegeFacility.js");
    const HospitalFacility = require("../models/HospitalFacility.js").default || require("../models/HospitalFacility.js");
    const HostelFacility = require("../models/HostelFacility.js").default || require("../models/HostelFacility.js");
    const Stream = require("../models/Stream.js").default || require("../models/Stream.js");
    const Degree = require("../models/Degree.js").default || require("../models/Degree.js");
    const Course = require("../models/Course.js").default || require("../models/Course.js");
    const CourseDuration = require("../models/CourseDuration.js").default || require("../models/CourseDuration.js");
    const ExamType = require("../models/ExamType.js").default || require("../models/ExamType.js");
    const ExamLevel = require("../models/ExamLevel.js").default || require("../models/ExamLevel.js");
    const Ranking = require("../models/Ranking.js").default || require("../models/Ranking.js");
    const DistanceMeter = require("../models/DistanceMeter.js").default || require("../models/DistanceMeter.js");
    const College = require("../models/College.js").default || require("../models/College.js");
    const CollegeCourseAllocation = require("../models/CollegeCourseAllocation.js").default || require("../models/CollegeCourseAllocation.js");
    const CollegeRanking = require("../models/CollegeRanking.js").default || require("../models/CollegeRanking.js");
    const CollegeDistanceMeter = require("../models/CollegeDistanceMeter.js").default || require("../models/CollegeDistanceMeter.js");
    const CollegeReview = require("../models/CollegeReview.js").default || require("../models/CollegeReview.js");
    const Exam = require("../models/Exam.js").default || require("../models/Exam.js");
    const CountrySection = require("../models/CountrySection.js").default || require("../models/CountrySection.js");
    
    console.log("✅ All models registered successfully.");

    // 2. Clean existing collections to prevent duplicates
    console.log("🧹 Cleaning existing collections...");
    const modelsToClean = [
      CountryMaster, Country, State, District, Ownership, Affiliation, Language,
      ApprovedThrough, CollegeFacility, HospitalFacility, HostelFacility, Stream,
      Degree, Course, CourseDuration, ExamType, ExamLevel, Ranking, DistanceMeter,
      College, CollegeCourseAllocation, CollegeRanking, CollegeDistanceMeter,
      CollegeReview, Exam, CountrySection
    ];

    for (const model of modelsToClean) {
      try {
        await model.deleteMany({});
        console.log(`   Deleted documents from: ${model.modelName}`);
      } catch (err) {
        console.warn(`   ⚠️ Warning deleting from ${model.modelName}:`, err.message);
      }
    }

    console.log("✅ Cleanup complete. Seeding realistic data (1 document per model)...");

    // 3. Seed supporting taxonomies and lookup data
    console.log("🌱 Seeding supporting lookup data...");

    const countryMaster = await CountryMaster.create({
      name: "India",
      code: "IND",
      status: "active"
    });
    console.log("   - Seeded CountryMaster:", countryMaster.name);

    const country = await Country.create({
      name: "Bangladesh",
      shortName: "BD",
      code: "BGD",
      capital: "Dhaka",
      currency: "Bangladeshi Taka (BDT)",
      language: "Bengali, English",
      population: "170 Million",
      timeZone: "UTC+6",
      callingCode: "+880",
      quickFacts: [
        { label: "Capital", value: "Dhaka" },
        { label: "Currency", value: "Bangladeshi Taka (BDT)" },
        { label: "Calling Code", value: "+880" }
      ],
      logo: "https://images.unsplash.com/photo-1608958435020-e855b087711c?w=200",
      banner: "https://images.unsplash.com/photo-1608958435020-e855b087711c?q=80&w=1200",
      countryGallery: [
        { url: "https://images.unsplash.com/photo-1608958435020-e855b087711c?q=80&w=800", type: "image" }
      ],
      shortDescription: "Bangladesh offers one of the best MBBS programs for Indian students with a curriculum identical to India.",
      longDescription: "<h2>Why Study in Bangladesh?</h2><p>Bangladesh boasts the highest FMGE passing percentage among all foreign countries for Indian medical students. The culture, food, climate, and diseases are practically identical to India.</p>",
      status: "active",
      isFeatured: true,
      isPopular: true,
      verified: true,
      displayOrder: 1,
      faqs: [
        { question: "Do Indian students need a passport to study in Bangladesh?", answer: "Yes, a valid Indian passport is required for travel and visa registration." }
      ]
    });
    console.log("   - Seeded Country (Study Abroad):", country.name);

    const state = await State.create({
      name: "Delhi",
      code: "DL",
      country: countryMaster._id,
      status: "active"
    });
    console.log("   - Seeded State:", state.name);

    const district = await District.create({
      name: "South Delhi",
      state: state._id,
      code: "SD",
      status: "active"
    });
    console.log("   - Seeded District:", district.name);

    const ownership = await Ownership.create({
      name: "Government",
      description: "Publicly funded government owned institution",
      status: "active"
    });
    console.log("   - Seeded Ownership:", ownership.name);

    const affiliation = await Affiliation.create({
      name: "Delhi University",
      description: "Affiliated to University of Delhi",
      status: "active"
    });
    console.log("   - Seeded Affiliation:", affiliation.name);

    const language = await Language.create({
      name: "English",
      shortDescription: "Instruction medium is English",
      status: "active"
    });
    console.log("   - Seeded Language:", language.name);

    const approvedThrough = await ApprovedThrough.create({
      name: "NMC",
      description: "National Medical Commission of India",
      status: "active"
    });
    console.log("   - Seeded ApprovedThrough:", approvedThrough.name);

    const collegeFacility = await CollegeFacility.create({
      name: "Central Library",
      image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=200",
      description: "Air-conditioned digital and physical resource library",
      status: "active"
    });
    console.log("   - Seeded CollegeFacility:", collegeFacility.name);

    const hospitalFacility = await HospitalFacility.create({
      name: "ICU Unit",
      image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=200",
      description: "Modern Intensive Care Unit with multi-specialty beds",
      status: "active"
    });
    console.log("   - Seeded HospitalFacility:", hospitalFacility.name);

    const hostelFacility = await HostelFacility.create({
      name: "AC Rooms",
      image: "https://images.unsplash.com/photo-1555854817-cc08c8491246?w=200",
      description: "Modern air-conditioned single/double sharing rooms",
      status: "active"
    });
    console.log("   - Seeded HostelFacility:", hostelFacility.name);

    const stream = await Stream.create({
      name: "Medical",
      logo: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200",
      about: "Comprehensive Medical and Allied Sciences guidance stream",
      status: "Active"
    });
    console.log("   - Seeded Stream:", stream.name);

    const degree = await Degree.create({
      name: "Bachelor of Medicine, Bachelor of Surgery",
      shortName: "MBBS",
      description: "Undergraduate professional medical degree program",
      status: "active"
    });
    console.log("   - Seeded Degree:", degree.name);

    const courseDuration = await CourseDuration.create({
      value: 5.5,
      unit: "years",
      description: "5.5 years duration including mandatory internship",
      status: "active"
    });
    console.log("   - Seeded CourseDuration:", courseDuration.name);

    const examType = await ExamType.create({
      name: "National Level Test",
      shortName: "National",
      description: "Examinations held at national level across India",
      status: "active"
    });
    console.log("   - Seeded ExamType:", examType.name);

    const examLevel = await ExamLevel.create({
      name: "Undergraduate",
      status: "active"
    });
    console.log("   - Seeded ExamLevel:", examLevel.name);

    const ranking = await Ranking.create({
      name: "NIRF Medical Ranking",
      rankValue: "Medical",
      description: "National Institutional Ranking Framework by Ministry of Education",
      status: "active"
    });
    console.log("   - Seeded Ranking:", ranking.name);

    const distanceMeter = await DistanceMeter.create({
      name: "IGI Airport New Delhi",
      shortDescription: "Distance to nearest international airport",
      icon: "airplane",
      status: "active"
    });
    console.log("   - Seeded DistanceMeter:", distanceMeter.name);

    // 4. Seed Target Models
    console.log("🌱 Seeding main target models...");

    const course = await Course.create({
      streamId: stream._id,
      degreeId: degree._id,
      name: "MBBS",
      logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200",
      icon: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=100",
      averageFee: "INR 1,00,000 - 15,00,000 per annum",
      description: "A 5.5 years professional degree in medicine and surgery covering anatomy, pharmacology, clinical pathology, etc.",
      admissionProcess: "Admission is conducted strictly on the basis of national merit ranking in NEET UG examination.",
      eligibilityCriteria: "Candidate must be 17+ years of age and must have passed 10+2 with PCB (English compulsory) with at least 50% marks, plus must qualify NEET.",
      entranceExamsDetails: "National Eligibility cum Entrance Test (NEET-UG) is mandatory.",
      howToPrepare: "Focus on NCERT syllabus for Physics, Chemistry, and Biology. Build concept clarity and solve mock tests.",
      status: "active",
      isFeatured: true,
      displayOrder: 1
    });
    console.log("   - Seeded Course:", course.name);

    const college = await College.create({
      name: "All India Institute of Medical Sciences",
      popularName: "AIIMS New Delhi",
      shortName: "AIIMS",
      estdYear: "1956",
      campusSize: "115 Acres",
      ownership: ownership._id,
      affiliation: affiliation._id,
      languages: [language._id],
      approvedThrough: [approvedThrough._id],
      facilities: [collegeFacility._id],
      hospitalFacilities: [hospitalFacility._id],
      hostelFacilities: [hostelFacility._id],
      haveHostel: true,
      haveHospital: true,
      hospitalBeds: 2200,
      intake: ["July", "August"],
      addressLine1: "AIIMS Campus, Ansari Nagar East",
      addressLine2: "Opposite Safdarjung Hospital",
      country: country._id, // References Bangladesh from Country model (for seed example)
      state: state._id,
      district: district._id,
      location: "Ansari Nagar",
      landmark: "Near AIIMS Metro Station",
      pinCode: "110029",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.281896791653!2d77.20816827618956!3d28.56133277570414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d0246a482b683%3A0xe54d33454b5dfa51!2sAll%20India%20Institute%20Of%20Medical%20Sciences!5e0!3m2!1sen!2sin!4v1719999999999",
      phoneNumber: "011-26588500",
      tollFreeNumber: "1800112233",
      helplineNumber: "011-26588700",
      websiteUrl: "https://www.aiims.edu",
      emailAddress: "directory@aiims.edu",
      facebookUrl: "https://facebook.com/aiims",
      twitterUrl: "https://twitter.com/aiims",
      instagramUrl: "https://instagram.com/aiims",
      youtubeUrl: "https://youtube.com/aiims",
      linkedinUrl: "https://linkedin.com/school/aiims",
      logo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200",
      banner: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200",
      collegeGallery: [
        { url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800", type: "image" }
      ],
      hostelGallery: [
        { url: "https://images.unsplash.com/photo-1555854817-cc08c8491246?w=800", type: "image" }
      ],
      campusGallery: [
        { url: "https://images.unsplash.com/photo-1527891751199-7225231a68dd?w=800", type: "image" }
      ],
      shortDescription: "AIIMS New Delhi is the apex medical college and public hospital located in New Delhi, India.",
      longDescription: "<h2>About AIIMS New Delhi</h2><p>Established in 1956 by an Act of Parliament, AIIMS New Delhi serves as a nuclear hub for medical research, teaching, and tertiary patient care. It is consistently ranked as the number one medical institute in India.</p>",
      status: "active",
      isFeatured: true,
      isPopular: true,
      isVerified: true,
      averageRating: 4.8,
      reviewsCount: 1,
      displayOrder: 1,
      metaTitle: "AIIMS New Delhi - Cutoff, Admission, Fees & Placement",
      metaDescription: "Get detailed info on AIIMS New Delhi admission process, course fee structure, cutoff rankings, hospital facilities and placement records.",
      metaKeywords: ["aiims delhi", "mbbs admission delhi", "top medical college india"],
      focusKeyword: "aiims new delhi",
      canonicalUrl: "https://www.aiims.edu",
      ogTitle: "AIIMS New Delhi - India's Premier Medical Institute",
      ogDescription: "Explore courses, admission requirements, and campus details of AIIMS New Delhi.",
      ogImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200"
    });
    console.log("   - Seeded College:", college.name);

    const exam = await Exam.create({
      stream: stream._id,
      courseName: course._id,
      examType: examType._id,
      title: "NEET UG",
      displayRank: 1,
      noOfApplication: 2400000,
      purpose: "Single-window national exam for admission to undergraduate medical programs (MBBS/BDS) in India",
      applicationFee: 1700,
      examLevel: examLevel._id,
      state: state._id,
      country: country._id,
      applicationDate: new Date("2026-02-09T00:00:00Z"),
      examDate: new Date("2026-05-03T00:00:00Z"),
      resultDate: new Date("2026-06-04T00:00:00Z"),
      examDescription: "National Eligibility cum Entrance Test (NEET UG) is conducted annually by the National Testing Agency (NTA).",
      eligibilityCriteria: "Candidates must have passed 10+2 with Physics, Chemistry, Biology, and English with minimum 50% marks (40% for SC/ST). Min age is 17 years.",
      applicationProcess: "Applications must be submitted online on the official NTA website. Documents and photos must be uploaded, and the fee paid digitally.",
      examPattern: "Pen-and-paper (offline) multiple-choice test. 200 questions from Physics, Chemistry, Botany, and Zoology (attempt 180 questions) in 3 hours 20 mins.",
      importantDates: "Applications release in February, exam is conducted in early May, and results are published by first week of June.",
      admitCardDetails: "Admit cards are released online about 3-5 days before the exam. Candidates must carry a printed copy and passport photo to the center.",
      resultInformation: "Results are declared in percentile rank and score. Cutoff lists are prepared for 15% All India Quota and 85% State Quota counselling.",
      logo: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=200",
      pdf: null,
      status: "active",
      isFeatured: true,
      displayOrder: 1
    });
    console.log("   - Seeded Exam:", exam.title);

    const countrySection = await CountrySection.create({
      title: "MBBS in Bangladesh Fees & Costs",
      tabName: "Fee Structure",
      content: "<h2>MBBS Fee Structure in Bangladesh</h2><p>Private medical colleges in Bangladesh offer highly subsidized packages for SAARC students. Total tuition fee ranges from USD 35,000 to USD 45,000 for the entire 5 years course, which includes clinical rotation fees and hostel accommodation.</p>",
      country: country._id,
      displayOrder: 1,
      status: "active"
    });
    console.log("   - Seeded CountrySection:", countrySection.title);

    // 5. Seed Allocations, Rankings, Distance Meters and Reviews
    console.log("🌱 Seeding relational models...");

    const collegeCourseAllocation = await CollegeCourseAllocation.create({
      college: college._id,
      assignedCourses: [
        {
          course: course._id,
          courseDuration: courseDuration._id,
          examType: examType._id,
          feeStructures: [
            {
              session: "2026-2027",
              structureType: "annual",
              seats: 125,
              periods: [
                { label: "Year 1 Tuition", amount: 1628 },
                { label: "Year 2 Tuition", amount: 1628 },
                { label: "Year 3 Tuition", amount: 1628 },
                { label: "Year 4 Tuition", amount: 1628 },
                { label: "Year 5 Tuition", amount: 1628 }
              ]
            }
          ],
          notes: "Fee structure is highly subsidized by the Government of India. The amount includes tuition and hostel registration fees.",
          isActive: true
        }
      ]
    });
    console.log("   - Seeded CollegeCourseAllocation mapping");

    const collegeRanking = await CollegeRanking.create({
      college: college._id,
      rankings: [
        {
          ranking: ranking._id,
          yearRankings: [
            { year: 2025, rank: 1, outOf: 50, notes: "Top ranked medical college in the country" }
          ]
        }
      ]
    });
    console.log("   - Seeded CollegeRanking mapping");

    const collegeDistanceMeter = await CollegeDistanceMeter.create({
      college: college._id,
      distanceMeters: [
        {
          distanceMeter: distanceMeter._id,
          value: 12.5
        }
      ]
    });
    console.log("   - Seeded CollegeDistanceMeter mapping");

    const collegeReview = await CollegeReview.create({
      college: college._id,
      name: "Aman Gupta",
      mobile: "9876543210",
      email: "aman@example.com",
      rating: 5,
      comment: "Excellent education quality, unmatched patient exposure and world-class campus facilities. Best place to study medicine!",
      status: "approved",
      replies: [
        {
          name: "AIIMS Admin",
          mobile: "01126588500",
          email: "admin@aiims.edu",
          comment: "Thank you Aman for your feedback. We wish you all the best in your medical career!",
          status: "approved"
        }
      ]
    });
    console.log("   - Seeded CollegeReview:", collegeReview.comment);

    console.log("🎉 Seeding completed successfully!");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    console.log("🔌 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("👋 Disconnected.");
  }
}

seed();
