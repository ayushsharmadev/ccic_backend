import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/lib/models/Contact";
import { verifyToken } from "@/lib/jwt";

// GET - List contacts (Admin only)
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
    const formType = searchParams.get("formType") || "";

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Form type filter (can be comma-separated)
    if (formType) {
      const types = formType.split(",");
      query.formType = { $in: types };
    }

    const skip = (page - 1) * limit;

    const [contacts, totalCount] = await Promise.all([
      Contact.find(query)
        .populate("preferredColleges", "name slug")
        .populate("assignedTo", "firstName lastName username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch contacts",
      },
      { status: 500 }
    );
  }
}

