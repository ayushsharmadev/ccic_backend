const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { userId: "6a2ff54fd16af8eb71360a2a", role: "admin" },
  "APNA_MBBS_PATNA_2025",
  { expiresIn: "1h", issuer: "mbbs", audience: "mbbs-users" }
);

const url = "http://localhost:3001/api/countries";

const payload = {
  name: "Russia",
  code: "RUS",
  capital: "Moscow",
  currency: "Russian Ruble (RUB)",
  language: "Russian",
  population: "144 Million",
  timeZone: "UTC+2 to UTC+12",
  callingCode: "+7",
  studyMetrics: {
    tuitionFeeMin: 200000,
    tuitionFeeMax: 600000,
    livingCostMin: 15000,
    livingCostMax: 25000,
    courseDuration: "6 Years",
    mediumOfTeaching: "English, Russian"
  },
  admissionDetails: {
    timeline: "June - September",
    eligibility: "10+2 PCB 50%, NEET Qualfied",
    visaType: "Student Visa"
  },
  status: "active"
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json().then(data => ({ status: res.status, data })))
  .then(console.log)
  .catch(console.error);
