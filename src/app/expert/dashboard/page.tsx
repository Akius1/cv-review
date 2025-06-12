/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import type { AuthCheckResponse as AuthCheckUserResponse } from "@/app/applicant/cv/[id]/page";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckBadgeIcon,
  InboxArrowDownIcon,
  ListBulletIcon,
  AcademicCapIcon,
  SparklesIcon,
  InformationCircleIcon,
  CalendarIcon,
  VideoCameraIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

// --- Type Definitions ---
interface CVListItem {
  id: number;
  file_name: string;
  file_path: string;
  status: "pending" | "under_review" | "completed" | string;
  created_at: string;
  user_id: number;
  applicant_name?: string;
  applicant_email?: string;
}

interface CVListApiResponse {
  success: boolean;
  cvs?: CVListItem[];
  error?: string;
  message?: string;
}

interface ExpertUser {
  id: number | string;
  email: string;
  user_type: "expert";
  first_name?: string;
  last_name?: string;
}

// Add availability API response types
interface AvailabilitySlot {
  id: number;
  expert_id: number;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  is_available: boolean;
  max_bookings: number;
  bookings?: {
    id: number;
    status: string;
    applicant_id: number;
    start_time: string;
    end_time: string;
  }[];
}

interface AvailabilityApiResponse {
  success: boolean;
  availability?: AvailabilitySlot[];
  error?: string;
}

// --- Helper Functions ---
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

export default function ExpertDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ExpertUser | null>(null);
  const [pendingCVs, setPendingCVs] = useState<CVListItem[]>([]);
  const [reviewedCVs, setReviewedCVs] = useState<CVListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Expert Dashboard");
  const [upcomingMeetings, setUpcomingMeetings] = useState<number>(0);
  const [availableSlots, setAvailableSlots] = useState<number>(0);

  // Framer Motion variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
    out: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const cardListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  // Function to fetch availability statistics
  const fetchAvailabilityStats = async () => {
    try {
      // Get date range for next 30 days
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split("T")[0];

      const response = await fetch(
        `/api/expert/availability?startDate=${startDate}&endDate=${endDateStr}`
      );

      if (!response.ok) {
        console.warn("Failed to fetch availability stats");
        return { availableSlots: 0, upcomingMeetings: 0 };
      }

      const data: AvailabilityApiResponse = await response.json();

      if (data.success && data.availability) {
        // Calculate available slots (slots with remaining capacity)
        const availableCount = data.availability.filter((slot) => {
          if (!slot.is_available) return false;
          const activeBookings = (slot.bookings || []).filter(
            (booking) => booking.status === "scheduled"
          ).length;
          return activeBookings < slot.max_bookings;
        }).length;

        // Count upcoming meetings (scheduled bookings)
        const upcomingCount = data.availability.reduce(
          (count: number, slot) => {
            const scheduledBookings = (slot.bookings || []).filter(
              (booking) => booking.status === "scheduled"
            ).length;
            return count + scheduledBookings;
          },
          0
        );

        return {
          availableSlots: availableCount,
          upcomingMeetings: upcomingCount,
        };
      }

      return { availableSlots: 0, upcomingMeetings: 0 };
    } catch (error) {
      console.error("Error fetching availability stats:", error);
      return { availableSlots: 0, upcomingMeetings: 0 };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch user data
        const userResponse = await fetch("/api/auth/check");
        if (!userResponse.ok)
          throw new Error(`Auth check failed: ${userResponse.statusText}`);
        const userData: AuthCheckUserResponse = await userResponse.json();

        if (
          userData.authenticated &&
          userData.user &&
          userData.user.user_type === "expert"
        ) {
          setCurrentUser(userData.user as ExpertUser);

          // 2. Fetch pending CVs
          const pendingResponse = await fetch("/api/expert/pending-cvs");
          if (!pendingResponse.ok)
            throw new Error(
              `Fetching pending CVs failed: ${pendingResponse.statusText}`
            );
          const pendingData: CVListApiResponse = await pendingResponse.json();
          if (pendingData.success && pendingData.cvs) {
            setPendingCVs(pendingData.cvs);
          } else {
            console.warn(
              "Failed to load pending CVs:",
              pendingData.error || pendingData.message
            );
            setPendingCVs([]);
          }

          // 3. Fetch reviewed CVs
          const reviewedResponse = await fetch(
            `/api/expert/reviewed-cvs?expertId=${userData.user.id}`
          );
          if (!reviewedResponse.ok)
            throw new Error(
              `Fetching reviewed CVs failed: ${reviewedResponse.statusText}`
            );
          const reviewedData: CVListApiResponse = await reviewedResponse.json();
          if (reviewedData.success && reviewedData.cvs) {
            setReviewedCVs(reviewedData.cvs);
          } else {
            console.warn(
              "Failed to load reviewed CVs:",
              reviewedData.error || reviewedData.message
            );
            setReviewedCVs([]);
          }

          // 4. Fetch real availability statistics
          const stats = await fetchAvailabilityStats();
          setUpcomingMeetings(stats.upcomingMeetings);
          setAvailableSlots(stats.availableSlots);
        } else {
          router.push("/auth/login");
        }
      } catch (err: any) {
        console.error("Error fetching expert dashboard data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout");
      setCurrentUser(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  const handleReviewCV = useCallback(
    (cvId: number) => {
      router.push(`/expert/review/${cvId}`);
    },
    [router]
  );

  const handleViewReview = useCallback(
    (cvId: number) => {
      router.push(`/expert/review/${cvId}?viewMode=true`);
    },
    [router]
  );

  const handleManageAvailability = useCallback(() => {
    router.push("/expert/availability");
  }, [router]);

  const handleViewMeetings = useCallback(() => {
    router.push("/expert/meeting-management");
  }, [router]);

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-t-sky-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full"
          />
          <AcademicCapIcon className="w-10 h-10 text-sky-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // --- Render Error State ---
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4 text-center">
        <InformationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Access Denied or Error
        </h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => router.push("/auth/login")}
          className="flex items-center px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 flex flex-col">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Header
          user={currentUser}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          handleLogout={handleLogout}
        />

        <motion.main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow w-full"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
        >
          {/* Welcome Message & Quick Actions */}
          <motion.section
            className="mb-10 md:mb-12 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 mb-3">
              Welcome, {currentUser?.first_name || "Expert"}!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Here are the CVs awaiting your valuable insights and your review
              history.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <motion.button
                onClick={handleManageAvailability}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 hover:shadow-xl min-w-[200px]"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Manage</div>
                  <div className="text-xs opacity-90">Availability</div>
                </div>
              </motion.button>

              <motion.button
                onClick={handleViewMeetings}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 hover:shadow-xl min-w-[200px]"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <VideoCameraIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">View</div>
                  <div className="text-xs opacity-90">Meetings</div>
                </div>
              </motion.button>
            </div>

            {/* Enhanced Stats Grid - Now with real data */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <motion.div
                className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 text-center border border-white/30 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <InboxArrowDownIcon className="h-6 w-6 text-sky-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-sky-600 mb-1">
                  {pendingCVs.length}
                </p>
                <p className="text-sm text-gray-500">Pending Reviews</p>
              </motion.div>

              <motion.div
                className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 text-center border border-white/30 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckBadgeIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600 mb-1">
                  {reviewedCVs.length}
                </p>
                <p className="text-sm text-gray-500">Reviews Completed</p>
              </motion.div>

              <motion.div
                className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 text-center border border-white/30 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <VideoCameraIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 mb-1">
                  {upcomingMeetings}
                </p>
                <p className="text-sm text-gray-500">Upcoming Meetings</p>
              </motion.div>

              <motion.div
                className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 text-center border border-white/30 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-orange-600 mb-1">
                  {availableSlots}
                </p>
                <p className="text-sm text-gray-500">Available Slots</p>
              </motion.div>
            </div>
          </motion.section>

          {/* CV Sections in a Grid or Vertical Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-start">
            {/* Pending CVs Section */}
            <motion.section
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <InboxArrowDownIcon className="h-8 w-8 text-sky-600 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    CVs Awaiting Your Review
                  </h2>
                </div>
                {pendingCVs.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm"
                  >
                    {pendingCVs.length} pending
                  </motion.span>
                )}
              </div>
              {pendingCVs.length === 0 ? (
                <motion.div
                  className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-8 text-center border border-white/20"
                  variants={cardItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <SparklesIcon className="h-12 w-12 text-sky-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    All Caught Up!
                  </h3>
                  <p className="text-gray-500 mb-6">
                    There are no CVs pending your review at the moment. Great
                    work!
                  </p>
                  <motion.button
                    onClick={handleManageAvailability}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-md"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span>Set Availability</span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-5"
                  variants={cardListVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {pendingCVs.map((cv) => (
                    <motion.div
                      key={cv.id}
                      className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-5 md:p-6 border border-white/30 hover:shadow-2xl transition-shadow duration-300"
                      variants={cardItemVariants}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div className="mb-4 sm:mb-0 flex-grow">
                          <div className="flex items-center mb-1.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                              {cv.applicant_name?.charAt(0) || "?"}
                            </div>
                            <h3
                              className="text-lg font-semibold text-sky-700 truncate"
                              title={cv.applicant_name}
                            >
                              {cv.applicant_name || "N/A"}
                            </h3>
                          </div>
                          <p
                            className="text-xs text-gray-500 mb-2 truncate ml-11"
                            title={cv.applicant_email}
                          >
                            {cv.applicant_email || "No email"}
                          </p>
                          <div className="flex items-center text-sm text-gray-600 mb-1 ml-11">
                            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span className="truncate" title={cv.file_name}>
                              {cv.file_name}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 ml-11">
                            <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            Submitted: {formatDate(cv.created_at)}
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleReviewCV(cv.id)}
                          className="w-full sm:w-auto mt-3 sm:mt-0 flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-60 transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Start Review{" "}
                          <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>

            {/* Reviewed CVs Section */}
            <motion.section
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <ListBulletIcon className="h-8 w-8 text-green-600 mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Your Review History
                  </h2>
                </div>
                {reviewedCVs.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full shadow-sm"
                  >
                    {reviewedCVs.length} completed
                  </motion.span>
                )}
              </div>
              {reviewedCVs.length === 0 ? (
                <motion.div
                  className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-8 text-center border border-white/20"
                  variants={cardItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <CheckBadgeIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    No Reviews Yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Your completed reviews will appear here once you&apos;ve
                    assessed some CVs.
                  </p>
                  <p className="text-sm text-gray-400">
                    Start by reviewing the pending CVs on the left.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-5"
                  variants={cardListVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {reviewedCVs.map((cv) => (
                    <motion.div
                      key={cv.id}
                      className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-5 md:p-6 border border-white/30 hover:shadow-lg transition-shadow duration-300"
                      variants={cardItemVariants}
                      whileHover={{ y: -2 }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div className="mb-4 sm:mb-0 flex-grow">
                          <div className="flex items-center mb-1.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                              {cv.applicant_name?.charAt(0) || "?"}
                            </div>
                            <h3
                              className="text-lg font-semibold text-gray-700 truncate"
                              title={cv.applicant_name}
                            >
                              {cv.applicant_name || "N/A"}
                            </h3>
                          </div>
                          <p
                            className="text-xs text-gray-500 mb-2 truncate ml-11"
                            title={cv.applicant_email}
                          >
                            {cv.applicant_email || "No email"}
                          </p>
                          <div className="flex items-center text-sm text-gray-600 mb-1 ml-11">
                            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            <span className="truncate" title={cv.file_name}>
                              {cv.file_name}
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 ml-11">
                            <CheckBadgeIcon className="h-4 w-4 mr-1.5 text-green-500" />
                            Review Completed: {formatDate(cv.created_at)}
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleViewReview(cv.id)}
                          className="w-full sm:w-auto mt-3 sm:mt-0 flex items-center justify-center px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Review
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          </div>
        </motion.main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
