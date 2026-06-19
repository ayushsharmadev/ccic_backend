import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { College, Course, Exam, News } from "@/lib/models";
import { applyDirectLocationFilters } from "@/lib/locationFilters";

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit")) || 10;
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: { results: [], totalCount: 0 },
      });
    }

    const searchRegex = new RegExp(query.trim(), "i");
    const results = [];

    // Search Colleges
    if (type === "all" || type === "colleges") {
      const collegeFilter = {
        $or: [
          { name: searchRegex },
          { popularName: searchRegex },
          { shortName: searchRegex },
          { location: searchRegex },
          { shortDescription: searchRegex },
          { longDescription: searchRegex },
        ],
        status: "active",
      };
      applyDirectLocationFilters(collegeFilter, { country, state, district });

      const colleges = await College.find(collegeFilter)
        .populate("country", "name code")
        .populate("district", "name")
        .populate("state", "name")
        .populate("ownership", "name")
        .populate("affiliation", "name")
        .select(
          "name popularName shortName estdYear location shortDescription district state ownership affiliation averageFee slug logo banner"
        )
        .limit(type === "colleges" ? limit : Math.ceil(limit / 4))
        .lean();

      colleges.forEach((college) => {
        // Strip HTML tags from description
        const cleanDescription = college.shortDescription
          ? college.shortDescription.replace(/<[^>]*>/g, "").trim()
          : college.popularName || college.shortName || college.name;

        results.push({
          id: college._id.toString(),
          _id: college._id.toString(),
          type: "college",
          title: college.name,
          name: college.name,
          popularName: college.popularName,
          shortName: college.shortName,
          description: cleanDescription,
          url: `/colleges/${college.slug || college._id}`,
          slug: college.slug,
          location: college.location,
          estdYear: college.estdYear,
          fees: college.averageFee || null,
          district: college.district?.name,
          country: college.country?.name,
          state: college.state?.name,
          ownership: college.ownership?.name,
          affiliation: college.affiliation?.name,
          logo: (college.logo && college.logo.trim()) || null,
          banner: (college.banner && college.banner.trim()) || null,
        });
      });
    }

    // Search Courses
    if (type === "all" || type === "courses") {
      const courses = await Course.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { admissionProcess: searchRegex },
          { eligibilityCriteria: searchRegex },
        ],
        status: "active",
      })
        .populate("streamId", "name")
        .populate("degreeId", "name")
        .select("name description averageFee streamId degreeId slug")
        .limit(type === "courses" ? limit : Math.ceil(limit / 4))
        .lean();

      courses.forEach((course) => {
        // Strip HTML tags from description
        const cleanDescription = course.description
          ? course.description.replace(/<[^>]*>/g, "").trim()
          : course.name;

        results.push({
          id: course._id.toString(),
          type: "course",
          title: course.name,
          description: cleanDescription,
          url: `/courses/${course.slug || course._id}`,
          fees: course.averageFee || null,
          stream: course.streamId?.name,
          degree: course.degreeId?.name,
        });
      });
    }

    // Search Exams
    if (type === "all" || type === "exams") {
      const examFilter = {
        $or: [
          { title: searchRegex },
          { examDescription: searchRegex },
          { eligibilityCriteria: searchRegex },
          { purpose: searchRegex },
        ],
        status: "active",
      };
      applyDirectLocationFilters(examFilter, { country, state });

      const exams = await Exam.find(examFilter)
        .populate("examType", "name")
        .populate("examLevel", "name")
        .populate("country", "name code")
        .populate("state", "name")
        .select(
          "title examDescription applicationFee examDate examType examLevel state slug"
        )
        .limit(type === "exams" ? limit : Math.ceil(limit / 4))
        .lean();

      exams.forEach((exam) => {
        // Strip HTML tags from description
        const cleanDescription = exam.examDescription
          ? exam.examDescription.replace(/<[^>]*>/g, "").trim()
          : exam.title;

        results.push({
          id: exam._id.toString(),
          type: "exam",
          title: exam.title,
          description: cleanDescription,
          url: `/exams/${exam.slug || exam._id}`,
          examDate: exam.examDate,
          applicationFee: exam.applicationFee
            ? `₹${exam.applicationFee.toLocaleString()}`
            : null,
          examType: exam.examType?.name,
          examLevel: exam.examLevel?.name,
          country: exam.country?.name,
          state: exam.state?.name,
        });
      });
    }

    // Search News
    if (type === "all" || type === "news") {
      const news = await News.find({
        $or: [
          { title: searchRegex },
          { shortDescription: searchRegex },
          { content: searchRegex },
          { tags: { $in: [searchRegex] } },
        ],
        status: "published",
        isPublished: true,
      })
        .populate("author", "fullName")
        .populate("category", "name")
        .select("title shortDescription slug author category publishedAt tags")
        .limit(type === "news" ? limit : Math.ceil(limit / 4))
        .lean();

      news.forEach((article) => {
        // Strip HTML tags from description
        const cleanDescription = article.shortDescription
          ? article.shortDescription.replace(/<[^>]*>/g, "").trim()
          : article.title;

        results.push({
          id: article._id.toString(),
          type: "news",
          title: article.title,
          description: cleanDescription,
          url: `/news/${article.slug}`,
          author: article.author?.fullName || "Unknown",
          date: article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
            : null,
          category: article.category?.name,
          tags: article.tags,
        });
      });
    }

    // Sort results alphabetically by title (A-Z)
    results.sort((a, b) => {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        results: limitedResults,
        totalCount: limitedResults.length,
        query,
        type,
        filters: {
          country: country || null,
          state: state || null,
          district: district || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search" },
      { status: 500 }
    );
  }
};
