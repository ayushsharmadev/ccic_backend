import path from "path";
import fs from "fs";
import mime from "mime-types";
import { NextResponse } from "next/server";

export const GET = async (req, { params }) => {
  try {
    // Next.js 15: params should be awaited
    const resolvedParams = await params;
    const filePath = resolvedParams.path; // array hoga

    // uploads ke andar ka file path
    const file = path.join(process.cwd(), "uploads", ...(Array.isArray(filePath) ? filePath : [filePath]));

    if (fs.existsSync(file)) {
      const mimeType = mime.lookup(file) || "application/octet-stream";

      const stream = fs.createReadStream(file);

      return new NextResponse(stream, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
};
