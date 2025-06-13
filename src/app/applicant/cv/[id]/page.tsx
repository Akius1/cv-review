/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  EyeIcon, // For viewing CV file
} from "@heroicons/react/24/outline"; // Using outline for a lighter feel
import Link from "next/link";

// --- Type Definitions (ensure these align with your actual backend responses) ---
// Centralized types are ideal, but for this example, they are defined here.
interface CVBase {
  id: number;
  file_name: string;
  file_path: string; // Path to the actual CV file (e.g., PDF URL)
  status: "pending" | "under_review" | "completed" | string; // Specific union types
  created_at: string;
  review_count: number; // Though not directly used in this view, good to keep.
}

interface Review {
  id: number;
  content: string;
  created_at: string;
  first_name?: string; // Reviewer's first name (optional as per backend mapping)
  last_name?: string; // Reviewer's last name (optional)
}

interface UserResponse {
  id: number;
  review_id: number;
  content: string;
  created_at: string;
}

interface AuthenticatedUser {
  id: number | string;
  email: string;
  user_type: "applicant" | "expert";
  first_name?: string;
  last_name?: string;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export interface CVDetailApiResponse {
  success: boolean;
  cv?: CVBase;
  reviews?: Review[];
  responses?: UserResponse[];
  error?: string;
  message?: string;
}

export interface SubmitReviewResponse {
  success: boolean;
  response?: UserResponse;
  error?: string;
  message?: string;
}

// --- Helper Functions & Constants ---
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // e.g., "10:30 AM"
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

const getStatusStyles = (status: CVBase["status"]) => {
  switch (status) {
    case "pending":
      return {
        bgColor: "bg-amber-100",
        textColor: "text-amber-700",
        borderColor: "border-amber-300",
        icon: <ClockIcon className="h-4 w-4 mr-1.5" />,
        text: "Pending Review",
      };
    case "under_review":
      return {
        bgColor: "bg-blue-100",
        textColor: "text-blue-700",
        borderColor: "border-blue-300",
        icon: <InformationCircleIcon className="h-4 w-4 mr-1.5" />,
        text: "Under Review",
      };
    case "completed":
      return {
        bgColor: "bg-emerald-100",
        textColor: "text-emerald-700",
        borderColor: "border-emerald-300",
        icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />,
        text: "Review Completed",
      };
    default:
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
        borderColor: "border-gray-300",
        icon: <DocumentTextIcon className="h-4 w-4 mr-1.5" />,
        text: status.replace("_", " "),
      };
  }
};

export default function CVDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cvId = params.id as string;

  const [cv, setCV] = useState<CVBase | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage content for each review's response textarea
  const [responseContent, setResponseContent] = useState<{
    [key: number]: string;
  }>({});
  // State to control which review's response form is active/open
  const [activeResponseFormReviewId, setActiveResponseFormReviewId] = useState<
    number | null
  >(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Framer Motion variants for page and card transitions
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
    }),
  };

  // Effect to fetch initial data on component mount or cvId change
  useEffect(() => {
    const fetchData = async () => {
      if (!cvId) {
        setIsLoading(false);
        setError("CV ID is missing from the URL.");
        return;
      }
      setIsLoading(true);
      setError(null); // Clear previous errors

      try {
        // 1. Fetch user authentication status
        const userAuthResponse = await fetch("/api/auth/check");
        if (!userAuthResponse.ok) {
          throw new Error(
            `Authentication check failed: ${userAuthResponse.statusText}`
          );
        }
        const userData: AuthCheckResponse = await userAuthResponse.json();

        if (userData.authenticated && userData.user) {
          setCurrentUser(userData.user);

          // 2. Fetch CV details, reviews, and responses
          const cvDetailResponse = await fetch(`/api/cv/${cvId}`);
          if (!cvDetailResponse.ok) {
            throw new Error(
              `Failed to fetch CV details: ${cvDetailResponse.statusText}`
            );
          }
          const cvData: CVDetailApiResponse = await cvDetailResponse.json();

          if (cvData.success) {
            setCV(cvData.cv || null);
            setReviews(cvData.reviews || []);
            setUserResponses(cvData.responses || []);
          } else {
            // If API returns success: false, use its error message
            throw new Error(
              cvData.error || cvData.message || "Could not load CV data."
            );
          }
        } else {
          // If not authenticated, redirect to login (AuthGuard should also handle this)
          router.push("/auth/login");
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(
          err.message || "An unexpected error occurred while fetching data."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [cvId, router]); // Depend on cvId and router

  // Callback to update response content for a specific review
  const handleResponseTextChange = useCallback(
    (reviewId: number, text: string) => {
      setResponseContent((prev) => ({ ...prev, [reviewId]: text }));
    },
    []
  );

  // Callback to toggle the visibility of a review's response form
  const handleToggleResponseForm = useCallback(
    (reviewId: number) => {
      setActiveResponseFormReviewId((prevId) =>
        prevId === reviewId ? null : reviewId
      );
      // Optionally, clear the response content when toggling off
      if (activeResponseFormReviewId === reviewId) {
        setResponseContent((prev) => ({ ...prev, [reviewId]: "" }));
      }
    },
    [activeResponseFormReviewId]
  );

  // Callback to handle submitting a response to a review
  const handleResponseSubmit = useCallback(
    async (reviewId: number) => {
      const content = responseContent[reviewId]?.trim();
      if (!content || !currentUser?.id) {
        // Potentially show a temporary error message to the user
        setError("Response cannot be empty or user not identified.");
        return;
      }

      setIsSubmittingResponse(true);
      setError(null); // Clear previous submission errors

      try {
        const apiResponse = await fetch("/api/review/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId,
            content,
            userId: currentUser.id, // Assuming this is the applicant's ID
          }),
        });

        const data: SubmitReviewResponse = await apiResponse.json();
        if (apiResponse.ok && data.success && data.response) {
          // Add the new response to the existing list
          setUserResponses((prev) => [...prev, data.response!]);
          // Clear the textarea content for the submitted review
          setResponseContent((prev) => {
            const newState = { ...prev };
            delete newState[reviewId];
            return newState;
          });
          setActiveResponseFormReviewId(null); // Close the response form
          // TODO: Implement a success toast notification here (e.g., "Response submitted successfully!")
        } else {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to submit response. Server error."
          );
        }
      } catch (err: any) {
        console.error("Error submitting response:", err);
        setError(
          err.message ||
            "Failed to submit your response. Please check your connection and try again."
        );
        // TODO: Implement an error toast notification here
      } finally {
        setIsSubmittingResponse(false);
      }
    },
    [responseContent, currentUser, setError]
  );

  // Callback to filter responses for a specific review
  const getResponsesForReview = useCallback(
    (reviewId: number) => userResponses.filter((r) => r.review_id === reviewId),
    [userResponses]
  );

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full"
          />
          <DocumentTextIcon className="w-8 h-8 text-purple-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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
          Oops! Something went wrong.
        </h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => router.push("/applicant/dashboard")}
          className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // --- Render CV Not Found State ---
  if (!cv) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4 text-center">
        <DocumentTextIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          CV Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The CV you are looking for could not be found or is no longer
          available.
        </p>
        <button
          onClick={() => router.push("/applicant/dashboard")}
          className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Get status-specific styles for the CV
  const cvStatusInfo = getStatusStyles(cv.status);

  // --- Main Component Render ---
  return (
    <AuthGuard userType="applicant">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
        {/* Animated Background Elements - Consistent with Dashboard */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 right-40 w-60 h-60 bg-gradient-to-r from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Sticky Header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(196, 181, 253, 0.3)",
                  }} // Tailwind purple-100 with opacity
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/applicant/dashboard")}
                  className="p-2.5 rounded-full text-purple-700 hover:bg-purple-100/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </motion.button>
                <div>
                  <h1
                    className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 truncate"
                    title={cv.file_name}
                  >
                    {cv.file_name}
                  </h1>
                  <p className="text-xs text-gray-500">Feedback & Responses</p>
                </div>
              </div>
              {currentUser && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 hidden sm:inline">
                    {currentUser.first_name || "Applicant"}
                  </span>
                  <UserCircleIcon className="h-8 w-8 text-purple-600" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area with Page Transition */}
        <motion.main
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow w-full"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-10">
            {/* CV Info Card */}
            <motion.section
              className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-6 md:p-8 border border-white/30"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              custom={0} // for stagger animation
            >
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-10 w-10 text-purple-600 mr-4 shrink-0" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">
                    CV Overview
                  </h2>
                  <p className="text-sm text-gray-500">
                    Key details about this submission.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                <div>
                  <p className="text-gray-500 mb-0.5">File Name</p>
                  <p
                    className="font-medium text-gray-700 truncate"
                    title={cv.file_name}
                  >
                    {cv.file_name}
                  </p>
                </div>
                <div className="flex items-center">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs md:text-sm shadow-sm border ${cvStatusInfo.bgColor} ${cvStatusInfo.textColor} ${cvStatusInfo.borderColor}`}
                  >
                    {cvStatusInfo.icon}
                    {cvStatusInfo.text}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Uploaded On</p>
                  <p className="font-medium text-gray-700 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {formatDate(cv.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Total Reviews</p>
                  <p className="font-medium text-gray-700 flex items-center">
                    <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {reviews.length} expert review
                    {reviews.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              {/* Optional: View CV File button */}
              {cv.file_path && (
                <div className="mt-8 text-center">
                  <Link
                    href={`/applicant/cv/${cv.id}/view`}
                    passHref
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <EyeIcon className="h-5 w-5 mr-2" />
                    View CV Document
                  </Link>
                </div>
              )}
            </motion.section>

            {/* Reviews Section */}
            <section>
              <div className="flex items-center mb-6 md:mb-8">
                <ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-blue-600 mr-3 shrink-0" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
                    Expert Feedback
                  </h2>
                  <p className="text-gray-600">
                    Insights and suggestions from our professional reviewers.
                  </p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <motion.div
                  className="bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-8 text-center border border-white/20"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  custom={1}
                >
                  <ClockIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    No Reviews Yet
                  </h3>
                  <p className="text-gray-500">
                    Your CV is currently being assessed by our experts. Please
                    check back later for their valuable feedback.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {reviews.map((review, index) => (
                    <motion.article
                      key={review.id}
                      className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/20"
                      variants={cardVariants}
                      initial="initial"
                      animate="animate"
                      custom={index + 1} // Stagger reviews
                    >
                      {/* Review Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 md:px-6 md:py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-1 bg-white/30 rounded-full">
                              <UserCircleIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-base md:text-lg">
                                Review by {review.first_name || "Expert"}{" "}
                                {review.last_name || ""}
                              </h3>
                              <p className="text-xs text-blue-100">
                                {formatDate(review.created_at)}
                              </p>
                            </div>
                          </div>
                          {/* Only show respond button if applicant has not responded yet or allow multiple */}
                          {/* Logic: If there are no responses for this review, show the "Respond" button */}
                          {getResponsesForReview(review.id).length === 0 && (
                            <button
                              onClick={() =>
                                handleToggleResponseForm(review.id)
                              }
                              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-lg font-medium transition-colors duration-200 shadow-sm
                                    ${
                                      activeResponseFormReviewId === review.id
                                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                                        : "bg-white/90 text-blue-700 hover:bg-white"
                                    }`}
                            >
                              {activeResponseFormReviewId === review.id
                                ? "Cancel"
                                : "Respond"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="p-5 md:p-6">
                        <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                          {review.content}
                        </div>
                      </div>

                      {/* Applicant's Responses to this Review */}
                      {getResponsesForReview(review.id).map((res) => (
                        <div
                          key={res.id}
                          className="bg-indigo-50/50 p-4 md:p-5 border-t border-indigo-200"
                        >
                          <div className="flex items-start space-x-3">
                            <UserCircleIcon className="h-7 w-7 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-sm text-indigo-800">
                                  Your Response
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {formatDate(res.created_at)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-line">
                                {res.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Response Form - Animated Toggle */}
                      <AnimatePresence>
                        {activeResponseFormReviewId === review.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="border-t border-gray-200 overflow-hidden"
                          >
                            <div className="p-5 md:p-6">
                              <textarea
                                value={responseContent[review.id] || ""}
                                onChange={(e) =>
                                  handleResponseTextChange(
                                    review.id,
                                    e.target.value
                                  )
                                }
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors text-sm"
                                rows={4}
                                placeholder={`Respond to ${
                                  review.first_name || "Expert"
                                }'s feedback...`}
                                disabled={isSubmittingResponse}
                                aria-label={`Respond to review by ${
                                  review.first_name || "Expert"
                                }`}
                              />
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={() =>
                                    handleResponseSubmit(review.id)
                                  }
                                  disabled={
                                    isSubmittingResponse ||
                                    !responseContent[review.id]?.trim()
                                  }
                                  className="flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-60 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                                >
                                  {isSubmittingResponse ? (
                                    <>
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{
                                          duration: 0.8,
                                          repeat: Infinity,
                                          ease: "linear",
                                        }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                      />
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <PaperAirplaneIcon className="h-4 w-4 mr-2 transform -rotate-45" />
                                      Submit Response
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </motion.main>
        {/* A simple footer can be added here if needed, consistent with the dashboard */}
        {/* <Footer /> */}
      </div>
    </AuthGuard>
  );
}
