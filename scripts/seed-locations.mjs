/**
 * seed-locations.mjs
 * Seeds CountryMaster, States, and Districts from the country-state-city package.
 * Clears old orphaned States/Districts first, then re-seeds with correct CountryMaster refs.
 *
 * Run: node scripts/seed-locations.mjs
 */

import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";

// ── Inline minimal schemas (no Next.js context needed) ──────────────────────

const countryMasterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  status: { type: String, default: "active" },
}, { timestamps: true });

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  country: { type: mongoose.Schema.Types.ObjectId, ref: "CountryMaster", required: true },
  status: { type: String, default: "active" },
}, { timestamps: true });
stateSchema.index({ name: 1, country: 1 }, { unique: true });
stateSchema.index({ code: 1, country: 1 }, { unique: true });

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
  status: { type: String, default: "active" },
}, { timestamps: true });
districtSchema.index({ name: 1, state: 1 }, { unique: true });

const CountryMaster = mongoose.models.CountryMaster || mongoose.model("CountryMaster", countryMasterSchema);
const State        = mongoose.models.State         || mongoose.model("State", stateSchema);
const District     = mongoose.models.District      || mongoose.model("District", districtSchema);

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(emoji, msg) { console.log(`${emoji}  ${msg}`); }

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("🔌", "Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  log("✅", "Connected!");

  // Load country-state-city dataset
  let csc;
  try {
    csc = require("country-state-city");
  } catch {
    console.error("\n❌  'country-state-city' package not found.");
    console.error("    Run:  npm install country-state-city\n");
    process.exit(1);
  }

  const allCountries = csc.Country.getAllCountries();
  const allStates    = csc.State.getAllStates();
  const allCities    = csc.City.getAllCities();

  log("📦", `Loaded ${allCountries.length} countries, ${allStates.length} states, ${allCities.length} cities from dataset`);

  // ── Step 1: Clear old orphaned data ────────────────────────────────────────
  log("🗑️ ", "Clearing old States and Districts...");
  await District.deleteMany({});
  await State.deleteMany({});
  log("✅", "Cleared States and Districts");

  log("🗑️ ", "Clearing old CountryMaster collection...");
  await CountryMaster.deleteMany({});
  log("✅", "Cleared CountryMaster");

  // ── Step 2: Seed CountryMaster ─────────────────────────────────────────────
  log("🌍", `Seeding ${allCountries.length} countries into CountryMaster...`);

  const countryDocs = allCountries.map((c) => ({
    name: c.name,
    code: c.isoCode, // ISO 3166-1 alpha-2 e.g. "IN", "CN"
    status: "active",
  }));

  // Bulk insert — ignore duplicates (won't happen on fresh collection)
  const insertedCountries = await CountryMaster.insertMany(countryDocs, { ordered: false });
  log("✅", `Inserted ${insertedCountries.length} countries`);

  // Build a map: isoCode → MongoDB _id
  const countryIdMap = {};
  const savedCountries = await CountryMaster.find({}).lean();
  for (const c of savedCountries) {
    countryIdMap[c.code] = c._id;
  }

  // ── Step 3: Seed States ────────────────────────────────────────────────────
  log("🏛️ ", `Seeding ${allStates.length} states...`);

  const stateBulk = [];
  for (const s of allStates) {
    const countryId = countryIdMap[s.countryCode];
    if (!countryId) continue; // skip orphan states

    stateBulk.push({
      name: s.name,
      code: s.isoCode || s.name.substring(0, 5).toUpperCase(),
      country: countryId,
      status: "active",
    });
  }

  // Insert in batches of 500 to avoid memory issues
  let statesInserted = 0;
  const STATE_BATCH = 500;
  for (let i = 0; i < stateBulk.length; i += STATE_BATCH) {
    const batch = stateBulk.slice(i, i + STATE_BATCH);
    try {
      const res = await State.insertMany(batch, { ordered: false });
      statesInserted += res.length;
    } catch (e) {
      // ordered:false continues on duplicates; count what was inserted
      statesInserted += (e.result?.nInserted || 0);
    }
  }
  log("✅", `Inserted ~${statesInserted} states`);

  // Build stateId map: "countryCode-stateName" → MongoDB _id
  const stateIdMap = {};
  const savedStates = await State.find({}).lean();
  for (const s of savedStates) {
    const countryCode = Object.keys(countryIdMap).find(
      (k) => String(countryIdMap[k]) === String(s.country)
    );
    if (countryCode) {
      stateIdMap[`${countryCode}-${s.name}`] = s._id;
    }
  }

  // ── Step 4: Seed Districts (Cities) ───────────────────────────────────────
  // ONLY SEED INDIA TO SAVE TIME AND BANDWIDTH
  const allowedCountryCodes = ["IN"];
  let filteredCities = allCities.filter(c => allowedCountryCodes.includes(c.countryCode));
  // Removed the 500 limit so all Indian cities are seeded
  log("🏙️ ", `Seeding ${filteredCities.length} cities/districts (filtered specifically for India)...`);

  const districtBulk = [];
  for (const city of filteredCities) {
    const key = `${city.countryCode}-${city.stateCode}`;
    // Find the matching state by countryCode + stateCode
    const stateDoc = savedStates.find(
      (s) => {
        const cc = Object.keys(countryIdMap).find(
          (k) => String(countryIdMap[k]) === String(s.country)
        );
        return cc === city.countryCode && s.code === city.stateCode;
      }
    );

    if (!stateDoc) continue;

    districtBulk.push({
      name: city.name,
      code: city.stateCode || "",
      state: stateDoc._id,
      status: "active",
    });
  }

  let districtsInserted = 0;
  const DISTRICT_BATCH = 1000;
  for (let i = 0; i < districtBulk.length; i += DISTRICT_BATCH) {
    const batch = districtBulk.slice(i, i + DISTRICT_BATCH);
    try {
      const res = await District.insertMany(batch, { ordered: false });
      districtsInserted += res.length;
    } catch (e) {
      districtsInserted += (e.result?.nInserted || 0);
    }
  }
  log("✅", `Inserted ~${districtsInserted} districts/cities`);

  // ── Done ───────────────────────────────────────────────────────────────────
  log("🎉", "Location seeding complete!");
  log("📊", `Summary:`);
  log("   ", `Countries : ${savedCountries.length}`);
  log("   ", `States    : ~${statesInserted}`);
  log("   ", `Districts : ~${districtsInserted}`);

  await mongoose.connection.close();
  log("🔌", "Connection closed.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
