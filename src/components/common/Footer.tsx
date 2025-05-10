import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              © 2025 CV Pro. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link
              href="/help"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Help Center
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
