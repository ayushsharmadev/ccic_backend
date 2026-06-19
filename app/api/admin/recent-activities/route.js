import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { withAdminAuth } from "@/lib/middleware/auth";
import College from "@/lib/models/College";
import Course from "@/lib/models/Course";
import Exam from "@/lib/models/Exam";
import User from "@/lib/models/User";
import News from "@/lib/models/News";
import Blog from "@/lib/models/Blog";
import Notice from "@/lib/models/Notice";
import State from "@/lib/models/State";
import District from "@/lib/models/District";

// Get recent activities from various collections
export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const limit = parseInt(request.nextUrl.searchParams.get("limit")) || 10;

    // Fetch recent activities from different collections
    const [
      recentColleges,
      recentUsers,
      recentExams,
      recentCourses,
      recentNews,
      recentBlogs,
      recentNotices,
      recentStates,
      recentDistricts,
    ] = await Promise.all([
      // Recent colleges (created or updated)
      College.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name slug createdAt updatedAt")
        .lean(),

      // Recent users
      User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("firstName lastName username email createdAt")
        .lean(),

      // Recent exams
      Exam.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title createdAt updatedAt")
        .lean(),

      // Recent courses
      Course.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name slug createdAt updatedAt")
        .lean(),

      // Recent news
      News.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title slug createdAt updatedAt")
        .lean(),

      // Recent blogs
      Blog.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title slug createdAt updatedAt")
        .lean(),

      // Recent notices
      Notice.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title createdAt updatedAt")
        .lean(),

      // Recent states
      State.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("name createdAt updatedAt")
        .lean(),

      // Recent districts
      District.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("state", "name")
        .select("name state createdAt updatedAt")
        .lean(),
    ]);

    // Transform all activities into a unified format
    const activities = [];

    // Add college activities
    recentColleges.forEach((college) => {
      const isNew = new Date(college.createdAt).getTime() === new Date(college.updatedAt).getTime();
      activities.push({
        id: `college-${college._id}`,
        type: isNew ? "college_added" : "college_updated",
        title: isNew ? "New MBBS college added" : "MBBS college updated",
        description: `${college.name} was ${isNew ? "added to" : "updated in"} the system`,
        time: college.updatedAt || college.createdAt,
        icon: isNew ? "add" : "edit",
        color: "green",
        href: `/admin/college/edit/${college._id}`,
      });
    });

    // Add user activities
    recentUsers.forEach((user) => {
      const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || user.email;
      activities.push({
        id: `user-${user._id}`,
        type: "user_added",
        title: "New user added",
        description: `${userName} was added to the system`,
        time: user.createdAt,
        icon: "user",
        color: "primary",
        href: `/admin/users/view/${user._id}`,
      });
    });

    // Add exam activities
    recentExams.forEach((exam) => {
      const isNew = new Date(exam.createdAt).getTime() === new Date(exam.updatedAt).getTime();
      activities.push({
        id: `exam-${exam._id}`,
        type: isNew ? "exam_created" : "exam_updated",
        title: isNew ? "New MBBS exam created" : "MBBS exam updated",
        description: `${exam.title} exam ${isNew ? "details added" : "was updated"}`,
        time: exam.updatedAt || exam.createdAt,
        icon: isNew ? "exam" : "edit",
        color: "secondary",
        href: `/admin/exam/edit/${exam._id}`,
      });
    });

    // Add course activities
    recentCourses.forEach((course) => {
      const isNew = new Date(course.createdAt).getTime() === new Date(course.updatedAt).getTime();
      activities.push({
        id: `course-${course._id}`,
        type: isNew ? "course_added" : "course_updated",
        title: isNew ? "New MBBS course added" : "MBBS course updated",
        description: `${course.name} course ${isNew ? "created" : "was updated"}`,
        time: course.updatedAt || course.createdAt,
        icon: isNew ? "course" : "edit",
        color: "secondary",
        href: `/admin/master/course/edit/${course._id}`,
      });
    });

    // Add news activities
    recentNews.forEach((news) => {
      const isNew = new Date(news.createdAt).getTime() === new Date(news.updatedAt).getTime();
      activities.push({
        id: `news-${news._id}`,
        type: isNew ? "news_added" : "news_updated",
        title: isNew ? "New news article added" : "News article updated",
        description: `${news.title} ${isNew ? "was added" : "was updated"}`,
        time: news.updatedAt || news.createdAt,
        icon: isNew ? "news" : "edit",
        color: "primary",
        href: `/admin/news/edit/${news._id}`,
      });
    });

    // Add blog activities
    recentBlogs.forEach((blog) => {
      const isNew = new Date(blog.createdAt).getTime() === new Date(blog.updatedAt).getTime();
      activities.push({
        id: `blog-${blog._id}`,
        type: isNew ? "blog_added" : "blog_updated",
        title: isNew ? "New blog post added" : "Blog post updated",
        description: `${blog.title} ${isNew ? "was added" : "was updated"}`,
        time: blog.updatedAt || blog.createdAt,
        icon: isNew ? "blog" : "edit",
        color: "primary",
        href: `/admin/blogs/edit/${blog._id}`,
      });
    });

    // Add notice activities
    recentNotices.forEach((notice) => {
      const isNew = new Date(notice.createdAt).getTime() === new Date(notice.updatedAt).getTime();
      activities.push({
        id: `notice-${notice._id}`,
        type: isNew ? "notice_added" : "notice_updated",
        title: isNew ? "New notice added" : "Notice updated",
        description: `${notice.title} ${isNew ? "was added" : "was updated"}`,
        time: notice.updatedAt || notice.createdAt,
        icon: isNew ? "notice" : "edit",
        color: "primary",
        href: `/admin/notices`,
      });
    });

    // Add state activities
    recentStates.forEach((state) => {
      const isNew = new Date(state.createdAt).getTime() === new Date(state.updatedAt).getTime();
      activities.push({
        id: `state-${state._id}`,
        type: isNew ? "state_added" : "state_updated",
        title: isNew ? "New state added" : "State information updated",
        description: isNew
          ? `${state.name} was added to the system`
          : `Updated information for ${state.name}`,
        time: state.updatedAt || state.createdAt,
        icon: isNew ? "location" : "edit",
        color: "primary",
        href: `/admin/location/state`,
      });
    });

    // Add district activities
    recentDistricts.forEach((district) => {
      const isNew = new Date(district.createdAt).getTime() === new Date(district.updatedAt).getTime();
      const stateName = district.state?.name || "";
      activities.push({
        id: `district-${district._id}`,
        type: isNew ? "district_added" : "district_updated",
        title: isNew ? "New district added" : "District information updated",
        description: isNew
          ? `${district.name}, ${stateName} was added`
          : `Updated district count for ${stateName}`,
        time: district.updatedAt || district.createdAt,
        icon: isNew ? "location" : "edit",
        color: "primary",
        href: `/admin/location/district`,
      });
    });

    // Sort all activities by time (most recent first) and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, limit);

    // Format time for display
    const formattedActivities = limitedActivities.map((activity) => {
      const timeAgo = getTimeAgo(new Date(activity.time));
      return {
        ...activity,
        time: timeAgo,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent activities" },
      { status: 500 }
    );
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
}

