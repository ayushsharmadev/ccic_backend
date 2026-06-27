const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

async function inspect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Register College model
    const College = require("../lib/models/College.js").default || require("../lib/models/College.js");

    const colleges = await College.find({ logo: { $ne: null } }).limit(5).lean();

    console.log("Colleges with logos:");
    colleges.forEach(c => {
      console.log(`- Name: ${c.name}`);
      console.log(`  Logo: ${c.logo}`);
      console.log(`  Banner: ${c.banner}`);
      console.log(`  Slug: ${c.slug}`);
    });

  } catch (error) {
    console.error("Inspection failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
