const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

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

    // 1. Helper function to find or create auxiliary models
    async function getOrCreate(Model, filter, createData) {
      let record = await Model.findOne(filter);
      if (!record) {
        record = new Model(createData);
        await record.save();
        console.log(`Created new ${Model.modelName}:`, record.name);
      }
      return record;
    }

    // 2. Fetch or create auxiliary entries
    const langEng = await getOrCreate(Language, { name: "English" }, { name: "English", code: "EN", status: "active" });
    const langBeng = await getOrCreate(Language, { name: "Bengali" }, { name: "Bengali", code: "BN", status: "active" });

    const appWho = await getOrCreate(ApprovedThrough, { name: "WHO" }, { name: "WHO", description: "World Health Organization", status: "active" });
    const appNmc = await getOrCreate(ApprovedThrough, { name: "NMC" }, { name: "NMC", description: "National Medical Commission", status: "active" });
    const appBmdc = await getOrCreate(ApprovedThrough, { name: "BMDC" }, { name: "BMDC", description: "Bangladesh Medical & Dental Council", status: "active" });

    const facLib = await getOrCreate(CollegeFacility, { name: "Modern Library" }, { name: "Modern Library", description: "Fully stocked central medical library", status: "active" });
    const facLab = await getOrCreate(CollegeFacility, { name: "Advanced Labs" }, { name: "Advanced Labs", description: "Hi-tech anatomy and physiology labs", status: "active" });
    const facWifi = await getOrCreate(CollegeFacility, { name: "Campus WiFi" }, { name: "Campus WiFi", description: "High-speed campus-wide wireless internet", status: "active" });

    const hospIcu = await getOrCreate(HospitalFacility, { name: "Intensive Care Unit (ICU)" }, { name: "Intensive Care Unit (ICU)", description: "Multi-bed high-care ICU unit", status: "active" });
    const hospOt = await getOrCreate(HospitalFacility, { name: "Operation Theatres" }, { name: "Operation Theatres", description: "Modular advanced operation theatres", status: "active" });
    const hospEr = await getOrCreate(HospitalFacility, { name: "24/7 Emergency Care" }, { name: "24/7 Emergency Care", description: "Round-the-clock emergency medical response", status: "active" });

    const hostAc = await getOrCreate(HostelFacility, { name: "AC Rooms" }, { name: "AC Rooms", description: "Air conditioned rooms for international students", status: "active" });
    const hostMess = await getOrCreate(HostelFacility, { name: "Indian Mess" }, { name: "Indian Mess", description: "Nutritious Indian food options (Veg/Non-Veg)", status: "active" });
    const hostGym = await getOrCreate(HostelFacility, { name: "Fitness Center" }, { name: "Fitness Center", description: "Equipped gym facility inside hostels", status: "active" });

    const courseMbbs = await getOrCreate(Course, { name: "MBBS" }, { name: "MBBS", code: "MBBS", description: "Bachelor of Medicine, Bachelor of Surgery", status: "active" });
    const duration5y = await getOrCreate(CourseDuration, { name: "5 Years" }, { name: "5 Years", value: 5, unit: "years", status: "active" });
    const examSemester = await getOrCreate(ExamType, { name: "Semester" }, { name: "Semester", code: "SEM", shortName: "SEM", status: "active" });

    // 3. Define very rich dataset for the target college
    const collegeId = "6a3b8795f9835ce9f0bb89af";
    const richCollegePayload = {
      name: "Bangladesh Medical University 1",
      popularName: "Bangladesh Medical University 1",
      shortName: "BANMU1",
      estdYear: "1991",
      campusSize: "100 Acres",
      haveHostel: true,
      haveHospital: true,
      hospitalBeds: 650,
      intake: ["September", "October"],

      // Address
      addressLine1: "12 College Avenue, Sector 4",
      addressLine2: "Uttara Model Town",
      location: "Dhaka",
      landmark: "Near Uttara Lake Park",
      pinCode: "1230",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3648.423985141018!2d90.3951!3d23.8759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c42bc2e3c09b%3A0xc3457a414167e435!2sUttara%2C%20Dhaka%2C%20Bangladesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",

      // Contacts
      phoneNumber: "+880-2-8951234",
      tollFreeNumber: "1800-456-7890",
      helplineNumber: "+880-1711-223344",
      websiteUrl: "https://www.bangladesh1.edu",
      emailAddress: "admissions@bangladesh1.edu",

      // Socials
      facebookUrl: "https://www.facebook.com/bangladesh1medical",
      twitterUrl: "https://twitter.com/bangladesh1med",
      instagramUrl: "https://instagram.com/bangladesh1medical",
      youtubeUrl: "https://youtube.com/c/bangladesh1medical",
      linkedinUrl: "https://linkedin.com/school/bangladesh1medical",

      // Media
      logo: "/assets/top-university/imcb.png",
      banner: "/hero.png",
      brochure: null,

      // Galleries (served from local frontend public folder)
      collegeGallery: [
        { url: "/hero1.png", type: "image" },
        { url: "/hero2.png", type: "image" },
        { url: "/hero3.png", type: "image" }
      ],
      hostelGallery: [
        { url: "/hero2.png", type: "image" },
        { url: "/hero3.png", type: "image" }
      ],
      campusGallery: [
        { url: "/hero3.png", type: "image" },
        { url: "/hero4.png", type: "image" }
      ],
      slug: "bangladesh-medical-university-1",

      // Descriptions
      shortDescription: "Bangladesh Medical University 1 (BANMU1) is one of the premier institutions of medical education and research in Dhaka. Established in 1991, it offers high-quality clinical training, WHO-recognized degrees, and state-of-the-art facilities for national and international students.",
      longDescription: `
        <h2>About Bangladesh Medical University 1</h2>
        <p>Bangladesh Medical University 1 (BANMU1) stands as a beacon of excellence in medical studies. Since its inception in 1991, the university has nurtured thousands of medical professionals practicing globally. Spanning across a 100-acre modern campus, it offers a perfect academic environment combined with highly advanced clinical training resources.</p>
        
        <h3>Academic Excellence & Curriculum</h3>
        <p>The MBBS curriculum is designed strictly in accordance with international standards, closely matching the curriculum followed by the National Medical Commission (NMC) in India. Spanning over 5 years of study followed by a compulsory 1-year internship, the curriculum provides deep theoretical knowledge and comprehensive clinical rotations.</p>
        
        <h3>Clinical Exposure & Infrastructure</h3>
        <p>The university features an in-campus 650-bed tertiary care teaching hospital. With advanced Intensive Care Units, modern modular operation theatres, and dedicated multi-specialty departments, students gain extensive, hands-on clinical experience dealing with diverse patient populations and tropical diseases identical to those found in India.</p>

        <h3>International Student Hostels</h3>
        <p>Hostels are located inside the campus boundary, offering 24/7 security. Separate wings are available for male and female students with modern amenities including high-speed Wi-Fi, air-conditioned rooms, a fitness center, and a dedicated Indian mess serving veg/non-veg meals prepared by professional chefs.</p>
      `,

      status: "active",
      isFeatured: true,
      isPopular: true,
      isVerified: true,
      averageRating: 4.8,
      reviewsCount: 15,
      displayOrder: 1,

      // Relations
      languages: [langEng._id, langBeng._id],
      approvedThrough: [appWho._id, appNmc._id, appBmdc._id],
      facilities: [facLib._id, facLab._id, facWifi._id],
      hospitalFacilities: [hospIcu._id, hospOt._id, hospEr._id],
      hostelFacilities: [hostAc._id, hostMess._id, hostGym._id],

      // SEO
      metaTitle: "Bangladesh Medical University 1 - MBBS Fees & Admission",
      metaDescription: "Apply to Bangladesh Medical University 1. Get detailed info on MBBS fee structure, NMC/WHO approval, hostel facilities, and direct admission guide.",
      metaKeywords: ["Bangladesh Medical University 1", "BANMU1", "MBBS in Bangladesh", "BANMU1 Fee structure", "Study MBBS abroad"],
      focusKeyword: "Bangladesh Medical University 1",
      canonicalUrl: "https://www.ccic.in/colleges/bangladesh-medical-university-1",
      ogTitle: "Bangladesh Medical University 1 - Excellence Since 1991",
      ogDescription: "Discover top-tier medical education at Bangladesh Medical University 1. WHO & NMC approved MBBS program with a 650-bed teaching hospital.",
      ogImage: "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?w=1200&h=630&fit=crop&q=80",
      twitterTitle: "Bangladesh Medical University 1 Admissions Open",
      twitterDescription: "Direct MBBS admissions at Bangladesh Medical University 1. WHO approved degree, identical Indian syllabus, and 650-bed teaching hospital.",
      twitterImage: "https://images.unsplash.com/photo-1586773860418-d37222d8fce2?w=1200&h=630&fit=crop&q=80"
    };

    // 4. Update the College document
    const updatedCollege = await College.findByIdAndUpdate(
      collegeId,
      { $set: richCollegePayload },
      { new: true, runValidators: true }
    );

    if (!updatedCollege) {
      console.error("Could not find the target college to update!");
      return;
    }
    console.log("Successfully updated College:", updatedCollege.name, `(${updatedCollege.slug})`);

    // 5. Seed CollegeCourseAllocation
    const allocationPayload = {
      college: collegeId,
      assignedCourses: [
        {
          course: courseMbbs._id,
          courseDuration: duration5y._id,
          examType: examSemester._id,
          isActive: true,
          notes: "Compulsory 1-year internship is included after 5 years of study.",
          feeStructures: [
            {
              session: "2026-2027",
              structureType: "annual",
              seats: 120,
              periods: [
                { label: "1st Year Tuition & Admission Fee", amount: 1200000 },
                { label: "2nd Year Tuition Fee", amount: 450000 },
                { label: "3rd Year Tuition Fee", amount: 450000 },
                { label: "4th Year Tuition Fee", amount: 450000 },
                { label: "5th Year Tuition Fee", amount: 450000 }
              ]
            }
          ]
        }
      ]
    };

    await CollegeCourseAllocation.findOneAndUpdate(
      { college: collegeId },
      { $set: allocationPayload },
      { upsert: true, new: true, runValidators: true }
    );
    console.log("Successfully seeded course allocation for", updatedCollege.name);

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seed();
