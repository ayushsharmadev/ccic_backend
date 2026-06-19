import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { generateTokenPair } from "@/lib/jwt";

// POST /api/auth/login - User login
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by credentials
    const user = await User.findByCredentials(email, password);

    // Update last login
    user.lastLogin = new Date();
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

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    });
  } catch (error) {
    console.error("Login errors:", error);

    if (error.message === "Invalid login credentials") {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (error.message.includes("Account is temporarily locked")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 423 } // Locked
      );
    }

    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
