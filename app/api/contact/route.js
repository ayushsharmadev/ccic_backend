import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/lib/models/Contact";

// POST - Create new contact/enquiry
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, phone, email, city, neetScore, course, message, preferredColleges, source, formType, meta } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    // Create contact entry
    const contact = await Contact.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city?.trim() || "",
      neetScore: neetScore || "",
      course: course || "MBBS",
      message: message || "",
      preferredColleges: preferredColleges || [],
      source: source || "other",
      formType: formType || "contact",
      meta: meta || {},
      ipAddress,
      userAgent,
      referrer,
      status: "new",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! We'll contact you soon.",
        data: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating contact:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: messages.join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit enquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}

