import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import Country from "../lib/models/Country.js";
import State from "../lib/models/State.js";
import District from "../lib/models/District.js";
import Ownership from "../lib/models/Ownership.js";
import Affiliation from "../lib/models/Affiliation.js";
import Language from "../lib/models/Language.js";
import ApprovedThrough from "../lib/models/ApprovedThrough.js";
import College from "../lib/models/College.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ccic";
const tempDir = path.join(process.cwd(), "temp");
const uploadsDir = path.join(process.cwd(), "uploads", "colleges");

const countries = {
  bangladesh: {
    stateCode: "BD",
    colleges: [
      {
        name: "Bangladesh Medical College",
        slug: "bangladesh-medical-college-dhaka-bangladesh",
        estdYear: "1986",
        location: "Dhaka, Bangladesh",
        district: "Dhaka",
        state: "Dhaka",
        affiliation: "University of Dhaka",
        ownership: "Private",
        displayOrder: 1,
        logoFile: "bangladesh_medical_college_logo.jpg",
        coverFile: "bangladesh_medical_college.jpg",
        shortDescription:
          "Bangladesh Medical College is a well-known private medical institution in Dhaka with English-medium medical education and strong hospital-linked clinical exposure.",
      },
      {
        name: "Dhaka Medical College",
        slug: "dhaka-medical-college-dhaka-bangladesh",
        estdYear: "1946",
        location: "Dhaka, Bangladesh",
        district: "Dhaka",
        state: "Dhaka",
        affiliation: "University of Dhaka",
        ownership: "Government",
        displayOrder: 2,
        logoFile: "dhaka_medical_logo.jpg",
        coverFile: "dhaka_medical.jpg",
        shortDescription:
          "Dhaka Medical College is one of Bangladesh's most established public medical colleges, known for high patient flow and deep clinical training exposure.",
      },
      {
        name: "Army Medical College Bogura",
        slug: "army-medical-college-bogura-bangladesh",
        estdYear: "2014",
        location: "Bogura, Bangladesh",
        district: "Bogura",
        state: "Rajshahi",
        affiliation: "Bangladesh University of Professionals",
        ownership: "Government",
        displayOrder: 3,
        logoFile: "army_medical_college_bagura_logo.png",
        coverFile: "army_medical_college_bagura.jpg",
        shortDescription:
          "Army Medical College Bogura offers disciplined medical education under an armed-forces academic environment with structured teaching and hospital training.",
      },
      {
        name: "Sir Salimullah Medical College",
        slug: "sir-salimullah-medical-college-dhaka-bangladesh",
        estdYear: "1875",
        location: "Dhaka, Bangladesh",
        district: "Dhaka",
        state: "Dhaka",
        affiliation: "University of Dhaka",
        ownership: "Government",
        displayOrder: 4,
        logoFile: "sir Salimullah Medical College logo.png",
        coverFile: "sir Salimullah Medical College.jpg",
        shortDescription:
          "Sir Salimullah Medical College is a historic medical institution in Dhaka with a long academic legacy and strong clinical learning environment.",
      },
    ],
  },
  egypt: {
    stateCode: "EG",
    colleges: [
      {
        name: "Cairo University Faculty of Medicine",
        slug: "cairo-university-faculty-of-medicine-egypt",
        estdYear: "1827",
        location: "Cairo, Egypt",
        district: "Cairo",
        state: "Cairo",
        affiliation: "Cairo University",
        ownership: "Government",
        displayOrder: 1,
        logoFile: "Cairo University (Faculty of Medicine) logo.jpg",
        coverFile: "Cairo University (Faculty of Medicine).jpg",
        shortDescription:
          "Cairo University Faculty of Medicine, also known as Kasr Al Ainy, is one of the oldest and most respected medical schools in the region.",
      },
      {
        name: "Ain Shams University Faculty of Medicine",
        slug: "ain-shams-university-faculty-of-medicine-egypt",
        estdYear: "1947",
        location: "Cairo, Egypt",
        district: "Cairo",
        state: "Cairo",
        affiliation: "Ain Shams University",
        ownership: "Government",
        displayOrder: 2,
        logoFile: "Ain Shams University (Faculty of Medicine) logo.png",
        coverFile: "Ain Shams University (Faculty of Medicine).jpg",
        shortDescription:
          "Ain Shams University Faculty of Medicine is a major public medical faculty in Cairo with broad academic departments and hospital-based training.",
      },
      {
        name: "Alexandria University Faculty of Medicine",
        slug: "alexandria-university-faculty-of-medicine-egypt",
        estdYear: "1942",
        location: "Alexandria, Egypt",
        district: "Alexandria",
        state: "Alexandria",
        affiliation: "Alexandria University",
        ownership: "Government",
        displayOrder: 3,
        logoFile: "Alexandria University (Faculty of Medicine) logo.jpg",
        coverFile: "Alexandria University (Faculty of Medicine).jpg",
        shortDescription:
          "Alexandria University Faculty of Medicine is a prominent public medical faculty serving students through academic study and coastal-city clinical exposure.",
      },
      {
        name: "Mansoura University Faculty of Medicine",
        slug: "mansoura-university-faculty-of-medicine-egypt",
        estdYear: "1962",
        location: "Mansoura, Egypt",
        district: "Mansoura",
        state: "Dakahlia",
        affiliation: "Mansoura University",
        ownership: "Government",
        displayOrder: 4,
        logoFile: "Mansoura University (Faculty of Medicine) logo.jpg",
        coverFile: "Mansoura University (Faculty of Medicine).jpg",
        shortDescription:
          "Mansoura University Faculty of Medicine is known for strong public medical education, research activity, and hospital-linked training in the Nile Delta region.",
      },
    ],
  },
  russia: {
    stateCode: "RU",
    colleges: [
      {
        name: "I.M. Sechenov First Moscow State Medical University",
        slug: "sechenov-first-moscow-state-medical-university-russia",
        estdYear: "1758",
        location: "Moscow, Russia",
        district: "Moscow",
        state: "Moscow",
        affiliation: "Ministry of Health of the Russian Federation",
        ownership: "Government",
        displayOrder: 1,
        logoFile: "I.M. Sechenov First Moscow State Medical University logo.jpg",
        coverFile: "I.M. Sechenov First Moscow State Medical University.jpg",
        shortDescription:
          "Sechenov University is Russia's oldest medical university and a leading destination for international medical education, research, and clinical training.",
      },
      {
        name: "Kazan Federal University",
        slug: "kazan-federal-university-russia",
        estdYear: "1804",
        location: "Kazan, Russia",
        district: "Kazan",
        state: "Tatarstan",
        affiliation: "Kazan Federal University",
        ownership: "Government",
        displayOrder: 2,
        logoFile: "Kazan Federal University logo.jpg",
        coverFile: "Kazan Federal University.jpg",
        shortDescription:
          "Kazan Federal University is a historic multidisciplinary university with strong medical, science, and research pathways for international students.",
      },
      {
        name: "Bashkir State Medical University",
        slug: "bashkir-state-medical-university-russia",
        estdYear: "1932",
        location: "Ufa, Russia",
        district: "Ufa",
        state: "Bashkortostan",
        affiliation: "Ministry of Health of the Russian Federation",
        ownership: "Government",
        displayOrder: 3,
        logoFile: "Bashkir State Medical University logo.jpg",
        coverFile: "Bashkir State Medical University.jpg",
        shortDescription:
          "Bashkir State Medical University is a recognized Russian medical university offering structured clinical education and international student support.",
      },
      {
        name: "Crimean Federal University",
        slug: "crimean-federal-university-russia",
        estdYear: "1918",
        location: "Simferopol, Russia",
        district: "Simferopol",
        state: "Crimea",
        affiliation: "Crimean Federal University",
        ownership: "Government",
        displayOrder: 4,
        logoFile: "Crimean Federal University logo.png",
        coverFile: "Crimean Federal University.jpg",
        shortDescription:
          "Crimean Federal University offers medical and multidisciplinary programs with an established campus ecosystem and international admission routes.",
      },
    ],
  },
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function copyAsset(fileName, slug, role) {
  const source = path.join(tempDir, fileName);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing temp asset: ${fileName}`);
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(fileName).toLowerCase();
  const targetName = `colleges_college-${role}_${slug}${ext}`;
  const target = path.join(uploadsDir, targetName);

  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }

  return `/uploads/colleges/${targetName}`;
}

async function getOrCreate(Model, filter, data) {
  let record = await Model.findOne(filter);
  if (!record) {
    record = await Model.create(data);
  }
  return record;
}

function longDescriptionFor(college, countryName) {
  return [
    `<h2>${college.name}</h2>`,
    `<p>${college.shortDescription}</p>`,
    `<p>For students comparing study abroad options in ${countryName}, this institution can be reviewed on practical factors such as academic fit, location, admission timeline, documents, budget, hostel support, and post-arrival guidance.</p>`,
    `<h3>What CCIC Helps You Check</h3>`,
    `<ul><li>Program and eligibility fit</li><li>Document readiness and admission process</li><li>Fee planning and living-cost comfort</li><li>Visa, travel, and onboarding support where applicable</li></ul>`,
  ].join("");
}

function limitText(value, max) {
  if (!value || value.length <= max) return value;
  return value.slice(0, max - 3).trimEnd() + "...";
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const english = await getOrCreate(
    Language,
    { name: "English" },
    { name: "English", shortDescription: "English-medium instruction or support available.", status: "active" },
  );
  const who = await getOrCreate(
    ApprovedThrough,
    { name: "WHO" },
    { name: "WHO", description: "World Health Organization recognition reference.", status: "active" },
  );
  const nmc = await getOrCreate(
    ApprovedThrough,
    { name: "NMC" },
    { name: "NMC", description: "National Medical Commission reference for Indian medical aspirants.", status: "active" },
  );

  const cleanupResult = await College.updateMany(
    {
      $or: [
        { name: /^Nepal Medical University \d+$/i },
        { name: /^Egypt Medical University \d+$/i },
        { name: /^Bangladesh Medical University \d+$/i },
        { name: /^Russia Medical University \d+$/i },
      ],
    },
    {
      $set: {
        status: "inactive",
        isFeatured: false,
        isPopular: false,
        displayOrder: 999,
      },
    },
  );
  console.log(`Demoted placeholder/sample colleges: ${cleanupResult.modifiedCount}`);

  for (const [countrySlug, config] of Object.entries(countries)) {
    const country = await Country.findOne({ slug: countrySlug });
    if (!country) {
      console.warn(`Skipping ${countrySlug}: country not found`);
      continue;
    }

    for (const item of config.colleges) {
      const state = await getOrCreate(
        State,
        { name: item.state },
        { name: item.state, code: slugify(item.state).slice(0, 10).toUpperCase(), country: country._id, status: "active" },
      );
      const district = await getOrCreate(
        District,
        { name: item.district, state: state._id },
        { name: item.district, code: slugify(item.district).slice(0, 10).toUpperCase(), state: state._id, status: "active" },
      );
      const ownership = await getOrCreate(
        Ownership,
        { name: item.ownership },
        { name: item.ownership, status: "active" },
      );
      const affiliation = await getOrCreate(
        Affiliation,
        { name: item.affiliation },
        { name: item.affiliation, status: "active" },
      );

      const logo = copyAsset(item.logoFile, item.slug, "logo");
      const banner = copyAsset(item.coverFile, item.slug, "banner");

      const payload = {
        name: item.name,
        popularName: item.name,
        shortName: item.name
          .split(/\s+/)
          .filter((part) => !["of", "and", "the"].includes(part.toLowerCase()))
          .map((part) => part[0])
          .join("")
          .slice(0, 12)
          .toUpperCase(),
        estdYear: item.estdYear,
        ownership: ownership._id,
        affiliation: affiliation._id,
        languages: [english._id],
        approvedThrough: [who._id, nmc._id],
        haveHostel: true,
        haveHospital: true,
        intake: ["September", "October"],
        country: country._id,
        state: state._id,
        district: district._id,
        location: item.location,
        logo,
        banner,
        collegeGallery: [{ url: banner, type: "image" }],
        campusGallery: [{ url: banner, type: "image" }],
        shortDescription: item.shortDescription,
        longDescription: longDescriptionFor(item, country.name),
        status: "active",
        isFeatured: true,
        isPopular: true,
        isVerified: true,
        displayOrder: item.displayOrder,
        slug: item.slug,
        metaTitle: limitText(`${item.name} | Study in ${country.name} | CCIC`, 60),
        metaDescription: limitText(item.shortDescription, 160),
        metaKeywords: [
          item.name.toLowerCase(),
          `study in ${country.name.toLowerCase()}`,
          `${country.name.toLowerCase()} universities`,
          "study abroad counselling",
        ],
        focusKeyword: item.name,
        ogTitle: limitText(`${item.name} | CCIC`, 60),
        ogDescription: limitText(item.shortDescription, 160),
        ogImage: banner,
        twitterTitle: limitText(`${item.name} | CCIC`, 60),
        twitterDescription: limitText(item.shortDescription, 160),
        twitterImage: banner,
      };

      const college = await College.findOneAndUpdate(
        { slug: item.slug },
        { $set: payload },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      );

      console.log(`Upserted ${country.name}: ${college.name}`);
    }
  }

  await mongoose.connection.close();
  console.log("Done");
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
