import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import NewsletterSubscription from "@/lib/models/NewsletterSubscription";
import { verifyToken } from "@/lib/jwt";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();
    const source = body?.source?.trim() || "footer";
    const meta = body?.meta || {};

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await NewsletterSubscription.findOne({ email });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed to our updates",
        data: {
          id: existing._id,
          email: existing.email,
          alreadySubscribed: true,
        },
      });
    }

    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    const subscription = await NewsletterSubscription.create({
      email,
      source,
      meta,
      ipAddress,
      userAgent,
      referrer,
    });

    return NextResponse.json({
      success: true,
      message: "Thanks for subscribing!",
      data: {
        id: subscription._id,
        email: subscription.email,
        alreadySubscribed: false,
      },
    });
  } catch (error) {
    console.error("Error creating newsletter subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save subscription",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page"), 10) || 1;
    const limit = parseInt(searchParams.get("limit"), 10) || 10;
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const query = {};
    if (search) {
      query.email = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [subscriptions, totalCount] = await Promise.all([
      NewsletterSubscription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterSubscription.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching newsletter subscriptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch newsletter subscriptions",
      },
      { status: 500 }
    );
  }
}
