import { withAdminAuth } from "@/lib/middleware/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import NewsletterSubscription from "@/lib/models/NewsletterSubscription";
import { verifyToken } from "@/lib/jwt";

async function requireAdmin(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") {
    return { ok: false, response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true };
}

export const GET = withAdminAuth(async (request, { params }) => {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    await connectDB();
    const subscription = await NewsletterSubscription.findById(params.id).lean();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error retrieving newsletter subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve newsletter subscription",
      },
      { status: 500 }
    );
  }
});

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    await connectDB();
    const deleted = await NewsletterSubscription.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Subscription removed" });
  } catch (error) {
    console.error("Error deleting newsletter subscription:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete newsletter subscription",
      },
      { status: 500 }
    );
  }
}
