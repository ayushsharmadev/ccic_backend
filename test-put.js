const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { userId: "6a2ff54fd16af8eb71360a2a", role: "admin" },
  "APNA_MBBS_PATNA_2025",
  { expiresIn: "1h", issuer: "mbbs", audience: "mbbs-users" }
);

const url = "http://localhost:3001/api/countries/6a3516350e503139f963a3ac";

const payload = {
  name: "India",
  code: "IND",
  capital: "New Delhi",
  currency: "Indian Rupee (INR)",
  language: "Hindi, English",
  population: "1.4 Billion",
  timeZone: "UTC+5:30",
  callingCode: "+91",
  studyMetrics: {
    tuitionFeeMin: 150000,
    tuitionFeeMax: 500000,
    livingCostMin: 10000,
    livingCostMax: 20000,
    courseDuration: "5.5 Years",
    mediumOfTeaching: "English"
  },
  admissionDetails: {
    timeline: "May - July",
    eligibility: "10+2 PCB, NEET Qualfied",
    visaType: "Not Required"
  },
  status: "active"
};

fetch(url, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json().then(data => ({ status: res.status, data })))
  .then(console.log)
  .catch(console.error);
