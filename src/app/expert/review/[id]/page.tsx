/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
// Import PDFViewer component instead of direct react-pdf imports
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import { AuthResponse, CVApiResponse } from "@/app/applicant/cv/[id]/page";

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
  // const [numPages, setNumPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

        if(reviewedData?.success){
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

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/expert/dashboard");
        }, 1500);
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Review CV</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/expert/dashboard")}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {cv ? (
            <div className="space-y-8">
              {/* Applicant Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Applicant Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600">Name:</p>
                    <p className="font-medium">
                      {cv.first_name} {cv.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email:</p>
                    <p className="font-medium">{cv.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">CV Status:</p>
                    <p className="font-medium capitalize">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs ${
                          cv.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : cv.status === "under_review"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {cv.status.replace("_", " ")}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* CV Content with signed URL */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">CV Preview</h2>
                <div className="border border-gray-200 rounded-lg p-4">
                  {!pdfUrl ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <PDFViewer fileUrl={pdfUrl} />
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Uploaded on {new Date(cv.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Review Form */}
              {cv.status === "pending" && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Submit Your Review
                  </h2>

                  {submitError && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="review"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Review Content
                      </label>
                      <textarea
                        id="review"
                        rows={8}
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide your detailed feedback on the CV..."
                      ></textarea>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || !reviewContent.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Reviews */}
              {/* Previous Reviews */}
              {reviews.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Previous Reviews
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white transition-all duration-300 hover:bg-gray-50"
                      >
                        {/* Review Header */}
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                            <div className="flex items-center mb-2 md:mb-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                {review.applicant_name?.split(" ")[0]?.[0]}
                                {review.applicant_name?.split(" ")[1]?.[0] ||
                                  ""}
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
                                        className="h-4 w-4 mr-1"
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
                              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {review.status === "reviewed"
                                  ? "Reviewed"
                                  : review.status?.replace("_", " ")}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
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
                          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-blue-500"
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
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                  Review Feedback
                                </h4>
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                                  {review.review_content || review.content}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Applicant Responses */}
                          {getResponsesForReview(review.id).length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1 text-gray-600"
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
                              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                                {getResponsesForReview(review.id).map(
                                  (response) => (
                                    <div
                                      key={response.id}
                                      className="bg-blue-50 p-4 rounded-lg border border-blue-100"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-sm text-blue-700">
                                          {review.applicant_name ||
                                            `${review.first_name} ${review.last_name}`}
                                        </span>
                                        <span className="text-xs text-gray-500">
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
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* No Responses Message */}
                          {getResponsesForReview(review.id).length === 0 && (
                            <div className="mt-4 text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                              <p className="text-sm text-gray-500">
                                No responses from the applicant yet
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* No Reviews State */}
                  {reviews.length === 0 && (
                    <div className="p-8 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No reviews yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No reviews have been submitted for this CV.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">
                CV not found or you don&apos;t have permission to view it.
              </p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
