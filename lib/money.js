import mongoose from "mongoose";
import Country from "@/lib/models/Country";
import Currency from "@/lib/models/Currency";

export function currencyView(currency) {
  if (!currency || typeof currency !== "object") return null;
  return {
    id: currency._id?.toString?.() || currency.id?.toString?.() || null,
    code: currency.code || null,
    name: currency.name || null,
    symbol: currency.symbol || null,
  };
}

export function moneyView(amount, currency) {
  const isAvailable = amount !== null && amount !== undefined;
  return {
    amount: isAvailable ? Number(amount) : null,
    currency: currencyView(currency),
    isAvailable,
    isFree: isAvailable && Number(amount) === 0,
    hasCurrency: Boolean(currency),
  };
}

function invalidMoney(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export async function resolveApplicationFeeFields(body) {
  const rawAmount = body.applicationFee;
  if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
    return { applicationFee: null, applicationFeeCurrency: null };
  }

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw invalidMoney("Application fee must be a non-negative number or null");
  }

  let currencyId =
    body.applicationFeeCurrency?._id || body.applicationFeeCurrency || null;

  if (amount > 0 && !currencyId && mongoose.Types.ObjectId.isValid(body.country)) {
    const country = await Country.findById(body.country).select("currency").lean();
    currencyId = country?.currency || null;
  }

  if (currencyId) {
    if (!mongoose.Types.ObjectId.isValid(currencyId)) {
      throw invalidMoney("Application fee currency is invalid");
    }
    const activeCurrency = await Currency.exists({ _id: currencyId, status: "active" });
    if (!activeCurrency) throw invalidMoney("Application fee currency is invalid or inactive");
  }

  if (amount > 0 && !currencyId) {
    throw invalidMoney("Application fee currency is required when application fee is greater than zero");
  }

  return {
    applicationFee: amount,
    applicationFeeCurrency: currencyId || null,
  };
}
export async function resolveAverageFeeFields(body) {
  const rawAmount = body.averageFee;
  if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
    return { averageFee: null, averageFeeCurrency: null };
  }

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount < 0) {
    throw invalidMoney("Average fee must be a non-negative number or null");
  }

  const currencyId = body.averageFeeCurrency?._id || body.averageFeeCurrency || null;
  if (!currencyId || !mongoose.Types.ObjectId.isValid(currencyId)) {
    throw invalidMoney("Average fee currency is required and must be valid");
  }

  const activeCurrency = await Currency.exists({ _id: currencyId, status: "active" });
  if (!activeCurrency) {
    throw invalidMoney("Average fee currency is invalid or inactive");
  }

  return { averageFee: amount, averageFeeCurrency: currencyId };
}
