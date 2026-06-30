const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const CountryModule = require("../lib/models/Country.js");
const Country = CountryModule.default || CountryModule;

const CountrySectionModule = require("../lib/models/CountrySection.js");
const CountrySection = CountrySectionModule.default || CountrySectionModule;

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

const countriesToSeed = [
  {
    name: "Russia",
    shortName: "Russia",
    code: "RUS",
    slug: "russia",
    capital: "Moscow",
    currency: "Russian Ruble (RUB)",
    language: "Russian, English",
    population: "144 Million",
    timeZone: "UTC+3",
    callingCode: "+7",
    logo: "/uploads/countries/countries_country-logo_russia.svg",
    banner: "https://images.unsplash.com/photo-1513326738677-b964603b136d?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1513326738677-b964603b136d?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "Russia is one of the most popular international destinations for MBBS among Indian students. With top-tier government medical universities, affordable state-subsidized fees, and state-of-the-art laboratory infrastructure.",
    longDescription: "<h2>Why Study in Russia?</h2><p>Russia has a long-standing history of medical education excellence. Russian medical degrees are globally recognized by WHO, UNESCO, and the National Medical Commission (NMC) of India. The tuition fees are heavily subsidized by the Russian government, making it highly affordable. Universities offer English-medium MBBS programs with hands-on clinical training, high-tech simulation centers, and comfortable hostels with Indian mess facilities.</p><h2>Education System</h2><p>The MBBS program in Russia is 6 years long, including clinical clerkships. The curriculum is structured on European standard models, focusing heavily on anatomy, physiology, and modern diagnostics.</p><h2>Student Life</h2><p>Indian students enjoy a vibrant campus life in major Russian cities. Hostels are centrally heated, secure, and offer dedicated international support. Many universities feature active Indian student associations and celebrate major Indian festivals.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "Fully English Medium Available" },
      { label: "Course Duration", value: "6 Years (MBBS)" },
      { label: "Est. Tuition Fee", value: "Rs. 2.5L - 5.0L / year" },
      { label: "Est. Living Cost", value: "Rs. 1.2L - 1.8L / year" },
      { label: "Primary Intake", value: "September / October" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG, WDOMS" },
      { label: "Capital City", value: "Moscow" },
      { label: "Official Currency", value: "Russian Ruble (RUB)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Indian Mess & Hostel Kitchen Facilities Available" }
    ],
    faqs: [
      {
        question: "Is MBBS from Russia recognized in India?",
        answer: "Yes, MBBS degrees from NMC and WHO recognized Russian state universities are fully valid in India. Graduates can practice after passing the screening exam (FMGE/NEXT)."
      },
      {
        question: "What is the medium of instruction in Russian universities?",
        answer: "Most leading Russian medical universities offer fully English-medium programs for international medical students."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: true,
    verified: false,
    displayOrder: 4,
    metaTitle: "Study MBBS in Russia | Subsidized Fees & WHO Approved | CCIC",
    metaDescription: "Pursue MBBS in Russia at top government medical universities. Fully English-medium, low tuition fees, WHO & NMC recognized, and high-quality clinical training.",
    metaKeywords: ["study in russia", "mbbs in russia", "medical colleges russia"],
    focusKeyword: "mbbs in russia",
    sections: [
      {
        title: "Why Choose Russia",
        tabName: "Overview",
        content: "<p>Russia offers premium, world-class medical universities at a fraction of the cost of private Indian colleges. With clinical programs spanning over a century and highly equipped university hospitals, it remains a premier international destination.</p>"
      },
      {
        title: "Russia Admission Process",
        tabName: "Admission",
        content: "<h2>Russia Admission Process</h2><ol><li>Complete application and submit academic transcripts.</li><li>Receive university admission letter.</li><li>Apply for Russian student visa with official invitation letter.</li><li>Complete travel planning and report to campus.</li></ol>"
      },
      {
        title: "Russia Student Visa Guidance",
        tabName: "Visa",
        content: "<h2>Russia Student Visa Guidance</h2><p>Russian student visas are processed through the official Russian Embassy or authorized visa centers. Requires valid passport, visa support letter/invitation, and medical fitness certificates.</p>"
      },
      {
        title: "Russia Fees and Living Costs",
        tabName: "Fees",
        content: "<h2>Russia Fees and Living Costs</h2><p>Tuition fees average Rs. 2,50,000 to Rs. 5,00,000 per year. Living and hostel costs are highly economical, averaging Rs. 10,000 to Rs. 15,000 per month.</p>"
      },
      {
        title: "Popular Courses in Russia",
        tabName: "Courses",
        content: "<h2>Popular Courses in Russia</h2><ul><li><strong>MBBS (General Medicine):</strong> 6-year English-taught clinical program.</li><li><strong>Pediatrics:</strong> Specialized child-health clinical course.</li><li><strong>Dentistry (BDS):</strong> 5-year dental surgery training.</li></ul>"
      }
    ]
  },
  {
    name: "Nepal",
    shortName: "Nepal",
    code: "NPL",
    slug: "nepal",
    capital: "Kathmandu",
    currency: "Nepalese Rupee (NPR)",
    language: "Nepali, English, Hindi",
    population: "30 Million",
    timeZone: "UTC+5:45",
    callingCode: "+977",
    logo: "/uploads/countries/countries_country-logo_nepal.svg",
    banner: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "Nepal is the closest study abroad destination for Indian medical aspirants, offering high-quality MBBS education with an identical climate, food habits, and clinical curriculum.",
    longDescription: "<h2>Why Study in Nepal?</h2><p>Nepal is a highly preferred destination for Indian students due to its close geographical proximity, similar culture, and no visa requirement for travel. The MBBS curriculum is modeled directly on the Indian medical education system. Many faculty members are retired professors from top Indian medical institutions, and the clinical pattern (diseases, patients, diagnostic protocols) is identical to India, which yields excellent FMGE passing rates.</p><h2>Education System</h2><p>The MBBS program in Nepal is 5.5 years long, consisting of 4.5 years of academic studies and 1 year of mandatory rotatory internship. The medical schools are affiliated with Kathmandu University or Tribhuvan University.</p><h2>Student Life</h2><p>Indian students experience zero cultural shock in Nepal. Indian cuisine, vegetarian options, and traditional customs are part of daily life. The campuses are highly secure and nestled in scenic, peaceful environments.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "English Medium Instruction" },
      { label: "Course Duration", value: "5.5 Years" },
      { label: "Est. Tuition Fee", value: "Rs. 8.0L - 12.0L / year" },
      { label: "Est. Living Cost", value: "Rs. 80,000 - 1.2L / year" },
      { label: "Primary Intake", value: "September / October" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG" },
      { label: "Capital City", value: "Kathmandu" },
      { label: "Official Currency", value: "Nepalese Rupee (NPR)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Familiar Indian Cuisine & Mess Available in all Hostels" }
    ],
    faqs: [
      {
        question: "Do Indian students need a passport to study in Nepal?",
        answer: "While Indian citizens do not need a visa to enter Nepal, students are highly advised to carry a valid passport or Indian Voter ID card for official academic registrations."
      },
      {
        question: "Is the clinical internship in Nepal valid in India?",
        answer: "Under current regulations, students are required to follow the internship and licensing protocols specified by the NMC and respective state councils upon return to India."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: true,
    verified: false,
    displayOrder: 5,
    metaTitle: "Study MBBS in Nepal | Top NMC Approved Colleges | CCIC",
    metaDescription: "Pursue your MBBS in Nepal close to home. Identical curriculum to India, no visa requirements, and exceptional FMGE success rates. Register now.",
    metaKeywords: ["study in nepal", "mbbs in nepal", "medical colleges nepal"],
    focusKeyword: "mbbs in nepal",
    sections: [
      {
        title: "Why Choose Nepal",
        tabName: "Overview",
        content: "<p>Nepal is a home away from home. Its medical curriculum is modeled directly on the Indian pattern, offering similar clinical diseases and diagnostic methodologies, leading to high passing scores in licensing exams.</p>"
      },
      {
        title: "Nepal Admission Process",
        tabName: "Admission",
        content: "<h2>Nepal Admission Process</h2><ol><li>Verify NEET eligibility and score criteria.</li><li>Submit application for MECEE (Medical Education Common Entrance Examination) or direct NRI pathway.</li><li>Counseling and university allotment.</li><li>Campus reporting and onboarding.</li></ol>"
      },
      {
        title: "Nepal Visa and Travel Guide",
        tabName: "Visa",
        content: "<h2>Nepal Visa and Travel Guide</h2><p>Indian nationals do not require a visa to enter or study in Nepal. Official student entry requires standard identification documents (Passport or Voter ID).</p>"
      },
      {
        title: "Nepal Fees and Living Cost",
        tabName: "Fees",
        content: "<h2>Nepal Fees and Living Cost</h2><p>MBBS fees range from Rs. 8,00,000 to Rs. 12,00,000 per year, generally payable in installments. Living expenses are extremely low and comparable to standard Indian cities.</p>"
      },
      {
        title: "Popular Courses in Nepal",
        tabName: "Courses",
        content: "<h2>Popular Courses in Nepal</h2><ul><li><strong>MBBS:</strong> 5.5-year clinical degree (highly popular among Indian candidates).</li><li><strong>BDS:</strong> 5-year dental surgery training.</li></ul>"
      }
    ]
  },
  {
    name: "Kazakhstan",
    shortName: "Kazakhstan",
    code: "KAZ",
    slug: "kazakhstan",
    capital: "Astana",
    currency: "Kazakhstani Tenge (KZT)",
    language: "Kazakh, Russian, English",
    population: "20 Million",
    timeZone: "UTC+5 / UTC+6",
    callingCode: "+7",
    logo: "/uploads/countries/countries_country-logo_kazakhstan.svg",
    banner: "https://images.unsplash.com/photo-1589578135893-9c02ffea8ee8?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1589578135893-9c02ffea8ee8?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "Kazakhstan is a highly cost-effective destination for MBBS, offering modern national universities, English-medium coursework, and globally accepted medical degrees.",
    longDescription: "<h2>Why Study in Kazakhstan?</h2><p>Kazakhstan offers an excellent pathway for Indian medical students looking for high-quality education on a budget. Universities like Asfendiyarov Kazakh National Medical University are world-renowned and hold WHO, WFME, and NMC recognitions. The cost of living is very low, and classrooms are equipped with modern simulation labs, smart boards, and virtual dissection tools.</p><h2>Education System</h2><p>MBBS in Kazakhstan follows the 5-year curriculum structure in accordance with global ECTS credit systems. Clinical training takes place in major municipal hospitals with diverse patient loads.</p><h2>Student Life</h2><p>Students enjoy secure, university-operated hostels, distinct seasonal climates, and rich local cultural exchanges. Indian dining facilities and grocery availability make daily life extremely convenient.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "English Medium Programs" },
      { label: "Course Duration", value: "5 Years" },
      { label: "Est. Tuition Fee", value: "Rs. 3.0L - 4.5L / year" },
      { label: "Est. Living Cost", value: "Rs. 80,000 - 1.2L / year" },
      { label: "Primary Intake", value: "September / October" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG, WFME" },
      { label: "Capital City", value: "Astana" },
      { label: "Official Currency", value: "Kazakhstani Tenge (KZT)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Indian Messes Operating inside Campus & Hostels" }
    ],
    faqs: [
      {
        question: "What is the duration of MBBS in Kazakhstan?",
        answer: "The MBBS program in Kazakhstan is typically 5 years, which complies with the ECTS standard requirements for international students."
      },
      {
        question: "Is Indian food available in Kazakhstan?",
        answer: "Yes, all major universities hosting Indian students have dedicated Indian kitchens and messes serving both veg and non-veg meals."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: true,
    verified: false,
    displayOrder: 6,
    metaTitle: "Study MBBS in Kazakhstan | Lowest Fees | WHO & WFME Recognized",
    metaDescription: "Find affordable NMC approved medical universities in Kazakhstan. English-medium programs, 5-year course duration, and modern laboratory infrastructure.",
    metaKeywords: ["study in kazakhstan", "mbbs in kazakhstan", "medical colleges kazakhstan"],
    focusKeyword: "mbbs in kazakhstan",
    sections: [
      {
        title: "Why Choose Kazakhstan",
        tabName: "Overview",
        content: "<p>Kazakhstan provides top-tier national universities with advanced clinical learning environments, extremely low tuition rates, and simplified student visa procedures.</p>"
      },
      {
        title: "Kazakhstan Admission Process",
        tabName: "Admission",
        content: "<h2>Kazakhstan Admission Process</h2><ol><li>Submit academic documents and passport for review.</li><li>Receive university admission and visa invitation letters.</li><li>Submit visa file at the Kazakhstan Embassy.</li><li>Travel arrangements and enrollment.</li></ol>"
      },
      {
        title: "Kazakhstan Visa Guidelines",
        tabName: "Visa",
        content: "<h2>Kazakhstan Visa Guidelines</h2><p>Student visas are granted based on the official invitation issued by the Ministry of Foreign Affairs of Kazakhstan. Requires health clearance and verified academic credentials.</p>"
      },
      {
        title: "Kazakhstan Fees and Budgeting",
        tabName: "Fees",
        content: "<h2>Kazakhstan Fees and Budgeting</h2><p>Tuition fees are highly competitive, ranging from Rs. 3,00,000 to Rs. 4,50,000 per year. Living expenses are very manageable, averaging Rs. 10,000 per month.</p>"
      },
      {
        title: "Popular Courses in Kazakhstan",
        tabName: "Courses",
        content: "<h2>Popular Courses in Kazakhstan</h2><ul><li><strong>MBBS (General Medicine):</strong> 5-year modern credit program.</li><li><strong>Pharmacy:</strong> 4-year pharmaceutical training.</li></ul>"
      }
    ]
  },
  {
    name: "Kyrgyzstan",
    shortName: "Kyrgyzstan",
    code: "KGZ",
    slug: "kyrgyzstan",
    capital: "Bishkek",
    currency: "Kyrgyzstani Som (KGS)",
    language: "Kyrgyz, Russian, English",
    population: "7 Million",
    timeZone: "UTC+6",
    callingCode: "+996",
    logo: "/uploads/countries/countries_country-logo_kyrgyzstan.svg",
    banner: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "Kyrgyzstan is one of the most affordable countries for medical studies, featuring multiple recognized government universities and a large, welcoming Indian student community.",
    longDescription: "<h2>Why Study in Kyrgyzstan?</h2><p>Kyrgyzstan is highly popular among Indian students because of its exceptionally low tuition fees and friendly visa rules. Leading institutions like Osh State University and the International School of Medicine (ISM) offer fully English-medium courses. The degree is globally recognized, enabling graduates to attempt licensing exams in India, the US, UK, and Europe.</p><h2>Education System</h2><p>The medical course is 5 years long, structured with intensive theoretical learning in early semesters and clinical training at affiliated clinics in later years.</p><h2>Student Life</h2><p>Bishkek and Osh are very safe cities with low crime rates. Hostels are comfortable, and separate messes serve Indian food. The student support services assist in local registration and residency permits.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "English Medium Lectures & Practicals" },
      { label: "Course Duration", value: "5 Years" },
      { label: "Est. Tuition Fee", value: "Rs. 2.0L - 3.5L / year" },
      { label: "Est. Living Cost", value: "Rs. 70,000 - 1.0L / year" },
      { label: "Primary Intake", value: "September / October" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG" },
      { label: "Capital City", value: "Bishkek" },
      { label: "Official Currency", value: "Kyrgyzstani Som (KGS)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Indian Mess System offering Veg & Non-Veg Options" }
    ],
    faqs: [
      {
        question: "Is Kyrgyzstan safe for Indian students?",
        answer: "Yes, Kyrgyzstan is highly peaceful. Universities offer secure, monitored hostels for international students with 24/7 security."
      },
      {
        question: "Do I need to learn the local language?",
        answer: "While the academic instruction is in English, learning basic Russian or Kyrgyz is highly beneficial for daily communication and clinical patient interactions."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: false,
    verified: false,
    displayOrder: 7,
    metaTitle: "Study MBBS in Kyrgyzstan | Super Affordable Medical Colleges",
    metaDescription: "Pursue MBBS in Kyrgyzstan starting at just Rs. 2.0L/year. WHO & NMC approved state universities with English-medium programs and massive Indian student base.",
    metaKeywords: ["study in kyrgyzstan", "mbbs in kyrgyzstan", "medical colleges kyrgyzstan"],
    focusKeyword: "mbbs in kyrgyzstan",
    sections: [
      {
        title: "Why Choose Kyrgyzstan",
        tabName: "Overview",
        content: "<p>Kyrgyzstan stands out for its budget friendliness and large alumni base. Over 10,000 Indian students are currently studying medicine here, supported by structured university administrations.</p>"
      },
      {
        title: "Kyrgyzstan Admission Process",
        tabName: "Admission",
        content: "<h2>Kyrgyzstan Admission Process</h2><ol><li>Submit transcripts and NEET scorecard.</li><li>Receive provisional admission offer.</li><li>Apply for university visa authorization code.</li><li>Embassy visa processing and flight.</li></ol>"
      },
      {
        title: "Kyrgyzstan Visa Processing",
        tabName: "Visa",
        content: "<h2>Kyrgyzstan Visa Processing</h2><p>Student visa (S1) requires an official visa invitation issued by the Ministry of Foreign Affairs of the Kyrgyz Republic. Standard processing takes 10-15 working days.</p>"
      },
      {
        title: "Kyrgyzstan Budget Planning",
        tabName: "Fees",
        content: "<h2>Kyrgyzstan Budget Planning</h2><p>Tuition fees are extremely low (Rs. 2,00,000 to Rs. 3,50,000 per year). Living expenses, including hostel and food, cost around Rs. 7,000 to Rs. 10,000 per month.</p>"
      },
      {
        title: "Popular Courses in Kyrgyzstan",
        tabName: "Courses",
        content: "<h2>Popular Courses in Kyrgyzstan</h2><ul><li><strong>MBBS:</strong> 5-year comprehensive medical curriculum.</li><li><strong>BDS:</strong> Dental health clinical training.</li></ul>"
      }
    ]
  },
  {
    name: "Uzbekistan",
    shortName: "Uzbekistan",
    code: "UZB",
    slug: "uzbekistan",
    capital: "Tashkent",
    currency: "Uzbekistani Som (UZS)",
    language: "Uzbek, Russian, English",
    population: "35 Million",
    timeZone: "UTC+5",
    callingCode: "+998",
    logo: "/uploads/countries/countries_country-logo_uzbekistan.svg",
    banner: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "Uzbekistan offers high-quality medical education in Central Asia, with newly equipped modern campuses, bilingual clinical pathways, and highly affordable costs.",
    longDescription: "<h2>Why Study in Uzbekistan?</h2><p>Uzbekistan has modernized its medical education infrastructure rapidly. Top universities like Tashkent Medical Academy and Samarkand State Medical University have signed academic partnerships with Western universities. They feature world-class diagnostic labs, modern hospital facilities, and highly structured English-medium curricula. The country is safe, clean, and culturally welcoming to international students.</p><h2>Education System</h2><p>The MBBS program in Uzbekistan is 5 to 6 years long depending on university specific allocations. Instruction is fully in English, following international credit frameworks.</p><h2>Student Life</h2><p>Indian students live in modern city environments. The local cuisine is delicious and shares historical ties with Indian food. Security is strict on campus and in hostels, ensuring a safe study experience.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "English Medium Theory & Clinics" },
      { label: "Course Duration", value: "5 or 6 Years" },
      { label: "Est. Tuition Fee", value: "Rs. 2.5L - 4.5L / year" },
      { label: "Est. Living Cost", value: "Rs. 80,000 - 1.2L / year" },
      { label: "Primary Intake", value: "September / October" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG" },
      { label: "Capital City", value: "Tashkent" },
      { label: "Official Currency", value: "Uzbekistani Som (UZS)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Indian Mess facilities inside hostels serve traditional food" }
    ],
    faqs: [
      {
        question: "Is the degree from Uzbekistan valid globally?",
        answer: "Yes, Uzbek medical degrees are listed in the World Directory of Medical Schools (WDOMS) and recognized by the WHO and NMC, allowing clinical practice worldwide."
      },
      {
        question: "What is the cost of living in Tashkent?",
        answer: "Living in Tashkent is highly affordable, with average monthly student expenses (hostel and food) range around Rs. 8,00,000 - 12,000."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: false,
    verified: false,
    displayOrder: 8,
    metaTitle: "Study MBBS in Uzbekistan | Modernized Medical Universities",
    metaDescription: "Find top medical universities in Uzbekistan. English-medium programs, world-class campuses, low tuition fees, and rich clinical exposure for Indian students.",
    metaKeywords: ["study in uzbekistan", "mbbs in uzbekistan", "medical colleges uzbekistan"],
    focusKeyword: "mbbs in uzbekistan",
    sections: [
      {
        title: "Why Choose Uzbekistan",
        tabName: "Overview",
        content: "<p>Uzbekistan has launched state-of-the-art medical campuses with massive hospital affiliations. Its universities focus on European credit integration, ensuring modern standards.</p>"
      },
      {
        title: "Uzbekistan Admission Process",
        tabName: "Admission",
        content: "<h2>Uzbekistan Admission Process</h2><ol><li>Submit profile details and academic transcripts.</li><li>University interview/screening test.</li><li>Issue of admission letter and visa support documentation.</li><li>Embassy stamping and arrival.</li></ol>"
      },
      {
        title: "Uzbekistan Student Visa Guide",
        tabName: "Visa",
        content: "<h2>Uzbekistan Student Visa Guide</h2><p>Student visa (S1) requires an official visa invitation registered by the host university in Tashkent. Requires standard health declarations.</p>"
      },
      {
        title: "Uzbekistan Fees and Budgeting",
        tabName: "Fees",
        content: "<h2>Uzbekistan Fees and Budgeting</h2><p>Tuition fees average Rs. 2,50,000 to Rs. 4,50,000 per year. General student living costs are highly similar to major Indian cities.</p>"
      },
      {
        title: "Popular Courses in Uzbekistan",
        tabName: "Courses",
        content: "<h2>Popular Courses in Uzbekistan</h2><ul><li><strong>MBBS:</strong> 5-6 year English taught general medicine course.</li><li><strong>Pediatrics:</strong> Specialized medical training in child health.</li></ul>"
      }
    ]
  },
  {
    name: "Georgia",
    shortName: "Georgia",
    code: "GEO",
    slug: "georgia",
    capital: "Tbilisi",
    currency: "Georgian Lari (GEL)",
    language: "Georgian, English",
    population: "3.7 Million",
    timeZone: "UTC+4",
    callingCode: "+995",
    logo: "/uploads/countries/countries_country-logo_georgia.svg",
    banner: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "Georgia is a premier European destination for MBBS, offering highly advanced medical schools, European standard credit systems (ECTS), and direct entry into global residency programs.",
    longDescription: "<h2>Why Study in Georgia?</h2><p>Georgia offers European quality medical education at highly affordable tuition rates. Its medical universities are fully compliant with WFME (World Federation for Medical Education) standards and recognized by WHO and the National Medical Commission (NMC) of India. The climate is moderate, the country is safe and peaceful, and degrees are aligned with the European Higher Education Area (EHEA), making graduates eligible to practice in Europe and other global destinations.</p><h2>Education System</h2><p>The medical degree in Georgia is MD (equivalent to MBBS) and spans over 6 years. It is taught entirely in English, featuring modern pathology labs, clinical rotations in top European standard hospitals, and modern research projects.</p><h2>Student Life</h2><p>Tbilisi and other student hubs offer a rich European lifestyle. Hostels are modern, highly secure, and feature facilities for Indian dining. Students benefit from the safe, clean environment and vibrant multicultural student community.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "100% English Medium Programs" },
      { label: "Course Duration", value: "6 Years" },
      { label: "Est. Tuition Fee", value: "Rs. 3.5L - 6.0L / year" },
      { label: "Est. Living Cost", value: "Rs. 1.5L - 2.2L / year" },
      { label: "Primary Intake", value: "September / February" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG, WFME, AMSE" },
      { label: "Official Currency", value: "Georgian Lari (GEL)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Indian Dining Halls & Self-cooking kitchens available" }
    ],
    faqs: [
      {
        question: "Is MD from Georgia valid in India?",
        answer: "Yes, MD degrees from WHO and WFME approved Georgian state universities are recognized in India, subject to passing the screening test (FMGE/NEXT)."
      },
      {
        question: "What is the primary language spoken in Georgia?",
        answer: "The official language is Georgian, but English is widely spoken in academic circles, and the medical curriculum is taught fully in English."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: false,
    verified: false,
    displayOrder: 9,
    metaTitle: "Study MBBS in Georgia | European Quality MD Degree | CCIC",
    metaDescription: "Pursue MD/MBBS in Georgia at top WFME & NMC approved European universities. Affordable tuition fees, English-medium instructions, and high FMGE success rate.",
    metaKeywords: ["study in georgia", "mbbs in georgia", "medical colleges georgia"],
    focusKeyword: "mbbs in georgia",
    sections: [
      {
        title: "Why Choose Georgia",
        tabName: "Overview",
        content: "<p>Georgia offers European standards of education, high safety, and degrees directly compatible with licensing frameworks in the UK, USA, and across the EU.</p>"
      },
      {
        title: "Georgia Admission Process",
        tabName: "Admission",
        content: "<h2>Georgia Admission Process</h2><ol><li>Apply online with academic records and passport copy.</li><li>Receive university offer letter and pass video interview.</li><li>Ministry of Education approval and issuance of study decree.</li><li>Student visa stamping and enrollment.</li></ol>"
      },
      {
        title: "Georgia Student Visa Guide",
        tabName: "Visa",
        content: "<h2>Georgia Student Visa Guide</h2><p>Student visas (D3 category) are issued based on the official study decree issued by the Georgian Ministry of Education. Stamping takes 3-4 weeks.</p>"
      },
      {
        title: "Georgia Fees and Living Costs",
        tabName: "Fees",
        content: "<h2>Georgia Fees and Living Costs</h2><p>Tuition fees average Rs. 3,50,000 to Rs. 6,00,000 per year. Living expenses average Rs. 15,000 to Rs. 20,000 per month including hostel fees.</p>"
      },
      {
        title: "Popular Courses in Georgia",
        tabName: "Courses",
        content: "<h2>Popular Courses in Georgia</h2><ul><li><strong>MD (General Medicine):</strong> 6-year European standard course.</li><li><strong>Dentistry:</strong> 5-year dental surgery training.</li></ul>"
      }
    ]
  },
  {
    name: "Philippines",
    shortName: "Philippines",
    code: "PHL",
    slug: "philippines",
    capital: "Manila",
    currency: "Philippine Peso (PHP)",
    language: "Filipino, English",
    population: "115 Million",
    timeZone: "UTC+8",
    callingCode: "+63",
    logo: "/uploads/countries/countries_country-logo_philippines.svg",
    banner: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1200",
    brochure: null,
    countryGallery: [
      {
        url: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?q=80&w=1200",
        type: "image"
      }
    ],
    shortDescription: "The Philippines is a top destination for MBBS, offering an American-based medical education system, English as the official language of instruction, and excellent clinical clerkships.",
    longDescription: "<h2>Why Study in the Philippines?</h2><p>The Philippines offers an exceptionally high-quality medical education modeled on the US system. English is the official language of instruction and daily communication, meaning there is zero language barrier. The clinical clerkships provide massive practical exposure to tropical diseases similar to India, which results in very high FMGE success rates. Degrees are recognized by WHO, ECFMG, and NMC.</p><h2>Education System</h2><p>Medical study in the Philippines consists of a BS program followed by a 4-year MD program (MBBS equivalent). The curriculum focuses on problem-based learning and clinical integration.</p><h2>Student Life</h2><p>Indian students enjoy a friendly, tropical lifestyle. Cities are highly active, hostels are comfortable, and Indian food is widely available. The country has a very warm and welcoming culture.</p>",
    quickFacts: [
      { label: "Teaching Medium", value: "Fully English Medium Instruction" },
      { label: "Course Duration", value: "5.5 - 6 Years" },
      { label: "Est. Tuition Fee", value: "Rs. 3.0L - 6.0L / year" },
      { label: "Est. Living Cost", value: "Rs. 1.2L - 1.8L / year" },
      { label: "Primary Intake", value: "September / November" },
      { label: "Medical Recognition", value: "NMC, WHO, ECFMG, CHED" },
      { label: "Official Currency", value: "Philippine Peso (PHP)" },
      { label: "Eligibility Standard", value: "NEET Qualified + Min 50% in PCB (12th)" },
      { label: "Indian Food Mess", value: "Indian Canteen and self-cooking facilities easily accessible" }
    ],
    faqs: [
      {
        question: "Is the BS-MD course structure in the Philippines recognized by NMC?",
        answer: "Yes, current MD pathways aligned with local CHED directives and NMC rules are fully structured to meet the medical registration guidelines."
      },
      {
        question: "Is there a language barrier in the Philippines?",
        answer: "No. The Philippines is the third-largest English-speaking nation in the world. The curriculum and hospital clinical rounds are conducted fully in English."
      }
    ],
    status: "active",
    isFeatured: true,
    isPopular: false,
    verified: false,
    displayOrder: 10,
    metaTitle: "Study MBBS in the Philippines | US Medical Syllabus | CCIC",
    metaDescription: "Pursue MD/MBBS in the Philippines at top medical schools. English-medium programs, American syllabus structure, and high passing percentage in FMGE/NEXT.",
    metaKeywords: ["study in philippines", "mbbs in philippines", "medical colleges philippines"],
    focusKeyword: "mbbs in philippines",
    sections: [
      {
        title: "Why Choose Philippines",
        tabName: "Overview",
        content: "<p>The Philippines stands out for its high-quality American-style education, hands-on clinical exposure to identical tropical diseases, and a 100% English-speaking environment.</p>"
      },
      {
        title: "Philippines Admission Process",
        tabName: "Admission",
        content: "<h2>Philippines Admission Process</h2><ol><li>Register for the BS pathway or submit NMAT score for direct MD entry.</li><li>Apply to CHED-approved medical colleges.</li><li>Receive official notice of acceptance.</li><li>Visa stamping and entry guidelines.</li></ol>"
      },
      {
        title: "Philippines Student Visa Guide",
        tabName: "Visa",
        content: "<h2>Philippines Student Visa Guide</h2><p>Student visas (9F) are stamped by the Philippine Embassy upon university notice of acceptance and police clearance approvals.</p>"
      },
      {
        title: "Philippines Fees and Cost Sheets",
        tabName: "Fees",
        content: "<h2>Philippines Fees and Cost Sheets</h2><p>Tuition fees average Rs. 3,00,000 to Rs. 6,00,000 per year. Living expenses are highly economical, averaging Rs. 10,000 to Rs. 15,000 per month.</p>"
      },
      {
        title: "Popular Courses in the Philippines",
        tabName: "Courses",
        content: "<h2>Popular Courses in the Philippines</h2><ul><li><strong>MD (General Medicine):</strong> 4-year clinical program post-BS.</li><li><strong>BS Biology/Psychology:</strong> Pre-medical foundation courses.</li></ul>"
      }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to remote MongoDB successfully...");

    for (const cData of countriesToSeed) {
      const sections = cData.sections;
      delete cData.sections; // Separate section records

      // 1. Upsert Country record
      const country = await Country.findOneAndUpdate(
        { slug: cData.slug },
        cData,
        { upsert: true, new: true }
      );
      console.log(`Upserted Country: ${country.name} (ID: ${country._id})`);

      // 2. Clear old country sections
      await CountrySection.deleteMany({ country: country._id });
      console.log(`Cleared old sections for ${country.name}`);

      // 3. Save each section document individually to trigger pre-save hooks
      for (let index = 0; index < sections.length; index++) {
        const s = sections[index];
        const sectionDoc = new CountrySection({
          ...s,
          country: country._id,
          displayOrder: index,
          status: "active"
        });
        await sectionDoc.save();
      }
      console.log(`Saved ${sections.length} sections for ${country.name}`);
    }

    console.log("Seeding process completed successfully!");

  } catch (error) {
    console.error("Error during seeding process:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

seed();
