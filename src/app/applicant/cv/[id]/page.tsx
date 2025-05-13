/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { motion } from "framer-motion";

interface CV {
  id: number;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
  review_count: number;
}
interface Review {
  id: number;
  content: string;
  created_at: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: {
    id: any;
    email: string;
    user_type: "applicant" | "expert";
  };
  error?: string;
}

export interface CVApiResponse {
  success: boolean;
  cv: CV;
  reviews: Review[];
  responses: {
    id: number;
    review_id: number;
    content: string;
    created_at: string;
  }[];
}
export interface ReviewResponse {
  success: boolean;
  response: {
    id: number;
    review_id: number;
    content: string;
    created_at: string;
  };
}

export default function CVDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cvId = params.id as string;

  const [cv, setCV] = useState<CV | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responseContent, setResponseContent] = useState("");
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await fetch("/api/auth/check");
        const userData = (await userResponse.json()) as AuthResponse;

        if (userData.authenticated) {
          setUser(userData.user);
          const cvResponse = await fetch(`/api/cv/${cvId}`);
          const cvData = (await cvResponse.json()) as CVApiResponse;

          if (cvData.success) {
            setCV(cvData.cv);
            setReviews(cvData.reviews);
            setResponses(cvData.responses);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (cvId) fetchData();
  }, [cvId]);

  const handleResponseSubmit = async (reviewId: number) => {
    if (!responseContent.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/review/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          content: responseContent,
          userId: user.id,
        }),
      });
      const data = (await response.json()) as ReviewResponse;
      if (data.success) {
        setResponses([...responses, data.response]);
        setResponseContent("");
        setActiveReviewId(null);
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResponsesForReview = (reviewId: number) =>
    responses.filter((r) => r.review_id === reviewId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard userType="applicant">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => router.push("/applicant/dashboard")}
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
                    CV Details
                  </motion.h1>
                  {cv && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-gray-500"
                    >
                      {user.first_name} {user.last_name}&apos;s application
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {cv ? (
            <div className="space-y-8">
              {/* CV Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">CV Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">File Name:</p>
                    <p className="font-medium">{cv.file_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
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
                  <div>
                    <p className="text-gray-600">Uploaded On:</p>
                    <p className="font-medium">
                      {new Date(cv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {/* Reviews */}
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
                    Expert Reviews
                  </h2>
                </div>

                {/* <h2 className="text-xl font-semibold mb-4"></h2> */}
                {reviews.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-gray-600">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg">
                        <div className="bg-gray-50 p-4 flex justify-between">
                          <div>
                            <h3 className="font-medium">
                              Review by {review.first_name} {review.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setActiveReviewId(
                                activeReviewId === review.id ? null : review.id
                              )
                            }
                            className="px-3 py-1 bg-blue-600 text-white rounded-md"
                          >
                            {activeReviewId === review.id
                              ? "Cancel"
                              : "Respond"}
                          </button>
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
                                {review.content}
                              </div>
                            </div>
                          </div>
                        </div>
                        {getResponsesForReview(review.id).length > 0 && (
                          <div className="bg-gray-50 p-4">
                            <h4 className="font-medium mb-2">Your Responses</h4>
                            {getResponsesForReview(review.id).map((res) => (
                              <div
                                key={res.id}
                                className="border p-3 rounded-md mb-2"
                              >
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    res.created_at
                                  ).toLocaleDateString()}
                                </p>
                                <p>{res.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {activeReviewId === review.id && (
                          <div className="p-4 border-t">
                            <textarea
                              value={responseContent}
                              onChange={(e) =>
                                setResponseContent(e.target.value)
                              }
                              className="w-full p-2 border rounded-md"
                              rows={3}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleResponseSubmit(review.id)}
                                disabled={
                                  isSubmitting || !responseContent.trim()
                                }
                                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                              >
                                {isSubmitting
                                  ? "Submitting..."
                                  : "Submit Response"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">CV not found.</p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
