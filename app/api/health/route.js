import { withAdminAuth } from "@/lib/middleware/auth";
export const GET = withAdminAuth(async () => {
  try {
    return Response.json({
      status: "OK",
      message: "CCIC API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error) {
    return Response.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
});
