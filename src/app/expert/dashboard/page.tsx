/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  AuthResponse,
  CVApiResponse,
  ReviewResponse,
} from "@/app/applicant/cv/[id]/page";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";

interface CV {
  id: number;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
  user_id: number;
  applicant_name?: string;
  applicant_email?: string;
}

export default function ExpertDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingCVs, setPendingCVs] = useState<CV[]>([]);
  const [reviewedCVs, setReviewedCVs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Expert Dashboard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/check");
        const userData: AuthResponse = await userResponse.json();
        console.log("userData", userData);

        if (userData.authenticated) {
          setUser(userData.user);

          // Fetch pending CVs
          const pendingResponse = await fetch("/api/expert/pending-cvs");
          const pendingData: any = await pendingResponse.json();

          if (pendingData.success) {
            setPendingCVs(pendingData.cvs);
          }

          // Fetch reviewed CVs
          const reviewedResponse = await fetch(
            `/api/expert/reviewed-cvs?expertId=${userData?.user?.id}`
          );
          const reviewedData: any = await reviewedResponse.json();

          if (reviewedData.success) {
            setReviewedCVs(reviewedData?.cvs);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleReviewCV = (cvId: number) => {
    router.push(`/expert/review/${cvId}`);
  };

  const handleViewReview = (cvId: number) => {
    router.push(`/expert/review/${cvId}`);
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
        <Header
          user={user}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          handleLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-8">
            {/* Pending CVs Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Pending CVs for Review
              </h2>

              {pendingCVs.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-600">
                    No pending CVs to review at the moment. Check back later.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Applicant
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          CV Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Uploaded On
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingCVs.map((cv) => (
                        <tr key={cv.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {cv.applicant_name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cv.applicant_email || "No email"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cv.file_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(cv.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {cv.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleReviewCV(cv.id)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Reviewed CVs Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Reviewed CVs</h2>

              {reviewedCVs.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-600">
                    You haven&apos;t reviewed any CVs yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Applicant
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          CV Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Reviewed On
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reviewedCVs.map((cv) => (
                        <tr key={cv.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {cv.applicant_name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cv.applicant_email || "No email"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cv.file_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(cv.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Reviewed
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewReview(cv.id)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </AuthGuard>
  );
}
