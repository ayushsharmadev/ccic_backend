import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import EligibilityCheck from "@/lib/models/EligibilityCheck";
import { verifyToken } from "@/lib/jwt";

// POST - Create new eligibility check (Public)
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, mobile, course, neetScore, category, tenthPassingYear, intermediateMarks } = body;

    // Validation
    if (!name || !mobile || !course || neetScore === undefined || !category) {
      return NextResponse.json(
        { success: false, error: "All required fields are missing" },
        { status: 400 }
      );
    }

    // Validate mobile number
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    // Validate NEET score
    if (neetScore < 0 || neetScore > 720) {
      return NextResponse.json(
        { success: false, error: "NEET score must be between 0 and 720" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      "UR/EWS",
      "OBC",
      "SC",
      "ST",
      "UR/EWS - PwBD",
      "OBC PwD",
      "SC PwD",
      "ST PwD",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category selected" },
        { status: 400 }
      );
    }

    // Get tracking data
    const ipAddress = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    // Create eligibility check
    const eligibilityCheck = await EligibilityCheck.create({
      name,
      mobile,
      course,
      neetScore: parseFloat(neetScore),
      category,
      tenthPassingYear: tenthPassingYear ? parseInt(tenthPassingYear) : undefined,
      intermediateMarks: intermediateMarks ? parseFloat(intermediateMarks) : undefined,
      ipAddress,
      userAgent,
      referrer,
      source: "eligibility_checker_page",
    });

    return NextResponse.json({
      success: true,
      message: "Eligibility check submitted successfully",
      data: {
        id: eligibilityCheck._id,
        neetScore: eligibilityCheck.neetScore,
      },
    });
  } catch (error) {
    console.error("Error creating eligibility check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit eligibility check",
      },
      { status: 500 }
    );
  }
}

// GET - List eligibility checks (Admin only)
export async function GET(request) {
  try {
    // Verify admin token
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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isEligible = searchParams.get("isEligible") || "";

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Eligibility filter
    if (isEligible !== "") {
      query.isEligible = isEligible === "true";
    }

    const skip = (page - 1) * limit;

    const [checks, totalCount] = await Promise.all([
      EligibilityCheck.find(query)
        .populate("course", "name slug")
        .populate("assignedTo", "firstName lastName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EligibilityCheck.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: checks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching eligibility checks:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch eligibility checks",
      },
      { status: 500 }
    );
  }
}

