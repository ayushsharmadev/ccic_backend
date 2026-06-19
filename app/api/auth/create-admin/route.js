import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { generateTokenPair } from "@/lib/jwt";

// POST /api/auth/create-admin - Create first admin user
export async function POST(request) {
  try {
    await connectDB();

    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin user already exists" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { username, email, password, firstName, lastName, phoneNumber } =
      body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { success: false, error: "Email already registered" },
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { success: false, error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Create admin user
    const userData = {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: "admin", // Admin role
    };

    const user = new User(userData);
    await user.save();

    // Generate tokens
    const tokenPair = generateTokenPair({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // Remove sensitive data from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Admin user created successfully",
        data: {
          user: userResponse,
          tokens: tokenPair,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin creation error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { success: false, error: `${field} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Admin creation failed" },
      { status: 500 }
    );
  }
}
