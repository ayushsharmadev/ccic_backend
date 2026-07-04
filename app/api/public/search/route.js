import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { College, Country, Course, Exam, News } from "@/lib/models";
import { applyDirectLocationFilters } from "@/lib/locationFilters";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripHtml = (value, fallback = "") =>
  value ? value.replace(/<[^>]*>/g, "").trim() : fallback;

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit")) || 10;
    const country = searchParams.get("country") || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const stream = searchParams.get("stream") || "";
    const examLevel = searchParams.get("examLevel") || "";

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { results: [], totalCount: 0 },
      });
    }

    const searchRegex = new RegExp(escapeRegex(query), "i");
    const perTypeLimit = type === "all" ? Math.max(2, Math.ceil(limit / 5)) : limit;
    const tasks = [];

    if (type === "all" || type === "colleges") {
      const collegeFilter = {
        $or: [
          { name: searchRegex },
          { popularName: searchRegex },
          { shortName: searchRegex },
          { location: searchRegex },
        ],
        status: "active",
      };
      applyDirectLocationFilters(collegeFilter, { country, state, district });

      tasks.push(
        College.find(collegeFilter)
          .populate("country", "name code")
          .populate("district", "name")
          .populate("state", "name")
          .populate("ownership", "name")
          .populate("affiliation", "name")
          .select(
            "name popularName shortName estdYear location shortDescription district state ownership affiliation averageFee slug logo banner"
          )
          .limit(perTypeLimit)
          .lean()
          .then((colleges) =>
            colleges.map((college) => ({
              id: college._id.toString(),
              _id: college._id.toString(),
              type: "college",
              title: college.name,
              name: college.name,
              popularName: college.popularName,
              shortName: college.shortName,
              description: stripHtml(
                college.shortDescription,
                college.popularName || college.shortName || college.name
              ),
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
            }))
          )
      );
    }

    if (type === "all" || type === "countries") {
      tasks.push(
        Country.find({
          $or: [
            { name: searchRegex },
            { shortName: searchRegex },
            { code: searchRegex },
            { capital: searchRegex },
          ],
          status: "active",
        })
          .select(
            "name shortName code capital currency language shortDescription slug logo banner isFeatured isPopular displayOrder"
          )
          .sort({ isPopular: -1, isFeatured: -1, displayOrder: 1, name: 1 })
          .limit(perTypeLimit)
          .lean()
          .then((countries) =>
            countries.map((countryItem) => ({
              id: countryItem._id.toString(),
              type: "country",
              title: countryItem.name,
              name: countryItem.name,
              shortName: countryItem.shortName,
              code: countryItem.code,
              description: stripHtml(
                countryItem.shortDescription,
                `${countryItem.capital} | ${countryItem.language}`
              ),
              url: `/countries/${countryItem.slug || countryItem._id}`,
              slug: countryItem.slug,
              capital: countryItem.capital,
              currency: countryItem.currency,
              language: countryItem.language,
              logo: (countryItem.logo && countryItem.logo.trim()) || null,
              banner: (countryItem.banner && countryItem.banner.trim()) || null,
            }))
          )
      );
    }

    if (type === "all" || type === "courses") {
      tasks.push(
        Course.find({
          name: searchRegex,
          status: "active",
        })
          .populate("streamId", "name")
          .populate("degreeId", "name")
          .select("name description averageFee streamId degreeId slug")
          .limit(perTypeLimit)
          .lean()
          .then((courses) =>
            courses.map((course) => ({
              id: course._id.toString(),
              type: "course",
              title: course.name,
              description: stripHtml(course.description, course.name),
              url: `/courses/${course.slug || course._id}`,
              fees: course.averageFee || null,
              stream: course.streamId?.name,
              degree: course.degreeId?.name,
            }))
          )
      );
    }

    if (type === "all" || type === "exams") {
      const examFilter = {
        title: searchRegex,
        status: "active",
      };
      applyDirectLocationFilters(examFilter, { country, state });
      if (stream) examFilter.stream = stream;
      if (examLevel) examFilter.examLevel = examLevel;

      tasks.push(
        Exam.find(examFilter)
          .populate("examType", "name")
          .populate("examLevel", "name")
          .populate("country", "name code")
          .populate("state", "name")
          .select(
            "title examDescription applicationFee examDate examType examLevel country state slug"
          )
          .limit(perTypeLimit)
          .lean()
          .then((exams) =>
            exams.map((exam) => ({
              id: exam._id.toString(),
              type: "exam",
              title: exam.title,
              description: stripHtml(exam.examDescription, exam.title),
              url: `/exams/${exam.slug || exam._id}`,
              examDate: exam.examDate,
              applicationFee: exam.applicationFee
                ? `INR ${exam.applicationFee.toLocaleString()}`
                : null,
              examType: exam.examType?.name,
              examLevel: exam.examLevel?.name,
              country: exam.country?.name,
              state: exam.state?.name,
            }))
          )
      );
    }

    if (type === "all" || type === "news") {
      tasks.push(
        News.find({
          $or: [{ title: searchRegex }, { tags: { $in: [searchRegex] } }],
          status: "published",
        })
          .populate("author", "fullName")
          .populate("category", "name")
          .select("title shortDescription slug author category publishedAt tags")
          .limit(perTypeLimit)
          .lean()
          .then((news) =>
            news.map((article) => ({
              id: article._id.toString(),
              type: "news",
              title: article.title,
              description: stripHtml(article.shortDescription, article.title),
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
            }))
          )
      );
    }

    const results = (await Promise.all(tasks)).flat();

    results.sort((a, b) => {
      return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    });

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
          stream: stream || null,
          examLevel: examLevel || null,
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
