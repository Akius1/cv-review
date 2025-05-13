/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import { AuthResponse, CVApiResponse } from "@/app/applicant/cv/[id]/page";
import { motion, AnimatePresence } from "framer-motion";

// Import PDFViewer dynamically to avoid SSR issues
const PDFViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

// Initialize Supabase client for storage (client-side)
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ReviewCVPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cv, setCV] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [reviewContent, setReviewContent] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeTab, setActiveTab] = useState<"cv" | "reviews">("cv");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await fetch("/api/auth/check");
        const userData: AuthResponse = await userResponse.json();

        if (userData.authenticated) {
          setUser(userData.user);
          const cvResponse = await fetch(`/api/expert/cv/${params.id}`);
          const cvData: CVApiResponse = await cvResponse.json();

          if (cvData.success) {
            setCV(cvData.cv);
            setReviews(cvData.reviews);
            setResponses(cvData.responses);

            // Generate a signed URL for the PDF from Supabase storage
            if (cvData.cv.file_path) {
              const { data: signed, error } = await supabaseClient.storage
                .from("cvs")
                .createSignedUrl(cvData.cv.file_path, 60);
              if (signed?.signedUrl) {
                setPdfUrl(signed.signedUrl);
              } else {
                console.error("Error generating signed URL:", error);
              }
            }
          }
        }
        // Fetch reviewed CVs
        const reviewedResponse = await fetch(
          `/api/expert/reviewed-cvs?expertId=${userData?.user?.id}`
        );
        const reviewedData: any = await reviewedResponse.json();

        if (reviewedData?.success) {
          setReviews(reviewedData?.cvs);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmitReview = async () => {
    if (!reviewContent.trim()) {
      setSubmitError("Review content cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/expert/submit-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvId: cv.id,
          expertId: user.id,
          content: reviewContent,
        }),
      });

      const data: any = await response.json();

      if (data.success) {
        // Add new review to the list
        setReviews([data.review, ...reviews]);
        setReviewContent("");

        // Update CV status
        setCV({ ...cv, status: "reviewed" });

        // Show success message
        setSuccessMessage("Review submitted successfully!");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/expert/dashboard");
        }, 2000);
      } else {
        setSubmitError(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setSubmitError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResponsesForReview = (reviewId: number) => {
    return responses.filter((response) => response.review_id === reviewId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading CV details...</p>
        </div>
      </div>
    );
  }

  // Fixed formatDate function to handle null or undefined dates
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => router.push("/expert/dashboard")}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    CV Review
                  </motion.h1>
                  {cv && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-gray-500"
                    >
                      Reviewing {cv.first_name} {cv.last_name}&apos;s
                      application
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Tabs on desktop */}
              <div className="hidden md:flex border-b border-gray-200">
                <motion.button
                  whileHover={{
                    backgroundColor:
                      activeTab === "cv" ? "" : "rgba(219, 234, 254, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("cv")}
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg -mb-px ${
                    activeTab === "cv"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  CV Document
                </motion.button>
                <motion.button
                  whileHover={{
                    backgroundColor:
                      activeTab === "reviews" ? "" : "rgba(219, 234, 254, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("reviews")}
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg -mb-px ${
                    activeTab === "reviews"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </motion.button>
              </div>
            </div>

            {/* Mobile tabs */}
            <div className="flex mt-4 bg-gray-100 p-1 rounded-lg md:hidden">
              <button
                onClick={() => setActiveTab("cv")}
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  activeTab === "cv"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500"
                } transition-all duration-200`}
              >
                CV Document
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-2 text-sm font-medium rounded-md ${
                  activeTab === "reviews"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500"
                } transition-all duration-200`}
              >
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {cv ? (
            <div className="space-y-6">
              {/* Applicant Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                  <h2 className="text-lg font-bold text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.352-.035-.696-.1-1.028A5 5 0 0010 11z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Applicant Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                        {cv.first_name?.[0]}
                        {cv.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Full Name</p>
                        <p className="font-medium text-gray-900">
                          {cv.first_name} {cv.last_name}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Email Address</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1 text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        {cv.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Status</p>
                      <div className="mt-1">
                        <motion.span
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                            cv.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : cv.status === "under_review"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full mr-2 ${
                              cv.status === "pending"
                                ? "bg-yellow-400"
                                : cv.status === "under_review"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                          ></span>
                          {cv.status.replace("_", " ").charAt(0).toUpperCase() +
                            cv.status.replace("_", " ").slice(1)}
                        </motion.span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Submitted on {formatDate(cv.created_at)}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Content tabs for mobile */}
              <AnimatePresence mode="wait">
                {activeTab === "cv" && (
                  <motion.div
                    key="cv-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* CV Preview */}
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                        <h2 className="text-lg font-bold text-white flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                          CV Document Preview
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          {!pdfUrl ? (
                            <div className="flex justify-center items-center h-64">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                          ) : (
                            <div className="h-[calc(100vh-22rem)] md:h-[calc(100vh-20rem)]">
                              <PDFViewer fileUrl={pdfUrl} />
                            </div>
                          )}
                          <div className="bg-white p-3 border-t border-gray-200">
                            <p className="text-sm text-gray-500 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0v3H7V4h6zm-5 7a1 1 0 100-2 1 1 0 000 2zm1 2a1 1 0 11-2 0 1 1 0 012 0zm3-2a1 1 0 100-2 1 1 0 000 2zm1 2a1 1 0 11-2 0 1 1 0 012 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              PDF document uploaded on{" "}
                              {new Date(cv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Form */}
                    {cv.status === "pending" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100"
                      >
                        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                          <h2 className="text-lg font-bold text-white flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                              <path
                                fillRule="evenodd"
                                d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Submit Your Review
                          </h2>
                        </div>
                        <div className="p-6">
                          <AnimatePresence>
                            {submitError && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start"
                              >
                                <svg
                                  className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>{submitError}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {successMessage && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start"
                              >
                                <svg
                                  className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>{successMessage}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="space-y-4">
                            <div>
                              <label
                                htmlFor="review"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Review Feedback
                              </label>
                              <div className="relative">
                                <textarea
                                  id="review"
                                  rows={8}
                                  value={reviewContent}
                                  onChange={(e) =>
                                    setReviewContent(e.target.value)
                                  }
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                  placeholder="Provide your detailed feedback on the CV..."
                                ></textarea>
                                {reviewContent.length > 0 && (
                                  <span className="absolute bottom-2 right-2 text-xs text-gray-400">
                                    {reviewContent.length} characters
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmitReview}
                                disabled={isSubmitting || !reviewContent.trim()}
                                className={`px-5 py-2 rounded-lg shadow-sm font-medium text-white 
                                  ${
                                    isSubmitting || !reviewContent.trim()
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                  }
                                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              >
                                {isSubmitting ? (
                                  <span className="flex items-center">
                                    <svg
                                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    Submitting...
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-5 w-5 mr-1"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Submit Review
                                  </span>
                                )}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    key="reviews-content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Previous Reviews */}
                    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4">
                        <h2 className="text-lg font-bold text-white flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path
                              fillRule="evenodd"
                              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Previous Reviews{" "}
                          {reviews.length > 0 && `(${reviews.length})`}
                        </h2>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {reviews.length > 0 ? (
                          reviews.map((review, index) => (
                            <motion.div
                              key={review.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.4 }}
                              className="bg-white transition-all duration-300 hover:bg-gray-50"
                            >
                              {/* Review Header */}
                              <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                  <div className="flex items-center mb-2 md:mb-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                      {
                                        review.applicant_name?.split(
                                          " "
                                        )[0]?.[0]
                                      }
                                      {review.applicant_name?.split(
                                        " "
                                      )[1]?.[0] || ""}
                                    </div>
                                    <div className="ml-3">
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {review.applicant_name ||
                                          `${review.first_name} ${review.last_name}`}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {review.file_name && (
                                          <span className="flex items-center">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-4 w-4 mr-1 text-indigo-500"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                              />
                                            </svg>
                                            {review.file_name}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end">
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm bg-green-100 text-green-800 border border-green-200"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                      {review.status === "reviewed"
                                        ? "Reviewed"
                                        : review.status?.replace("_", " ")}
                                    </motion.div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      {new Date(
                                        review.reviewed_at || review.created_at
                                      ).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* Review Content Card */}
                                <motion.div
                                  whileHover={{
                                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                                  }}
                                  className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-4 transition-all duration-300"
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mt-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-indigo-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                        />
                                      </svg>
                                    </div>
                                    <div className="ml-3 flex-grow">
                                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                                        <span className="mr-2">
                                          Review Feedback
                                        </span>
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-md">
                                          Expert
                                        </span>
                                      </h4>
                                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                                        {review.review_content ||
                                          review.content}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>

                                {/* Applicant Responses */}
                                {getResponsesForReview(review.id).length >
                                  0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="mt-4"
                                  >
                                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1 text-blue-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                        />
                                      </svg>
                                      Applicant Responses
                                    </h4>
                                    <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                                      {getResponsesForReview(review.id).map(
                                        (response, responseIndex) => (
                                          <motion.div
                                            key={response.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                              delay: 0.1 + responseIndex * 0.1,
                                              duration: 0.3,
                                            }}
                                            className="bg-blue-50 p-4 rounded-lg border border-blue-100 hover:shadow-md transition-shadow duration-300"
                                          >
                                            <div className="flex justify-between items-start mb-2">
                                              <span className="font-medium text-sm text-blue-700 flex items-center">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  className="h-4 w-4 mr-1"
                                                  viewBox="0 0 20 20"
                                                  fill="currentColor"
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                                {review.applicant_name ||
                                                  `${review.first_name} ${review.last_name}`}
                                              </span>
                                              <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded-full">
                                                {new Date(
                                                  response.created_at
                                                ).toLocaleString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                            <p className="text-gray-700 whitespace-pre-line">
                                              {response.content}
                                            </p>
                                          </motion.div>
                                        )
                                      )}
                                    </div>
                                  </motion.div>
                                )}

                                {/* No Responses Message */}
                                {getResponsesForReview(review.id).length ===
                                  0 && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-4 text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300"
                                  >
                                    <svg
                                      className="mx-auto h-8 w-8 text-gray-400"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                      />
                                    </svg>
                                    <p className="text-sm text-gray-500 mt-2">
                                      No responses from the applicant yet
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      The applicant will be notified of your
                                      review
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center justify-center py-12 px-6 text-center"
                          >
                            <div className="bg-gray-100 rounded-full p-4 mb-4">
                              <svg
                                className="h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              No reviews yet
                            </h3>
                            <p className="text-gray-500 max-w-md">
                              No reviews have been submitted for this CV. When
                              you submit your review, it will appear here.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setActiveTab("cv")}
                              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Back to CV document
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            ""
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
