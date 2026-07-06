import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import { renderToStream } from "@react-pdf/renderer";
import CollegeBrochurePDFSimple from "@/lib/pdf/CollegeBrochurePDF_Simple";
import { withAdminAuth } from "@/lib/middleware/auth";

// Disable caching for dynamic PDF
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/colleges/[id]/brochure - Generate and download college brochure PDF
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    console.log('Starting brochure generation...');
    await connectDB();
    const { id } = await params;
    console.log('College ID:', id);

    // Fetch college data with all populated fields
    const college = await College.findById(id)
      .populate("country", "name code")
      .populate("state", "name code")
      .populate("district", "name")
      .populate("ownership", "name")
      .populate("affiliation", "name")
      .populate("approvedThrough", "name")
      .populate("facilities", "name icon")
      .populate("hospitalFacilities", "name icon")
      .populate("hostelFacilities", "name icon")
      .populate("courses", "name duration")
      .populate("stream", "name")
      .populate("degreeType", "name shortName")
      .populate("courseDuration", "duration")
      .lean();

    if (!college) {
      console.log('College not found');
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    console.log('College found:', college.name);
    console.log('Starting PDF generation...');

    // Use simple PDF for testing (switch back to CollegeBrochurePDF once working)
    const streamPromise = renderToStream(
      <CollegeBrochurePDFSimple college={college} />
    );

    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout after 30 seconds')), 30000);
    });

    const stream = await Promise.race([streamPromise, timeoutPromise]);

    console.log('PDF stream created, converting to buffer...');

    // Convert stream to buffer with timeout
    const chunks = [];
    let chunkCount = 0;
    for await (const chunk of stream) {
      chunks.push(chunk);
      chunkCount++;
      console.log(`Received chunk ${chunkCount}, size: ${chunk.length}`);
    }
    const buffer = Buffer.concat(chunks);
    console.log('PDF buffer created, size:', buffer.length, 'from', chunkCount, 'chunks');

    // Create filename from college name
    const filename = `${college.name.replace(/[^a-zA-Z0-9]/g, '_')}_Brochure.pdf`;

    // Return PDF response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error("Error generating college brochure:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate brochure",
        details: error.message
      },
      { status: 500 }
    );
  }
});
