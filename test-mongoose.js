require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://ccic:xsxJHK5wdHZJLxP7@82.25.104.89:27017/ccic');
  
  const Country = require('./lib/models/Country').default || require('./lib/models/Country');
  
  const id = "6a3516350e503139f963a3ac";
  const body = {
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
  
  try {
    const updatedCountry = await Country.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    console.log("SUCCESS:", !!updatedCountry);
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      console.log("VALIDATION FAILED:", errors);
    } else {
      console.error("OTHER ERROR:", error);
    }
  }
  process.exit(0);
}

test();
