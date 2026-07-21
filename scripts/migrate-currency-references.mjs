import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const apply = process.argv.includes("--apply");
const fallbackCode = process.argv.find((arg) => arg.startsWith("--fallback="))?.split("=")[1]?.toUpperCase() || null;
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

await mongoose.connect(uri);
const db = mongoose.connection;
const currencies = await db.collection("currencies").find({}).toArray();
const byCode = new Map(currencies.map((currency) => [currency.code, currency]));
const fallbackCurrency = fallbackCode ? byCode.get(fallbackCode) : null;
if (fallbackCode && !fallbackCurrency) throw new Error(`Fallback currency ${fallbackCode} is not seeded`);
const countryCurrency = new Map();
const countryCodeCurrency = new Map();
const countryCodeToCurrencyCode = new Map([
  ["IND", "INR"], ["USA", "USD"], ["GBR", "GBP"], ["CHN", "CNY"],
  ["BGD", "BDT"], ["EGY", "EGP"], ["RUS", "RUB"], ["NPL", "NPR"],
  ["KAZ", "KZT"], ["KGZ", "KGS"], ["UZB", "UZS"], ["GEO", "GEL"], ["PHL", "PHP"],
  ["IN", "INR"], ["US", "USD"], ["GB", "GBP"], ["CN", "CNY"], ["BD", "BDT"],
  ["EG", "EGP"], ["RU", "RUB"], ["NP", "NPR"], ["KZ", "KZT"], ["KG", "KGS"],
  ["UZ", "UZS"], ["GE", "GEL"], ["PH", "PHP"],
]);
const countryCollectionNames = (await db.db.listCollections({}, { nameOnly: true }).toArray())
  .map((item) => item.name)
  .filter((name) => name.toLowerCase().includes("country"));
const report = { fallbackCurrency: fallbackCode, countryCollections: countryCollectionNames, countriesUpdated: 0, countriesUnmatched: [], coursesUpdated: 0, coursesUnmatched: [], feeStructuresUpdated: 0, feeStructuresUnmatched: [], examsUpdated: 0, positiveExamsUnmatched: [], zeroFeeExamsForReview: 0 };

for await (const country of db.collection("countries").find({})) {
  let currency = null;
  if (country.currency instanceof mongoose.Types.ObjectId) {
    currency = currencies.find((item) => item._id.equals(country.currency));
  } else {
    const match = String(country.currency || "").toUpperCase().match(/\(([A-Z]{3})\)\s*$/);
    currency = match ? byCode.get(match[1]) : null;
  }
  if (!currency) {
    report.countriesUnmatched.push({ id: country._id.toString(), name: country.name, currency: country.currency });
    continue;
  }
  countryCurrency.set(country._id.toString(), currency._id);
  if (country.code) countryCodeCurrency.set(String(country.code).toUpperCase(), currency._id);
  if (!(country.currency instanceof mongoose.Types.ObjectId)) {
    report.countriesUpdated += 1;
    if (apply) await db.collection("countries").updateOne({ _id: country._id }, { $set: { currency: currency._id } });
  }
}

for await (const countryMaster of db.collection("countrymasters").find({})) {
  const code = String(countryMaster.code || "").toUpperCase();
  const mappedCurrencyCode = countryCodeToCurrencyCode.get(code);
  const currencyId = countryCodeCurrency.get(code) || byCode.get(mappedCurrencyCode)?._id || null;
  if (currencyId) countryCurrency.set(countryMaster._id.toString(), currencyId);
}

for await (const course of db.collection("courses").find({ averageFee: { $nin: [null, ""] } })) {
  if (typeof course.averageFee === "number" && course.averageFeeCurrency) continue;
  const amount = Number(String(course.averageFee).replace(/,/g, "").trim());
  if (!Number.isFinite(amount) || amount < 0 || !fallbackCurrency) {
    report.coursesUnmatched.push({
      courseId: course._id.toString(),
      name: course.name || null,
      averageFee: course.averageFee,
      reason: !fallbackCurrency ? "fallback currency is required" : "average fee is not numeric",
    });
    continue;
  }
  report.coursesUpdated += 1;
  if (apply) {
    await db.collection("courses").updateOne(
      { _id: course._id },
      { $set: { averageFee: amount, averageFeeCurrency: fallbackCurrency._id } }
    );
  }
}

const states = await db.collection("states").find({}, { projection: { country: 1 } }).toArray();
const stateCurrencies = new Map(
  states.map((state) => [state._id.toString(), countryCurrency.get(state.country?.toString())])
);
const colleges = await db.collection("colleges").find({}, { projection: { name: 1, country: 1, state: 1 } }).toArray();
const collegeCurrencies = new Map(
  colleges.map((college) => [
    college._id.toString(),
    countryCurrency.get(college.country?.toString()) || stateCurrencies.get(college.state?.toString()),
  ])
);
for await (const allocation of db.collection("collegecourseallocations").find({})) {
  const currencyId = collegeCurrencies.get(allocation.college?.toString()) || fallbackCurrency?._id || null;
  let changed = false;
  for (const course of allocation.assignedCourses || []) {
    for (const structure of course.feeStructures || []) {
      if (!structure.currency && currencyId) {
        structure.currency = currencyId;
        report.feeStructuresUpdated += 1;
        changed = true;
      } else if (!structure.currency) {
        report.feeStructuresUnmatched.push({
          allocationId: allocation._id.toString(),
          collegeId: allocation.college?.toString() || null,
          courseId: course.course?.toString() || null,
          session: structure.session || null,
        });
      }
    }
  }
  if (apply && changed) {
    await db.collection("collegecourseallocations").replaceOne({ _id: allocation._id }, allocation);
  }
}

for await (const exam of db.collection("exams").find({})) {
  if (exam.applicationFee === 0) report.zeroFeeExamsForReview += 1;
  if (!(exam.applicationFee > 0) || exam.applicationFeeCurrency) continue;
  const currencyId =
    countryCurrency.get(exam.country?.toString()) || stateCurrencies.get(exam.state?.toString());
  if (!currencyId) {
    report.positiveExamsUnmatched.push({
      examId: exam._id.toString(),
      title: exam.title || null,
      countryId: exam.country?.toString() || null,
    });
    continue;
  }
  report.examsUpdated += 1;
  if (apply) await db.collection("exams").updateOne({ _id: exam._id }, { $set: { applicationFeeCurrency: currencyId } });
}

const unresolvedReferenceIds = [
  ...new Set([
    ...report.positiveExamsUnmatched.map((item) => item.countryId),
    ...report.feeStructuresUnmatched.map((item) =>
      colleges.find((college) => college._id.toString() === item.collegeId)?.country?.toString() || null
    ),
  ].filter(Boolean)),
].filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
report.unresolvedColleges = report.feeStructuresUnmatched.map((item) => {
  const college = colleges.find((entry) => entry._id.toString() === item.collegeId);
  return college ? { id: college._id.toString(), name: college.name, country: college.country, state: college.state } : { id: item.collegeId, missing: true };
});
report.unresolvedReferenceDetails = {};
for (const collectionName of ["countries", "countrymasters"]) {
  report.unresolvedReferenceDetails[collectionName] = await db.collection(collectionName)
    .find({ _id: { $in: unresolvedReferenceIds } }, { projection: { name: 1, code: 1, currency: 1 } })
    .toArray();
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...report }, null, 2));
await mongoose.disconnect();

