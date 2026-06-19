import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { withAdminAuth } from "@/lib/middleware/auth";
import {
  College,
  User,
  Course,
  Exam,
  News,
  Blog,
  State,
  District,
  Country,
  Page,
  Testimonial,
  CollegeReview,
  Language,
  DistanceMeter,
} from "@/lib/models";
import Notice from "@/lib/models/Notice";
import FooterSection from "@/lib/models/FooterSection";

// Sidebar menu items structure (matches Sidebar.jsx)
const menuItems = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/admin/dashboard",
    type: "single",
  },
  {
    id: "users",
    name: "Users",
    href: "/admin/users",
    type: "single",
  },
  {
    id: "location",
    name: "Location Directory",
    type: "dropdown",
    children: [
      { name: "Country", href: "/admin/location/country" },
      { name: "State", href: "/admin/location/state" },
      { name: "District", href: "/admin/location/district" },
    ],
  },
  {
    id: "master",
    name: "Master Data",
    type: "dropdown",
    children: [
      { name: "Stream", href: "/admin/master/stream" },
      { name: "Degree Type", href: "/admin/master/degree" },
      { name: "Course", href: "/admin/master/course" },
      { name: "Course Duration", href: "/admin/master/course-duration" },
      { name: "Affiliation Name", href: "/admin/master/affilication" },
      { name: "Approved Through", href: "/admin/master/approved-through" },
      { name: "Exam Type", href: "/admin/master/exam-type" },
      { name: "Ranking", href: "/admin/master/ranking" },
      { name: "Ownership", href: "/admin/master/ownership" },
      { name: "College-Facilities", href: "/admin/master/college-facility" },
      { name: "Hospital-Facilities", href: "/admin/master/hospital-facility" },
      { name: "Hostel-Facilities", href: "/admin/master/hostel-facility" },
      { name: "Language", href: "/admin/languages" },
      { name: "Distance Meter", href: "/admin/distance-meters" },
    ],
  },
  {
    id: "college",
    name: "College Master",
    type: "dropdown",
    children: [
      { name: "Add College", href: "/admin/college/add" },
      { name: "College List", href: "/admin/college" },
    ],
  },
  {
    id: "news",
    name: "News Management",
    type: "dropdown",
    children: [
      { name: "Categories", href: "/admin/news-categories" },
      { name: "Add News", href: "/admin/news/add" },
      { name: "News List", href: "/admin/news" },
    ],
  },
  {
    id: "pages",
    name: "Page Master",
    type: "dropdown",
    children: [
      { name: "Categories", href: "/admin/page-categories" },
      { name: "Add Page", href: "/admin/pages/create" },
      { name: "Pages List", href: "/admin/pages" },
    ],
  },
  {
    id: "notices",
    name: "Global Notices",
    href: "/admin/notices",
    type: "single",
  },
  {
    id: "enquiries",
    name: "Enquiry Master",
    type: "dropdown",
    children: [
      { name: "Student Enquiries", href: "/admin/enquiries/students" },
      { name: "Contact Enquiries", href: "/admin/enquiries/contacts" },
      { name: "Eligibility Checks", href: "/admin/enquiries/eligibility-checks" },
      { name: "Newsletter Subscribers", href: "/admin/enquiries/newsletter-subscriptions" },
    ],
  },
  {
    id: "blogs",
    name: "Blog Management",
    type: "dropdown",
    children: [
      { name: "Categories", href: "/admin/blog-categories" },
      { name: "Add Blog", href: "/admin/blogs/add" },
      { name: "Blogs List", href: "/admin/blogs" },
    ],
  },
  {
    id: "testimonials",
    name: "Testimonials",
    type: "dropdown",
    children: [
      { name: "Add Testimonial", href: "/admin/testimonials/add" },
      { name: "Testimonials List", href: "/admin/testimonials" },
    ],
  },
  {
    id: "exam",
    name: "Exam Master",
    type: "dropdown",
    children: [
      { name: "Exam Level", href: "/admin/exam/level" },
      { name: "Add Exam", href: "/admin/exam/add" },
      { name: "Exam List", href: "/admin/exam" },
    ],
  },
  {
    id: "reviews",
    name: "Reviews",
    href: "/admin/reviews",
    type: "single",
  },
  {
    id: "footer",
    name: "Footer Management",
    type: "dropdown",
    children: [
      { name: "Sections", href: "/admin/footer-sections" },
    ],
  },
];

const menuKeywords = {
  dashboard: ["home", "main", "overview", "stats", "statistics", "analytics"],
  users: ["user", "accounts", "members", "people", "admin", "staff"],
  location: ["location", "place", "state", "district", "region", "area", "city"],
  master: ["master", "settings", "config", "configuration", "data", "stream", "degree", "course", "facility", "facilities", "affiliation", "ownership", "ranking", "language", "distance meter"],
  college: ["college", "colleges", "institute", "institution", "add college", "college list", "colleges list"],
  news: ["news", "article", "articles", "announcement", "announcements", "add news", "news list"],
  pages: ["page", "pages", "content", "add page", "page list", "pages list"],
  notices: ["notice", "notices", "notification", "notifications", "alert", "alerts", "global notice"],
  enquiries: ["enquiry", "enquiries", "inquiry", "inquiries", "contact", "student", "eligibility", "newsletter", "subscriber"],
  blogs: ["blog", "blogs", "post", "posts", "article", "add blog", "blog list"],
  testimonials: ["testimonial", "testimonials", "review", "reviews", "feedback", "add testimonial"],
  exam: ["exam", "exams", "examination", "test", "tests", "add exam", "exam list", "exam level"],
  reviews: ["review", "reviews", "rating", "ratings", "feedback", "comment", "comments"],
  footer: ["footer", "footers", "section", "sections", "link", "links"],
};

export const GET = withAdminAuth(async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit")) || 10;

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: { results: [], totalCount: 0 },
      });
    }

    const searchRegex = new RegExp(query.trim(), "i");
    const results = [];

    // Search Colleges
    const colleges = await College.find({
      $or: [
        { name: searchRegex },
        { popularName: searchRegex },
        { shortName: searchRegex },
        { location: searchRegex },
      ],
    })
      .select("name popularName slug _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    colleges.forEach((college) => {
      // Use public view URL with slug, fallback to ID if slug not available
      const collegeUrl = college.slug
        ? `/colleges/${college.slug}`
        : `/colleges/${college._id}`;

      results.push({
        id: college._id.toString(),
        type: "college",
        title: college.name || college.popularName || college.shortName,
        description: "College",
        url: collegeUrl,
        icon: "college",
      });
    });

    // Search Users
    const users = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("firstName lastName username email _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    users.forEach((user) => {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ");
      results.push({
        id: user._id.toString(),
        type: "user",
        title: fullName || user.username || user.email,
        description: user.email || "User",
        url: `/admin/users/view/${user._id}`,
        icon: "user",
      });
    });

    // Search Courses
    const courses = await Course.find({
      $or: [{ name: searchRegex }, { description: searchRegex }],
    })
      .select("name slug _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    courses.forEach((course) => {
      results.push({
        id: course._id.toString(),
        type: "course",
        title: course.name,
        description: "Course",
        url: `/admin/master/course/edit/${course._id}`,
        icon: "course",
      });
    });

    // Search Exams
    const exams = await Exam.find({
      $or: [{ title: searchRegex }, { examDescription: searchRegex }],
    })
      .select("title slug _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    exams.forEach((exam) => {
      results.push({
        id: exam._id.toString(),
        type: "exam",
        title: exam.title,
        description: "Exam",
        url: `/admin/exam/edit/${exam._id}`,
        icon: "exam",
      });
    });

    // Search News
    const news = await News.find({
      $or: [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { content: searchRegex },
      ],
    })
      .select("title slug _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    news.forEach((article) => {
      results.push({
        id: article._id.toString(),
        type: "news",
        title: article.title,
        description: "News Article",
        url: `/admin/news/edit/${article._id}`,
        icon: "news",
      });
    });

    // Search Blogs
    const blogs = await Blog.find({
      $or: [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { content: searchRegex },
      ],
    })
      .select("title slug _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    blogs.forEach((blog) => {
      results.push({
        id: blog._id.toString(),
        type: "blog",
        title: blog.title,
        description: "Blog Post",
        url: `/admin/blogs/edit/${blog._id}`,
        icon: "blog",
      });
    });

    // Search Notices
    const notices = await Notice.find({
      $or: [{ title: searchRegex }, { content: searchRegex }],
    })
      .select("title _id college")
      .populate("college", "_id")
      .limit(Math.ceil(limit / 6))
      .lean();

    notices.forEach((notice) => {
      results.push({
        id: notice._id.toString(),
        type: "notice",
        title: notice.title,
        description: "Notice",
        url: notice.college
          ? `/admin/college/notices/${notice.college._id || notice.college}/edit/${notice._id}`
          : `/admin/notices`,
        icon: "notice",
      });
    });

    // Search Countries
    const countries = await Country.find({
      $or: [{ name: searchRegex }, { code: searchRegex }],
    })
      .select("name _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    countries.forEach((country) => {
      results.push({
        id: country._id.toString(),
        type: "country",
        title: country.name,
        description: "Country",
        url: `/admin/location/country/edit/${country._id}`,
        icon: "location",
      });
    });

    // Search States
    const states = await State.find({
      name: searchRegex,
    })
      .select("name _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    states.forEach((state) => {
      results.push({
        id: state._id.toString(),
        type: "state",
        title: state.name,
        description: "State",
        url: `/admin/location/state/edit/${state._id}`,
        icon: "location",
      });
    });

    // Search Districts
    const districts = await District.find({
      name: searchRegex,
    })
      .select("name _id")
      .limit(Math.ceil(limit / 6))
      .lean();

    districts.forEach((district) => {
      results.push({
        id: district._id.toString(),
        type: "district",
        title: district.name,
        description: "District",
        url: `/admin/location/district/edit/${district._id}`,
        icon: "location",
      });
    });

    // Search Pages
    const pages = await Page.find({
      $or: [
        { title: searchRegex },
        { heading: searchRegex },
        { shortDescription: searchRegex },
      ],
    })
      .select("title slug _id")
      .limit(Math.ceil(limit / 10))
      .lean();

    pages.forEach((page) => {
      results.push({
        id: page._id.toString(),
        type: "page",
        title: page.title,
        description: "Page",
        url: `/admin/pages/edit/${page._id}`,
        icon: "page",
      });
    });

    // Search Testimonials
    const testimonials = await Testimonial.find({
      $or: [
        { name: searchRegex },
        { designation: searchRegex },
        { comment: searchRegex },
      ],
    })
      .select("name designation _id")
      .limit(Math.ceil(limit / 10))
      .lean();

    testimonials.forEach((testimonial) => {
      results.push({
        id: testimonial._id.toString(),
        type: "testimonial",
        title: testimonial.name || "Testimonial",
        description: testimonial.designation || "Testimonial",
        url: `/admin/testimonials/edit/${testimonial._id}`,
        icon: "testimonial",
      });
    });

    // Search Reviews
    const reviews = await CollegeReview.find({
      $or: [
        { reviewerName: searchRegex },
        { comment: searchRegex },
        { title: searchRegex },
      ],
    })
      .select("reviewerName title _id")
      .limit(Math.ceil(limit / 10))
      .lean();

    reviews.forEach((review) => {
      results.push({
        id: review._id.toString(),
        type: "review",
        title: review.title || review.reviewerName || "Review",
        description: review.reviewerName || "College Review",
        url: `/admin/reviews`,
        icon: "review",
      });
    });

    // Search Languages
    const languages = await Language.find({
      $or: [{ name: searchRegex }, { shortDescription: searchRegex }],
    })
      .select("name _id")
      .limit(Math.ceil(limit / 10))
      .lean();

    languages.forEach((language) => {
      results.push({
        id: language._id.toString(),
        type: "language",
        title: language.name,
        description: "Language",
        url: `/admin/languages/edit/${language._id}`,
        icon: "language",
      });
    });

    // Search Distance Meters
    const distanceMeters = await DistanceMeter.find({
      $or: [{ name: searchRegex }, { shortDescription: searchRegex }],
    })
      .select("name _id")
      .limit(Math.ceil(limit / 10))
      .lean();

    distanceMeters.forEach((distanceMeter) => {
      results.push({
        id: distanceMeter._id.toString(),
        type: "distance-meter",
        title: distanceMeter.name,
        description: "Distance Meter",
        url: `/admin/distance-meters/edit/${distanceMeter._id}`,
        icon: "distance",
      });
    });

    // Search Footer Sections
    const footerSections = await FooterSection.find({
      title: searchRegex,
    })
      .select("title _id")
      .limit(Math.ceil(limit / 10))
      .lean();

    footerSections.forEach((section) => {
      results.push({
        id: section._id.toString(),
        type: "footer-section",
        title: section.title,
        description: "Footer Section",
        url: `/admin/footer-sections/edit/${section._id}`,
        icon: "footer",
      });
    });

    // Search Sidebar Menu Items
    menuItems.forEach((item) => {
      const itemKeywords = menuKeywords[item.id] || [];
      const allKeywords = [item.name, ...itemKeywords].filter(Boolean);
      const matchesName = item.name && searchRegex.test(item.name);
      const matchesKeyword = allKeywords.some(keyword => searchRegex.test(keyword));

      if (matchesName || matchesKeyword) {
        if (item.type === "single" && item.href) {
          results.push({
            id: `menu-${item.id}`,
            type: "menu",
            title: item.name,
            description: "Menu",
            url: item.href,
            icon: "menu",
          });
        } else if (item.type === "dropdown" && item.children) {
          // Add parent menu
          if (item.children.length > 0) {
            results.push({
              id: `menu-${item.id}`,
              type: "menu",
              title: item.name,
              description: "Menu",
              url: item.children[0].href, // Navigate to first child
              icon: "menu",
            });
          }
        }
      }

      if (item.children) {
        item.children.forEach((child) => {
          const childNameLower = child.name?.toLowerCase() || "";
          const matchesChildName = child.name && searchRegex.test(child.name);
          const matchesParentKeyword = allKeywords.some(keyword => {
            const keywordLower = keyword.toLowerCase();
            return searchRegex.test(keyword) && (
              childNameLower.includes(keywordLower) ||
              keywordLower.includes(childNameLower) ||
              (keywordLower === "add" && childNameLower.includes("add")) ||
              (keywordLower === "list" && childNameLower.includes("list"))
            );
          });

          if (matchesChildName || matchesParentKeyword) {
            results.push({
              id: `menu-${item.id}-${child.name}`,
              type: "menu",
              title: child.name,
              description: item.name || "Menu",
              url: child.href,
              icon: "menu",
            });
          }
        });
      }
    });

    // Sort results by title alphabetically
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
      },
    });
  } catch (error) {
    console.error("Error in admin search API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search" },
      { status: 500 }
    );
  }
});

