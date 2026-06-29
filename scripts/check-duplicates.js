const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

async function run() {
  await mongoose.connect(MONGODB_URI);
  
  const College = require("../lib/models/College.js").default || require("../lib/models/College.js");
  const FacilitySection = require("../lib/models/FacilitySection.js").default || require("../lib/models/FacilitySection.js");

  const colleges = await College.find({
    $or: [
      { slug: "aakash-institute-of-medical-sciences" },
      { name: /aakash/i }
    ]
  });

  console.log(`Found ${colleges.length} colleges matching 'aakash':`);
  for (const c of colleges) {
    console.log(`- ID: ${c._id}, Name: "${c.name}", Slug: "${c.slug}"`);
    const sections = await FacilitySection.find({ college: c._id });
    console.log(`  Sections in DB (${sections.length}):`);
    sections.forEach(s => {
      console.log(`    * Section ID: ${s._id}, Tab: "${s.tabName}", Title: "${s.title}"`);
    });
  }

  await mongoose.disconnect();
}

run();
