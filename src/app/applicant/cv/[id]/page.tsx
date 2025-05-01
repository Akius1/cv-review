/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

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
    // other user properties as needed
  };
  error?: string;
}

export interface CVApiResponse {
  success: boolean;
  cv: CV;
  reviews: Review[];
  responses: Response[];
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

export default function CVDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cv, setCV] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responseContent, setResponseContent] = useState("");
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/check");
        const userData = (await userResponse.json()) as AuthResponse;

        if (userData?.authenticated) {
          setUser(userData.user);

          // Fetch CV details
          const cvResponse = await fetch(`/api/cv/${params.id}`);
          const cvData: any = await cvResponse.json();

          if (cvData.success) {
            setCV(cvData.cv);
            setReviews(cvData.reviews);
            setResponses(cvData.responses);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params?.id]);

  const handleResponseSubmit = async (reviewId: number) => {
    if (!responseContent.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/review/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          content: responseContent,
          userId: user.id,
        }),
      });

      const data: ReviewResponse = await response.json();

      if (data.success) {
        // Add new response to the list
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
    <AuthGuard userType="applicant">
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">CV Details</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/applicant/dashboard")}
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
              {/* CV Information */}
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

              {/* Reviews Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Expert Reviews</h2>

                {reviews.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-gray-600">
                      No reviews yet. Your CV is waiting to be reviewed by our
                      experts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-50 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                Review by {review.first_name} {review.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setActiveReviewId(
                                  activeReviewId === review.id
                                    ? null
                                    : review.id
                                )
                              }
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            >
                              {activeReviewId === review.id
                                ? "Cancel"
                                : "Respond"}
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-white">
                          <div className="prose max-w-none">
                            <p>{review.content}</p>
                          </div>
                        </div>

                        {/* Responses */}
                        {getResponsesForReview(review.id).length > 0 && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <h4 className="font-medium mb-2">Your Responses</h4>
                            <div className="space-y-3">
                              {getResponsesForReview(review.id).map(
                                (response) => (
                                  <div
                                    key={response.id}
                                    className="bg-white p-3 rounded-md border border-gray-200"
                                  >
                                    <p className="text-sm text-gray-500 mb-1">
                                      {new Date(
                                        response.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                    <p>{response.content}</p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Response Form */}
                        {activeReviewId === review.id && (
                          <div className="border-t border-gray-200 p-4">
                            <h4 className="font-medium mb-2">Your Response</h4>
                            <textarea
                              value={responseContent}
                              onChange={(e) =>
                                setResponseContent(e.target.value)
                              }
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                              placeholder="Type your response here..."
                            ></textarea>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => handleResponseSubmit(review.id)}
                                disabled={
                                  isSubmitting || !responseContent.trim()
                                }
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
