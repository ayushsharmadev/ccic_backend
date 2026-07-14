import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import CollegeRanking from "@/lib/models/CollegeRanking";
import Ranking from "@/lib/models/Ranking";
import { withAdminAuth } from "@/lib/middleware/auth";

const normalizeRankingDocument = (rankingDoc) => {
  if (!rankingDoc) return rankingDoc;

  return {
    ...rankingDoc,
    rankings: (rankingDoc.rankings || []).map((item) => {
      const rankingData =
        item.ranking && typeof item.ranking === "object"
          ? item.ranking
          : null;

      return {
        rankingId: rankingData
          ? rankingData._id?.toString() || rankingData.id?.toString() || ""
          : item.ranking?.toString() || "",
        rankingName: rankingData?.name || "",
        rankValue: rankingData?.rankValue || "",
        yearRankings: (item.yearRankings || []).map((yr) => ({
          year: yr.year || new Date().getFullYear(),
          rank: yr.rank || 0,
          outOf: yr.outOf || 0,
          notes: yr.notes || "",
        })),
      };
    }),
  };
};

const populateRankings = async (collegeId) => {
  return CollegeRanking.findOne({ college: collegeId })
    .populate({
      path: "rankings.ranking",
      select: "name rankValue description status",
    })
    .lean()
    .then(normalizeRankingDocument);
};

export const GET = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const rankingDoc = await populateRankings(id);

    return NextResponse.json({
      success: true,
      data: rankingDoc || { college: id, rankings: [] },
    });
  } catch (error) {
    console.error("Error fetching college rankings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch college rankings" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request, { params }) => {
  try {
    await connectDB();

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "College ID is required" },
        { status: 400 }
      );
    }

    const rankings = Array.isArray(body.rankings) ? body.rankings : [];

    if (!rankings.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No rankings provided",
          details: ["Please add at least one ranking"],
        },
        { status: 400 }
      );
    }

    // Validate and sanitize rankings
    const sanitizedRankings = [];
    const errors = [];

    for (let i = 0; i < rankings.length; i++) {
      const item = rankings[i];

      if (!item.ranking) {
        errors.push(`Ranking ${i + 1}: Ranking selection is required`);
        continue;
      }

      const yearRankings = Array.isArray(item.yearRankings)
        ? item.yearRankings
        : [];

      if (!yearRankings.length) {
        errors.push(
          `Ranking ${i + 1}: At least one year ranking is required`
        );
        continue;
      }

      const sanitizedYearRankings = [];

      for (let j = 0; j < yearRankings.length; j++) {
        const yr = yearRankings[j];

        if (!yr.year || yr.year < 2000 || yr.year > 2100) {
          errors.push(
            `Ranking ${i + 1}, Year ${j + 1}: Valid year is required`
          );
          continue;
        }

        if (!yr.rank || yr.rank < 1) {
          errors.push(
            `Ranking ${i + 1}, Year ${j + 1}: Valid rank is required`
          );
          continue;
        }

        if (!yr.outOf || yr.outOf < 1) {
          errors.push(
            `Ranking ${i + 1}, Year ${j + 1}: Valid out of value is required`
          );
          continue;
        }

        if (yr.rank > yr.outOf) {
          errors.push(
            `Ranking ${i + 1}, Year ${j + 1}: Rank cannot be greater than out of value`
          );
          continue;
        }

        sanitizedYearRankings.push({
          year: Number(yr.year),
          rank: Number(yr.rank),
          outOf: Number(yr.outOf),
          notes: yr.notes?.trim() || undefined,
        });
      }

      if (sanitizedYearRankings.length === 0) {
        errors.push(`Ranking ${i + 1}: No valid year rankings provided`);
        continue;
      }

      sanitizedRankings.push({
        ranking: item.ranking,
        yearRankings: sanitizedYearRankings,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Validate that ranking IDs exist
    const rankingIds = [
      ...new Set(sanitizedRankings.map((item) => item.ranking)),
    ];
    const rankingsCount = await Ranking.countDocuments({
      _id: { $in: rankingIds },
      status: "active",
    });

    if (rankingsCount !== rankingIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more selected rankings are invalid or inactive",
        },
        { status: 400 }
      );
    }

    await CollegeRanking.findOneAndUpdate(
      { college: id },
      {
        college: id,
        rankings: sanitizedRankings,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const updatedRankings = await populateRankings(id);

    return NextResponse.json({
      success: true,
      message: "College rankings updated successfully",
      data: updatedRankings,
    });
  } catch (error) {
    console.error("Error saving college rankings:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors || {}).map(
        (err) => err.message
      );
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to save college rankings" },
      { status: 500 }
    );
  }
});
