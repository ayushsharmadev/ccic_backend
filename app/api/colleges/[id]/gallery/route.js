import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import College from "@/lib/models/College";
import { withAdminAuth } from "@/lib/middleware/auth";

// PUT /api/colleges/[id]/gallery - Update college gallery
export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Validate college ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    // Validate gallery type and images
    const { galleryType, images } = body;

    if (
      !galleryType ||
      !["collegeGallery", "hostelGallery", "campusGallery"].includes(
        galleryType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Valid gallery type is required (collegeGallery, hostelGallery, or campusGallery)",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: "Images must be an array" },
        { status: 400 }
      );
    }

    const convertYouTubeUrlToEmbed = (url) => {
      if (!url || typeof url !== "string") return url;

      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(youtubeRegex);

      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }

      return url;
    };

    const normalizedImages = images.map((item) => {
      if (typeof item === "string") {
        return { url: item, type: "image" };
      }
      const url = item.url || item;
      const type = item.type || "image";

      if (type === "video") {
        return {
          url: convertYouTubeUrlToEmbed(url),
          type: "video",
        };
      }

      return {
        url: url,
        type: type,
      };
    });

    const updateData = {
      [galleryType]: normalizedImages,
      updatedAt: new Date(),
    };

    const updatedCollege = await College.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCollege) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "College gallery updated successfully",
      data: {
        id: updatedCollege._id,
        name: updatedCollege.name,
        [galleryType]: updatedCollege[galleryType],
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid college ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update college gallery" },
      { status: 500 }
    );
  }
});

// GET /api/colleges/[id]/gallery - Get college gallery
export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Validate college ID
    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    // Find the college
    const college = await College.findById(id).select(
      "name collegeGallery hostelGallery campusGallery"
    );

    if (!college) {
      return NextResponse.json(
        { success: false, error: "College not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: college._id,
        name: college.name,
        collegeGallery: college.collegeGallery || [],
        hostelGallery: college.hostelGallery || [],
        campusGallery: college.campusGallery || [],
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return NextResponse.json(
        { success: false, error: "Invalid college ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch college gallery" },
      { status: 500 }
    );
  }
});
