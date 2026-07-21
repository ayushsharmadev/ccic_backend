import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Country, College } from "@/lib/models";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "";
    const teachingMediums = searchParams.get("teachingMediums");
    const durations = searchParams.get("durations");
    const feeRanges = searchParams.get("feeRanges");

    const query = { status: "active" };

    // Search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    // Medium of Teaching filter
    if (teachingMediums) {
      const mediumArray = teachingMediums.split(",");
      query["studyMetrics.mediumOfTeaching"] = { $in: mediumArray };
    }

    // Course Duration filter
    if (durations) {
      const durationArray = durations.split(",");
      query["studyMetrics.courseDuration"] = { $in: durationArray };
    }

    // Fee Ranges filter
    if (feeRanges) {
      const ranges = feeRanges.split(",");
      const feeConditions = ranges.map((range) => {
        const [minStr, maxStr] = range.split("-");
        const min = parseInt(minStr);
        const max = maxStr === "Infinity" ? Infinity : parseInt(maxStr);

        return {
          $or: [
            {
              "studyMetrics.tuitionFeeMin": { $lte: max, $gte: min },
            },
            {
              "studyMetrics.tuitionFeeMax": { $lte: max, $gte: min },
            },
          ],
        };
      });

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: feeConditions }];
        delete query.$or;
      } else {
        query.$or = feeConditions;
      }
    }

    // Sorting
    let sortOption = { displayOrder: 1, name: 1 };
    if (sort === "sort-1") {
      // Alphabetically
      sortOption = { name: 1 };
    } else if (sort === "sort-2") {
      // Popularity
      sortOption = { isPopular: -1, displayOrder: 1, name: 1 };
    } else if (sort === "sort-3") {
      // Lowest to Highest Fees
      sortOption = { "studyMetrics.tuitionFeeMin": 1, name: 1 };
    }

    const skip = (page - 1) * limit;

    const countries = await Country.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate({ path: "currency", match: { status: "active" }, select: "name code symbol status" })
      .lean();

    const total = await Country.countDocuments(query);

    // Calculate college count for each country
    const transformedCountries = await Promise.all(
      countries.map(async (country) => {
        const collegeCount = await College.countDocuments({
          country: country._id,
          status: "active"
        });

        return {
          _id: country._id,
          name: country.name,
          slug: country.slug,
          code: country.code,
          capital: country.capital,
          currency: country.currency,
          language: country.language,
          population: country.population,
          logo: country.logo,
          banner: country.banner,
          shortDescription: country.shortDescription,
          studyMetrics: country.studyMetrics,
          isFeatured: country.isFeatured,
          isPopular: country.isPopular,
          collegeCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        countries: transformedCountries,
        pagination: {
          currentPage: page,
          limit,
          totalCount: total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + countries.length < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching countries listing:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries listing", message: error.message },
      { status: 500 }
    );
  }
}
