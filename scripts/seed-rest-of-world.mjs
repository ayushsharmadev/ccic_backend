import mongoose from "mongoose";
import { City } from "country-state-city";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import connectDB from "../lib/db.js";
import District from "../lib/models/District.js";
import State from "../lib/models/State.js";
import CountryMaster from "../lib/models/CountryMaster.js";

const log = (emoji, msg) => console.log(`${emoji} ${msg}`);

async function seedRestOfWorld() {
  try {
    await connectDB();
    log("🔌", "Connected to MongoDB...");

    // Get all states with populated country code
    const states = await State.find({}).populate({ path: "country", select: "code name", model: "CountryMaster" }).lean();
    log("🏛️ ", `Loaded ${states.length} states from DB`);

    const stateMap = {};
    for (const s of states) {
      if (s.country && s.country.code) {
        stateMap[`${s.country.code}-${s.code}`] = s._id;
      }
    }

    const allCities = City.getAllCities();
    // Exclude India because it's already perfectly seeded
    const restOfCities = allCities.filter(c => c.countryCode !== "IN");
    log("🏙️ ", `Preparing to seed ${restOfCities.length} districts for the rest of the world...`);

    const bulk = [];
    for (const city of restOfCities) {
      const stateId = stateMap[`${city.countryCode}-${city.stateCode}`];
      if (stateId) {
        bulk.push({
          name: city.name,
          state: stateId,
          status: "active",
        });
      }
    }

    log("📦", `Total valid districts to insert: ${bulk.length}`);

    // Insert in batches of 2000 for better speed
    const BATCH_SIZE = 2000;
    let insertedCount = 0;
    for (let i = 0; i < bulk.length; i += BATCH_SIZE) {
      const batch = bulk.slice(i, i + BATCH_SIZE);
      await District.insertMany(batch, { ordered: false }).catch(e => {
         // ordered: false will silently skip duplicates if any exist
      });
      insertedCount += batch.length;
      log("⏳", `Inserted batch... (${insertedCount}/${bulk.length})`);
    }

    log("✅", "Rest of the world seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seedRestOfWorld();
