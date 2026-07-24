import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const currencies = [
  { name: "Indian Rupee", code: "INR", symbol: "\u20B9" },
  { name: "US Dollar", code: "USD", symbol: "$" },
  { name: "Euro", code: "EUR", symbol: "\u20AC" },
  { name: "Pound Sterling", code: "GBP", symbol: "\u00A3" },
  { name: "Chinese Yuan", code: "CNY", symbol: "\u00A5" },
  { name: "Bangladeshi Taka", code: "BDT", symbol: "\u09F3" },
  { name: "Egyptian Pound", code: "EGP", symbol: "E\u00A3" },
  { name: "Russian Ruble", code: "RUB", symbol: "\u20BD" },
  { name: "Nepalese Rupee", code: "NPR", symbol: "\u0930\u0942" },
  { name: "Kazakhstani Tenge", code: "KZT", symbol: "\u20B8" },
  { name: "Kyrgyzstani Som", code: "KGS", symbol: "\u0441\u043E\u043C" },
  { name: "Uzbekistani Som", code: "UZS", symbol: "so\u02BBm" },
  { name: "Georgian Lari", code: "GEL", symbol: "\u20BE" },
  { name: "Philippine Peso", code: "PHP", symbol: "\u20B1" },
];

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

await mongoose.connect(uri);
const collection = mongoose.connection.collection("currencies");
for (const [index, currency] of currencies.entries()) {
  await collection.updateOne(
    { code: currency.code },
    { $set: { ...currency, status: "active", displayOrder: index + 1, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
}
console.log(`Seeded ${currencies.length} currencies.`);
await mongoose.disconnect();
