const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

async function run() {
  await mongoose.connect(MONGODB_URI);

  const College =
    require("../lib/models/College.js").default ||
    require("../lib/models/College.js");

  const college = await College.findOneAndUpdate(
    { slug: "aakash-institute-of-medical-sciences" },
    {
      $set: {
        status: "active",
        isFeatured: true,
        isPopular: true,
        displayOrder: 1,
      },
    },
    { new: true },
  ).select("name slug status isFeatured isPopular displayOrder country");

  if (!college) {
    console.log("Aakash college not found.");
    return;
  }

  console.log("Restored Aakash college visibility:");
  console.log(JSON.stringify(college.toObject(), null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
