/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
// Define types locally for the expert review functionality
interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: number | string;
    email: string;
    user_type: "expert" | "applicant";
    first_name?: string;
    last_name?: string;
  };
}

interface CVApiResponse {
  success: boolean;
  cv?: {
    id: number;
    file_name: string;
    file_path: string;
    status: string;
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  reviews?: any[];
  responses?: any[];
  error?: string;
}
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  EyeIcon,
  PencilSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  SparklesIcon,
  EnvelopeIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
} from "@heroicons/react/24/solid";

// Import PDFViewer dynamically to avoid SSR issues
const PDFViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64 bg-gradient-to-br from-slate-50 to-sky-50 rounded-2xl">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-t-sky-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full"
        />
        <DocumentTextIcon className="w-6 h-6 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
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
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("viewMode") === "true";

  const [user, setUser] = useState<any>(null);
  const [cv, setCV] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [reviewContent, setReviewContent] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeTab, setActiveTab] = useState<"cv" | "reviews">("cv");
  const [successMessage, setSuccessMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState<{ [key: number]: boolean }>({});

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
    out: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  // Your original useEffect - keeping exactly as is but with TypeScript fixes
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
            setReviews(cvData.reviews || []);
            setResponses(cvData.responses || []);

            // Generate a signed URL for the PDF from Supabase storage
            if (cvData.cv?.file_path) {
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
          setReviews(reviewedData?.cvs || []);
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
    setSuccessMessage("");

    try {
      const response = await fetch("/api/expert/submit-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvId: cv.id,
          expertId: user?.id,
          content: reviewContent,
          rating: rating,
        }),
      });

      const data: any = await response.json();

      if (data.success) {
        const newReview = {
          ...data.review,
          first_name: user?.first_name,
          last_name: user?.last_name,
        };

        setReviews([newReview, ...reviews]);
        setReviewContent("");
        setRating(0);
        setCV({ ...cv, status: "reviewed" });
        setSuccessMessage("Review submitted successfully! 🎉");
        setActiveTab("reviews");

        // Auto-redirect after success
        setTimeout(() => {
          router.push("/expert/dashboard");
        }, 2500);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "under_review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "reviewed":
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "under_review":
        return <EyeIcon className="h-4 w-4" />;
      case "reviewed":
      case "completed":
        return <CheckCircleIconSolid className="h-4 w-4" />;
      default:
        return <InformationCircleIcon className="h-4 w-4" />;
    }
  };

  // Loading state
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

  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 right-40 w-60 h-60 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 backdrop-blur-sm shadow-xl sticky top-0 z-50 border-b border-white/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/expert/dashboard")}
                  className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/70 text-sky-600 hover:bg-sky-50 transition-all duration-300 shadow-lg border border-white/30 backdrop-blur-sm"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </motion.button>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600"
                  >
                    {viewMode ? "Review Details" : "CV Review"}
                  </motion.h1>
                  {cv && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-gray-600 flex items-center mt-1"
                    >
                      <UserCircleIcon className="h-4 w-4 mr-1" />
                      {viewMode ? "Viewing" : "Reviewing"} {cv.first_name}{" "}
                      {cv.last_name}&apos;s application
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="hidden lg:flex bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/30">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("cv")}
                  className={`px-6 py-2.5 font-medium text-sm rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "cv"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-sky-600 hover:bg-white/50"
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>CV Document</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("reviews")}
                  className={`px-6 py-2.5 font-medium text-sm rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "reviews"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-sky-600 hover:bg-white/50"
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>Reviews</span>
                  {reviews.length > 0 && (
                    <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                      {reviews.length}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="flex mt-4 bg-white/60 backdrop-blur-sm p-1 rounded-xl lg:hidden shadow-lg border border-white/30">
              <button
                onClick={() => setActiveTab("cv")}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  activeTab === "cv"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600"
                }`}
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>CV Document</span>
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  activeTab === "reviews"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600"
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>Reviews</span>
                {reviews.length > 0 && (
                  <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                    {reviews.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
        >
          {cv ? (
            <div className="space-y-8">
              {/* Applicant Information Card */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
              >
                <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-6 py-5">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <UserCircleIcon className="h-6 w-6 mr-3" />
                    Applicant Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Name & Avatar */}
                    <div className="flex items-center space-x-4 lg:col-span-2">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {cv.first_name?.[0]}
                        {cv.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Full Name
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {cv.first_name} {cv.last_name}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Email Address
                      </p>
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <p className="font-medium text-gray-900 truncate">
                          {cv.email}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-500 font-medium mb-2">
                        Current Status
                      </p>
                      <motion.span
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium shadow-sm border ${getStatusColor(
                          cv.status
                        )}`}
                      >
                        {getStatusIcon(cv.status)}
                        <span className="ml-2 capitalize">
                          {cv.status?.replace("_", " ")}
                        </span>
                      </motion.span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Submitted on {formatDate(cv.created_at)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DocumentCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{cv.file_name}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "cv" && (
                  <motion.div
                    key="cv-content"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    {/* CV Preview */}
                    <motion.div
                      variants={cardVariants}
                      className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
                    >
                      <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 px-6 py-5">
                        <h2 className="text-xl font-bold text-white flex items-center">
                          <DocumentTextIcon className="h-6 w-6 mr-3" />
                          CV Document Preview
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-sky-50">
                          {!pdfUrl ? (
                            <div className="flex justify-center items-center h-96">
                              <div className="relative">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                  className="w-16 h-16 border-4 border-t-sky-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full"
                                />
                                <DocumentTextIcon className="w-8 h-8 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-[600px] lg:h-[700px]">
                              <PDFViewer fileUrl={pdfUrl} />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Review Form */}
                    {cv.status === "pending" && !viewMode && (
                      <motion.div
                        variants={cardVariants}
                        className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
                      >
                        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 px-6 py-5">
                          <h2 className="text-xl font-bold text-white flex items-center">
                            <PencilSquareIcon className="h-6 w-6 mr-3" />
                            Submit Your Expert Review
                          </h2>
                        </div>
                        <div className="p-6 space-y-6">
                          {/* Messages */}
                          <AnimatePresence>
                            {submitError && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start shadow-sm"
                              >
                                <ExclamationTriangleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                                <span>{submitError}</span>
                              </motion.div>
                            )}
                            {successMessage && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start shadow-sm"
                              >
                                <CheckCircleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                                <span>{successMessage}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Rating Section */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Overall Rating
                            </label>
                            <div className="flex items-center space-x-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <motion.button
                                  key={star}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none"
                                >
                                  {star <= rating ? (
                                    <StarIconSolid className="h-8 w-8 text-yellow-400" />
                                  ) : (
                                    <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400 transition-colors" />
                                  )}
                                </motion.button>
                              ))}
                              {rating > 0 && (
                                <span className="ml-4 text-sm text-gray-600 font-medium">
                                  {rating}/5 stars
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Review Content */}
                          <div>
                            <label
                              htmlFor="review"
                              className="block text-sm font-semibold text-gray-700 mb-3"
                            >
                              Detailed Feedback
                            </label>
                            <div className="relative">
                              <textarea
                                id="review"
                                rows={10}
                                value={reviewContent}
                                onChange={(e) =>
                                  setReviewContent(e.target.value)
                                }
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 shadow-sm resize-none bg-white/50 backdrop-blur-sm"
                                placeholder="Provide your detailed feedback on the CV. Consider aspects like formatting, content quality, relevant experience, skills presentation, and overall professionalism..."
                              />
                              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-md">
                                {reviewContent.length} characters
                              </div>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-end pt-4">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleSubmitReview}
                              disabled={isSubmitting || !reviewContent.trim()}
                              className={`px-8 py-4 rounded-xl shadow-lg font-semibold text-white transition-all duration-300 flex items-center space-x-2 ${
                                isSubmitting || !reviewContent.trim()
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:via-blue-700 hover:to-indigo-700 shadow-sky-500/25"
                              }`}
                            >
                              {isSubmitting ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                  />
                                  <span>Submitting...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-5 w-5" />
                                  <span>Submit Review</span>
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === "reviews" && (
                  <motion.div
                    key="reviews-content"
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    {/* Reviews Section */}
                    <motion.div
                      variants={cardVariants}
                      className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
                    >
                      <div className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 px-6 py-5">
                        <h2 className="text-xl font-bold text-white flex items-center justify-between">
                          <div className="flex items-center">
                            <ChatBubbleLeftRightIcon className="h-6 w-6 mr-3" />
                            Review History & Discussions
                          </div>
                          {reviews.length > 0 && (
                            <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                              {reviews.length} review
                              {reviews.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </h2>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {reviews.length > 0 ? (
                          reviews.map((review, index) => {
                            const reviewResponses = getResponsesForReview(
                              review.id
                            );
                            const isExpandedState =
                              isExpanded[review.id] || false;

                            return (
                              <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.1,
                                  duration: 0.4,
                                }}
                                className="transition-all duration-300 hover:bg-gray-50/50"
                              >
                                <div className="p-6">
                                  {/* Review Header */}
                                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                                    <div className="flex items-center space-x-4">
                                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {review.first_name?.[0]}
                                        {review.last_name?.[0]}
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                          {review.first_name} {review.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center">
                                          <AcademicCapIcon className="h-4 w-4 mr-1" />
                                          Expert Reviewer
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col items-end space-y-2">
                                      <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      >
                                        <CheckBadgeIcon className="h-4 w-4 mr-1.5" />
                                        Review Completed
                                      </motion.div>
                                      <div className="text-sm text-gray-500 flex items-center">
                                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                                        {formatDate(review.created_at)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Review Content Card */}
                                  <motion.div
                                    whileHover={{
                                      boxShadow:
                                        "0 10px 40px rgba(0, 0, 0, 0.1)",
                                    }}
                                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-6 transition-all duration-300"
                                  >
                                    <div className="flex items-start space-x-4">
                                      <div className="flex-shrink-0 mt-1">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                          <PencilSquareIcon className="h-5 w-5 text-white" />
                                        </div>
                                      </div>
                                      <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                            Expert Feedback
                                            <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg font-medium">
                                              Professional Review
                                            </span>
                                          </h4>
                                          {review.rating && (
                                            <div className="flex items-center space-x-1">
                                              {[...Array(5)].map((_, i) => (
                                                <StarIconSolid
                                                  key={i}
                                                  className={`h-4 w-4 ${
                                                    i < review.rating
                                                      ? "text-yellow-400"
                                                      : "text-gray-300"
                                                  }`}
                                                />
                                              ))}
                                              <span className="ml-2 text-sm text-gray-600 font-medium">
                                                {review.rating}/5
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="prose prose-sm max-w-none text-gray-700">
                                          <div
                                            className={`whitespace-pre-line ${
                                              !isExpandedState && "line-clamp-4"
                                            }`}
                                          >
                                            {review.content ||
                                              review.review_content}
                                          </div>
                                          {(
                                            review.content ||
                                            review.review_content
                                          )?.length > 200 && (
                                            <motion.button
                                              whileHover={{ scale: 1.02 }}
                                              onClick={() =>
                                                setIsExpanded((prev) => ({
                                                  ...prev,
                                                  [review.id]: !isExpandedState,
                                                }))
                                              }
                                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                            >
                                              {isExpandedState
                                                ? "Show less"
                                                : "Read more..."}
                                            </motion.button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>

                                  {/* Applicant Responses */}
                                  {reviewResponses.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      transition={{ delay: 0.2, duration: 0.3 }}
                                      className="space-y-4"
                                    >
                                      <div className="flex items-center space-x-2 mb-4">
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                                          <ChatBubbleLeftRightIcon className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900">
                                          Applicant Responses
                                        </h4>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                          {reviewResponses.length} response
                                          {reviewResponses.length !== 1
                                            ? "s"
                                            : ""}
                                        </span>
                                      </div>

                                      <div className="space-y-4 pl-8 border-l-4 border-gradient-to-b from-green-200 to-blue-200 relative">
                                        <div className="absolute -left-2 top-0 h-4 w-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                                        {reviewResponses.map(
                                          (response, responseIndex) => (
                                            <motion.div
                                              key={response.id}
                                              initial={{ opacity: 0, x: -20 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{
                                                delay:
                                                  0.1 + responseIndex * 0.1,
                                                duration: 0.3,
                                              }}
                                              className="bg-white border-2 border-green-100 p-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
                                            >
                                              <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center space-x-3">
                                                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {cv.first_name?.[0]}
                                                    {cv.last_name?.[0]}
                                                  </div>
                                                  <div>
                                                    <span className="font-semibold text-green-700 text-sm">
                                                      {cv.first_name}{" "}
                                                      {cv.last_name}
                                                    </span>
                                                    <p className="text-xs text-gray-500">
                                                      Applicant
                                                    </p>
                                                  </div>
                                                </div>
                                                <span className="text-xs text-gray-500 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                                  {formatDate(
                                                    response.created_at
                                                  )}
                                                </span>
                                              </div>
                                              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-green-50 p-4 rounded-lg border border-green-100">
                                                {response.content}
                                              </div>
                                            </motion.div>
                                          )
                                        )}
                                      </div>
                                    </motion.div>
                                  )}

                                  {/* No Responses State */}
                                  {reviewResponses.length === 0 && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                      className="text-center p-8 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-200"
                                    >
                                      <div className="flex flex-col items-center space-y-3">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                          <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <div>
                                          <h3 className="text-lg font-medium text-gray-700 mb-1">
                                            Awaiting Response
                                          </h3>
                                          <p className="text-sm text-gray-500 max-w-md">
                                            The applicant hasn&apos;t responded
                                            to this review yet. They will be
                                            notified and can provide feedback or
                                            ask questions.
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-4">
                                          <InformationCircleIcon className="h-4 w-4" />
                                          <span>
                                            Notifications are automatically sent
                                            to applicants
                                          </span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col items-center justify-center py-16 px-6 text-center"
                          >
                            <div className="relative mb-8">
                              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
                                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400" />
                              </div>
                              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                                <SparklesIcon className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                              No Reviews Yet
                            </h3>
                            <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
                              This CV hasn&apos;t been reviewed yet. Once you
                              submit your expert feedback, it will appear here
                              along with any applicant responses.
                            </p>
                            {cv.status === "pending" && !viewMode && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab("cv")}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300"
                              >
                                <PencilSquareIcon className="h-5 w-5 mr-2" />
                                Start Your Review
                              </motion.button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                CV Not Found
              </h2>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                The requested CV could not be found or you don&apos;t have
                permission to access it.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/expert/dashboard")}
                className="inline-flex items-center px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors duration-300 shadow-lg"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Dashboard
              </motion.button>
            </motion.div>
          )}
        </motion.main>
      </div>
    </AuthGuard>
  );
}
