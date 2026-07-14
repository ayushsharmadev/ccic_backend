import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import CollegeCourseAllocation from "@/lib/models/CollegeCourseAllocation";
import { renderToStream } from "@react-pdf/renderer";
import CollegeBrochurePDF from "@/lib/pdf/CollegeBrochurePDF";
import { withAdminAuth } from "@/lib/middleware/auth";

// Disable caching for dynamic PDF
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/colleges/[id]/brochure - Generate and download college brochure PDF
export const GET = async (request, { params }) => {
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
      .lean();

    // Fetch allocated courses separately to avoid schema population errors
    const courseAllocation = await CollegeCourseAllocation.findOne({ college: id })
      .populate("assignedCourses.course", "name")
      .populate("assignedCourses.courseDuration", "duration")
      .lean();

    if (courseAllocation && courseAllocation.assignedCourses) {
      college.courses = courseAllocation.assignedCourses.map(ac => ({
        name: ac.course?.name,
        duration: ac.courseDuration?.duration
      }));
    } else {
      college.courses = [];
    }

    if (!college) {
      console.log('College not found');
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    console.log('College found:', college.name);
    console.log('Starting PDF generation...');

    // Use the main, detailed PDF generator
    const streamPromise = renderToStream(
      <CollegeBrochurePDF college={college} />
    );

    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout after 30 seconds')), 30000);
    });

    const stream = await Promise.race([streamPromise, timeoutPromise]);

    console.log('PDF stream created, converting to buffer...');

    // Import Readable at the top or use stream directly
    const { Readable } = require('stream');
    
    // Convert Node.js stream to Web ReadableStream for Next.js response
    const webStream = Readable.toWeb(stream);

    // Create filename from college name
    const filename = `${college.name.replace(/[^a-zA-Z0-9]/g, '_')}_Brochure.pdf`;

    // Return PDF stream directly to client
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
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
};
