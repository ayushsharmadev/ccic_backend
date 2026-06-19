import { NextResponse } from "next/server";
import { generateTokenPair, verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    // Test token generation
    const testPayload = { userId: "test123", role: "admin" };
    const tokens = generateTokenPair(testPayload);

    // Test token verification
    const decoded = verifyToken(tokens.accessToken);

    return NextResponse.json({
      success: true,
      message: "JWT functionality test",
      generated: {
        accessToken: tokens.accessToken.substring(0, 50) + "...",
        refreshToken: tokens.refreshToken.substring(0, 50) + "...",
        expiresIn: tokens.expiresIn,
      },
      verified: {
        userId: decoded.userId,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      },
    });
  } catch (error) {
    console.error("JWT test error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
