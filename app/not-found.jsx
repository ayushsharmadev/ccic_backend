import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <Image
            src="/404 not found.png"
            alt="404 - Page Not Found"
            width={800}
            height={600}
            className="mx-auto w-full max-w-2xl"
            priority
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-white/70 text-base mb-6">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 dark:hover:bg-primary-500 transition-colors"
          >
            Go to Login
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center justify-center px-5 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-white/80 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
