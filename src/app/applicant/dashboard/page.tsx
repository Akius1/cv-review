/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { AuthResponse, CVApiResponse, ReviewResponse } from "../cv/[id]/page";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

interface CV {
  id: number;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
  review_count: number;
}

export default function ApplicantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cvs, setCVs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("Applicant Dashboard");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/auth/check");
        const userData: AuthResponse = await userResponse.json();

        if (userData.authenticated) {
          setUser(userData.user);

          // Fetch user's CVs
          const cvsResponse: any = await fetch(
            `/api/cv/list?userId=${userData?.user?.id}`
          );
          const cvsData = await cvsResponse.json();

          if (cvsData.success) {
            setCVs(cvsData.cvs);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload a PDF or Word document."
      );
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id.toString());

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      const data: any = await response.json();

      if (data.success) {
        // Add new CV to the list
        setCVs([data.cv, ...cvs]);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadError(data.error || "Failed to upload CV");
      }
    } catch (error) {
      console.error("CV upload error:", error);
      setUploadError("Failed to upload CV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleViewCV = (cvId: number) => {
    router.push(`/applicant/cv/${cvId}`);
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
        <Header
          user={user}
          setActiveTab={setActiveTab}
          activeTab={activeTab}
          handleLogout={handleLogout}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CV Upload Section */}
            <div className="bg-white shadow rounded-lg p-6 col-span-2">
              <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
              <p className="text-gray-600 mb-4">
                Upload your CV to get expert reviews and feedback to improve
                your chances of landing your dream job.
              </p>

              {uploadError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {uploadError}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                <p className="text-gray-500 mb-4">
                  Drag and drop your CV file here, or click to browse
                </p>
                <button
                  onClick={handleBrowseClick}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Browse Files"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: PDF, DOCX, DOC (Max 5MB)
                </p>
              </div>
            </div>

            {/* Status Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">CV Status</h2>
              <div className="space-y-4">
                {cvs.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-medium text-yellow-800">
                      No CV Uploaded
                    </h3>
                    <p className="text-sm text-yellow-600 mt-1">
                      Upload your CV to get started with the review process.
                    </p>
                  </div>
                ) : (
                  cvs.map((cv) => (
                    <div
                      key={cv.id}
                      className="p-4 bg-white border border-gray-200 rounded-md hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{cv.file_name}</h3>
                          <p className="text-sm text-gray-500">
                            Uploaded on{" "}
                            {new Date(cv.created_at).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
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
                            {cv.review_count > 0 && (
                              <span className="ml-2 text-sm text-gray-600">
                                {cv.review_count}{" "}
                                {cv.review_count === 1 ? "review" : "reviews"}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewCV(cv.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Reviews Section */}
            <div className="bg-white shadow rounded-lg p-6 col-span-3">
              <h2 className="text-xl font-semibold mb-4">
                Recent Expert Reviews
              </h2>
              {cvs.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-600">
                    No reviews yet. Upload your CV to receive expert feedback.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-600">
                    {cvs.some((cv) => cv.review_count > 0)
                      ? 'Click "View" on a CV to see its reviews and provide responses.'
                      : "Your CV is waiting to be reviewed by our experts. Check back soon!"}
                  </p>
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
