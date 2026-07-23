import { NextResponse, type NextRequest } from "next/server";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:3002",
  "https://ccic-eight.vercel.app",
  "http://100.90.206.34:3000",
  "https://ccic.in"
]);

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  return applyCorsHeaders(NextResponse.next(), origin);
}

export const config = {
  // Large testimonial videos are authenticated and validated by their route.
  // Every other API route keeps the existing middleware behavior.
  matcher: ["/api/((?!testimonials/video-upload(?:/|$)).*)"],
};
