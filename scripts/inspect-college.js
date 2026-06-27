const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

async function inspect() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Dynamically register models
    require("../lib/models/Country.js");
    require("../lib/models/CountryMaster.js");
    require("../lib/models/State.js");
    require("../lib/models/District.js");
    require("../lib/models/Ownership.js");
    require("../lib/models/Affiliation.js");
    require("../lib/models/Language.js");
    require("../lib/models/ApprovedThrough.js");
    require("../lib/models/CollegeFacility.js");
    require("../lib/models/HospitalFacility.js");
    require("../lib/models/HostelFacility.js");
    const College = require("../lib/models/College.js").default || require("../lib/models/College.js");

    const college = await College.findById("6a3b8795f9835ce9f0bb89af")
      .populate("country")
      .populate("state")
      .populate("district")
      .populate("ownership")
      .populate("affiliation")
      .populate("languages")
      .populate("approvedThrough")
      .populate("facilities")
      .populate("hospitalFacilities")
      .populate("hostelFacilities")
      .lean();

    if (!college) {
      console.log("College 6a3b8795f9835ce9f0bb89af not found!");
      return;
    }

    console.log("Current College Data:", JSON.stringify(college, null, 2));

  } catch (error) {
    console.error("Inspection failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
