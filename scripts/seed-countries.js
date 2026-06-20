const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const CountryModule = require("../lib/models/Country.js");
const Country = CountryModule.default || CountryModule;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

async function seedCountries() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    console.log("Dropping existing countries collection...");
    try {
      await Country.collection.drop();
      console.log("Collection dropped!");
    } catch (e) {
      console.log("Collection might not exist, skipping drop.");
    }

    const countriesData = [
      {
        name: "China",
        shortName: "PRC",
        code: "CHN",
        capital: "Beijing",
        currency: "Chinese Yuan (CNY)",
        language: "Mandarin, English",
        population: "1.4 Billion",
        timeZone: "UTC+8",
        callingCode: "+86",
        logo: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&q=80&auto=format",
        banner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200",
        shortDescription: "China has emerged as a leading destination for Indian students pursuing MBBS abroad. With world-class medical universities, affordable fees, and globally recognized degrees.",
        longDescription: `
          <h2>Why Study in China?</h2>
          <p>China offers affordable MBBS programs with fees significantly lower than private Indian colleges. Universities are WHO and NMC recognized, enabling graduates to practice in India after clearing FMGE. The curriculum is taught in English, and students gain exposure to advanced medical technology and diverse patient cases.</p>
          <h2>Education System</h2>
          <p>China has a well-structured medical education system with 6-year MBBS programs taught in English at top universities. The curriculum follows international standards with strong clinical exposure.</p>
          <h2>Student Life</h2>
          <p>Students experience a blend of traditional Chinese culture and modern urban life. Universities provide comfortable hostel facilities, Indian food options, and dedicated international student support.</p>
          <h2>Career Prospects</h2>
          <p>After completing MBBS in China, students can appear for FMGE/NEXT to practice in India or pursue PG in China/other countries.</p>
        `,
        metaTitle: "Study MBBS and Engineering in China | CCIC Education",
        metaDescription: "Discover top medical and engineering universities in China. Affordable fees, WHO recognized degrees, and English medium instruction.",
        focusKeyword: "study in china, mbbs in china",
        studyMetrics: { tuitionFeeMin: 300000, tuitionFeeMax: 800000, livingCostMin: 40000, livingCostMax: 70000, courseDuration: "6 Years (MBBS) / 4 Years (B.Tech)", mediumOfTeaching: "English" },
        admissionDetails: { timeline: "March - July", eligibility: "10+2 with PCB, minimum 50% aggregate, NEET qualified", visaType: "Student Visa (X1/X2)" },
        studyPathways: [
          { title: "MBBS in China", duration: "6 years", description: "A structured abroad route for NEET-qualified students comparing WHO-recognized universities." },
          { title: "Engineering in China", duration: "4 years", description: "A practical abroad route for PCM students comparing engineering programs." },
          { title: "Management in China", duration: "4 years", description: "A strategic abroad route for students comparing business programs." }
        ],
        status: "active",
        isFeatured: true,
        isPopular: true,
        displayOrder: 1
      },
      {
        name: "Bangladesh",
        shortName: "BD",
        code: "BGD",
        capital: "Dhaka",
        currency: "Bangladeshi Taka (BDT)",
        language: "Bengali, English",
        population: "170 Million",
        timeZone: "UTC+6",
        callingCode: "+880",
        logo: "https://images.unsplash.com/photo-1608958435020-e855b087711c?w=200&q=80&auto=format",
        banner: "https://images.unsplash.com/photo-1608958435020-e855b087711c?q=80&w=1200",
        shortDescription: "Bangladesh offers one of the best MBBS programs for Indian students with a curriculum identical to India, the highest FMGE passing rate, and a similar culture.",
        longDescription: `
          <h2>Why Study in Bangladesh?</h2>
          <p>Bangladesh boasts the highest FMGE passing percentage among all foreign countries for Indian medical students. The culture, food, climate, and diseases are practically identical to India, which means clinical practice and practical exposure seamlessly translate when you return to India.</p>
          <h2>Education System</h2>
          <p>The medical curriculum is 5 years long, followed by a 1-year internship. The entire syllabus, medical books, and teaching methodologies are modeled directly on the NMC guidelines of India.</p>
          <h2>Student Life</h2>
          <p>Indian students feel right at home. The language, food habits (plenty of Indian cuisine available), and welcoming nature of the locals make it one of the safest and most comfortable countries for female students.</p>
          <h2>Career Prospects</h2>
          <p>Because the clinical exposure deals with identical tropical diseases, students face almost zero friction passing the NEXT/FMGE exam on their first attempt.</p>
        `,
        metaTitle: "Study MBBS in Bangladesh | Highest FMGE Passing Rate",
        metaDescription: "Study MBBS in Bangladesh at NMC & WHO recognized colleges. Enjoy familiar culture, affordable fees, and top FMGE passing rates for Indian students.",
        focusKeyword: "study mbbs in bangladesh, medical colleges in bangladesh",
        studyMetrics: { tuitionFeeMin: 250000, tuitionFeeMax: 600000, livingCostMin: 15000, livingCostMax: 25000, courseDuration: "5 Years + 1 Year Internship", mediumOfTeaching: "English" },
        admissionDetails: { timeline: "September - November", eligibility: "10+2 with PCB 60%, NEET Qualified, No Study Gap", visaType: "Student Visa" },
        studyPathways: [
          { title: "MBBS in Bangladesh", duration: "5+1 years", description: "The premier medical pathway that boasts the highest FMGE success rate due to NMC identical curriculum." },
          { title: "BDS in Bangladesh", duration: "4+1 years", description: "Highly regarded dental surgery programs with massive hands-on clinical exposure." }
        ],
        status: "active",
        isFeatured: true,
        isPopular: true,
        displayOrder: 2
      },
      {
        name: "Egypt",
        shortName: "EGY",
        code: "EGY",
        capital: "Cairo",
        currency: "Egyptian Pound (EGP)",
        language: "Arabic, English",
        population: "110 Million",
        timeZone: "UTC+2",
        callingCode: "+20",
        logo: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=200&q=80&auto=format",
        banner: "https://images.unsplash.com/photo-1539667468225-eebb663053e6?q=80&w=1200",
        shortDescription: "Egypt is rapidly becoming a top destination for MBBS due to its excellent medical infrastructure, highly affordable tuition fees, and rich cultural heritage.",
        longDescription: `
          <h2>Why Study in Egypt?</h2>
          <p>Egypt is a hidden gem for medical studies. Its public universities are centuries old and feature massive teaching hospitals. The fees are exceptionally low, and living expenses are comparable to India.</p>
          <h2>Education System</h2>
          <p>The MBBS program follows a modern 5-year academic + 2-year practical internship model. Medical universities are globally recognized by WHO, WFME, and NMC, ensuring valid degrees across the world.</p>
          <h2>Student Life</h2>
          <p>Living in Egypt is safe and incredibly historic. Students enjoy a beautiful blend of ancient civilization and modern amenities. The large international student community provides a diverse and enriching campus life.</p>
          <h2>Career Prospects</h2>
          <p>Egyptian medical degrees are highly respected in the Gulf countries and Europe. Many graduates successfully clear PLAB and USMLE exams, opening doors to careers in the UK, USA, and Middle East.</p>
        `,
        metaTitle: "Study MBBS in Egypt | Affordable Medical Universities",
        metaDescription: "Pursue your MBBS in Egypt with low tuition fees, WHO recognized universities, and massive clinical exposure. Apply now for top Egyptian colleges.",
        focusKeyword: "mbbs in egypt, study in egypt",
        studyMetrics: { tuitionFeeMin: 350000, tuitionFeeMax: 550000, livingCostMin: 12000, livingCostMax: 20000, courseDuration: "5 Years + 2 Years Internship", mediumOfTeaching: "English" },
        admissionDetails: { timeline: "May - September", eligibility: "10+2 with PCB 50%, NEET Qualified", visaType: "Student Visa" },
        studyPathways: [
          { title: "MBBS Program", duration: "5+2 years", description: "World-class medical degree with two years of intensive house-job/internship training." },
          { title: "Dentistry (BDS)", duration: "5 years", description: "Advanced dental training programs with access to enormous patient flows." }
        ],
        status: "active",
        isFeatured: true,
        isPopular: false,
        displayOrder: 3
      }
    ];

    console.log("Creating new country records...");
    for (const data of countriesData) {
      const country = new Country(data);
      await country.save();
      console.log(`Created ${data.name} successfully!`);
    }

  } catch (error) {
    console.error("Error seeding country:", error);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

seedCountries();
