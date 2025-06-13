/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightIcon,
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
  UserGroupIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

// --- Constants ---
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- Type Definitions ---
interface User {
  id: number | string;
  name?: string;
  email?: string;
  user_type: "applicant";
  first_name?: string;
  last_name?: string;
}

interface CV {
  id: number;
  file_name: string;
  file_path: string;
  status: "pending" | "under_review" | "completed" | string;
  created_at: string;
  review_count: number;
}

interface AuthResponse {
  authenticated: boolean;
  user?: User;
  error?: string;
}

interface CVListResponse {
  success: boolean;
  cvs?: CV[];
  error?: string;
  message?: string;
}

interface CVUploadResponse {
  success: boolean;
  cv?: CV;
  error?: string;
  message?: string;
}

interface MeetingBooking {
  id: number;
  availability_id: number;
  expert_id: number;
  applicant_id: number;
  meeting_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  meeting_type: "google_meet" | "zoom" | "phone" | "in_person";
  google_meet_link?: string;
  title: string;
  description?: string;
  expert_name?: string;
  created_at: string;
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

const formatTime = (timeString: string) => {
  if (!timeString) return "N/A";
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return timeString;
  }
};

const formatDateTime = (date: string, time: string) => {
  try {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return `${formatDate(date)} at ${formatTime(time)}`;
  }
};

export default function ApplicantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [cvs, setCVs] = useState<CV[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingBooking[]>(
    []
  );
  const [pastMeetings, setPastMeetings] = useState<MeetingBooking[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("Applicant Dashboard");

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

  // Fetch user data and dashboard information
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPage(true);
      try {
        // 1. Fetch user data
        const userResponse = await fetch("/api/auth/check");
        if (!userResponse.ok) {
          throw new Error(`Auth check failed: ${userResponse.statusText}`);
        }
        const userData: AuthResponse = await userResponse.json();

        if (userData.authenticated && userData.user) {
          setUser(userData.user);

          // 2. Fetch CVs using the correct endpoint
          const cvsResponse = await fetch(
            `/api/cv/list?userId=${userData.user.id}`
          );
          if (cvsResponse.ok) {
            const cvsData: CVListResponse = await cvsResponse.json();
            if (cvsData.success && cvsData.cvs) {
              setCVs(cvsData.cvs);
            } else {
              console.error(
                "Failed to fetch CVs:",
                cvsData.error || cvsData.message
              );
              setCVs([]);
            }
          }

          // 3. Fetch meetings (if the endpoint exists)
          try {
            const meetingsResponse = await fetch("/api/applicant/meetings");
            if (meetingsResponse.ok) {
              const meetingsData: any = await meetingsResponse.json();
              if (meetingsData.success && meetingsData.meetings) {
                const meetings = meetingsData.meetings;
                const now = new Date();
                setUpcomingMeetings(
                  meetings.filter((m: MeetingBooking) => {
                    const meetingDateTime = new Date(
                      `${m.meeting_date}T${m.start_time}`
                    );
                    return meetingDateTime > now && m.status === "scheduled";
                  })
                );
                setPastMeetings(
                  meetings.filter((m: MeetingBooking) => {
                    const meetingDateTime = new Date(
                      `${m.meeting_date}T${m.start_time}`
                    );
                    return meetingDateTime <= now || m.status !== "scheduled";
                  })
                );
              }
            } else {
              console.warn("Meetings endpoint not available yet");
              setUpcomingMeetings([]);
              setPastMeetings([]);
            }
          } catch (meetingsError) {
            console.warn(
              "Meetings functionality not yet implemented:",
              meetingsError
            );
            setUpcomingMeetings([]);
            setPastMeetings([]);
          }
        } else {
          router.push("/auth/login");
        }
      } catch (error: any) {
        console.error("Error fetching initial data:", error);
        // Handle error appropriately
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchData();
  }, [router]);

  // Handle redirect to meeting page
  const handleGoToMeetings = () => {
    router.push("/applicant/meeting-management");
  };

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout");
      setUser(null);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [router]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFileUpload = useCallback(
    async (file: File) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setUploadError("Invalid file type. Please upload a PDF .");
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setUploadError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
        return;
      }

      if (!user?.id) {
        setUploadError("User not identified. Please try logging in again.");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", String(user.id));

      try {
        const response = await fetch("/api/cv/upload", {
          method: "POST",
          body: formData,
        });

        const data: CVUploadResponse = await response.json();

        if (response.ok && data.success && data.cv) {
          setCVs((prevCVs) => [data.cv!, ...prevCVs]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          setUploadError(
            data.error || data.message || "Failed to upload CV. Server error."
          );
        }
      } catch (error) {
        console.error("CV upload error:", error);
        setUploadError(
          "Failed to upload CV. Please check your connection and try again."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [user]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFileUpload(files[0]);
      }
    },
    [processFileUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFileUpload(file);
      }
    },
    [processFileUpload]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleViewCV = useCallback(
    (cvId: number) => {
      router.push(`/applicant/cv/${cvId}`);
    },
    [router]
  );

  const getStatusColor = useCallback((status: CV["status"]): string => {
    switch (status) {
      case "pending":
        return "from-amber-400 to-orange-500";
      case "under_review":
        return "from-blue-400 to-indigo-500";
      case "completed":
        return "from-emerald-400 to-green-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  }, []);

  const getStatusIcon = useCallback((status: CV["status"]): string => {
    switch (status) {
      case "pending":
        return "⏳";
      case "under_review":
        return "👀";
      case "completed":
        return "✅";
      default:
        return "📄";
    }
  }, []);

  // --- Render Loading State ---
  if (isLoadingPage) {
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

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <p className="text-2xl mb-4">
          Authentication issue or session expired.
        </p>
        <button
          onClick={() => router.push("/auth/login")}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <AuthGuard userType="applicant">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 flex flex-col">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <Header
          user={user}
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
              Welcome,{" "}
              {user?.first_name || user?.name?.split(" ")[0] || "Professional"}!
              👋
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Track your CV submissions, schedule expert consultations, and
              manage your career development journey.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 hover:shadow-xl min-w-[200px]"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Upload</div>
                  <div className="text-xs opacity-90">Your CV</div>
                </div>
              </motion.button>

              <motion.button
                onClick={handleGoToMeetings}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 hover:shadow-xl min-w-[200px]"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Manage</div>
                  <div className="text-xs opacity-90">Meetings</div>
                </div>
              </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <motion.div
                className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 text-center border border-white/30 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-sky-100 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-sky-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-sky-600 mb-1">
                  {cvs.length}
                </p>
                <p className="text-sm text-gray-500">CVs Uploaded</p>
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
                  {upcomingMeetings.length}
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
                  {cvs.reduce((acc, cv) => acc + cv.review_count, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Reviews</p>
              </motion.div>
            </div>
          </motion.section>

          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* CV Upload Section */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                    <span className="text-2xl" role="img" aria-label="Rocket">
                      🚀
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Upload Your CV
                    </h2>
                    <p className="text-gray-600">
                      Transform your career with expert insights
                    </p>
                  </div>
                </div>

                {uploadError && (
                  <div
                    role="alert"
                    className="mb-6 p-4 bg-gradient-to-r from-red-100 to-pink-100 border border-red-300 text-red-700 rounded-2xl flex items-center"
                  >
                    <span className="text-xl mr-3" aria-hidden="true">
                      ⚠️
                    </span>
                    <span>{uploadError}</span>
                  </div>
                )}

                <div
                  className={`border-3 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                    isDragOver
                      ? "border-purple-500 bg-gradient-to-br from-purple-100 to-indigo-100 scale-105 ring-4 ring-purple-300"
                      : "border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-indigo-50/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={ALLOWED_FILE_TYPES.join(",")}
                    aria-hidden="true"
                  />

                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span
                        className="text-3xl"
                        role="img"
                        aria-label="Document icon"
                      >
                        📄
                      </span>
                    </div>
                    <p className="text-gray-700 text-lg mb-2 font-medium">
                      {isDragOver
                        ? "Drop your CV here!"
                        : "Drag and drop your CV file here"}
                    </p>
                    <p className="text-gray-500">
                      or click the button below to browse
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    disabled={isUploading}
                    className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                  >
                    {isUploading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span
                          className="mr-2"
                          role="img"
                          aria-label="Folder icon"
                        >
                          📁
                        </span>
                        Browse Files
                      </div>
                    )}
                  </button>

                  <p className="text-sm text-gray-500 mt-4 flex items-center justify-center">
                    <span className="mr-2" role="img" aria-label="Lock icon">
                      🔒
                    </span>
                    Supported: PDF (Max {MAX_FILE_SIZE_MB}MB)
                  </p>
                </div>
              </div>
            </div>

            {/* CV Status & Meetings Section */}
            <div className="space-y-6">
              {/* CV Status Section */}
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 shrink-0">
                    <span
                      className="text-xl"
                      role="img"
                      aria-label="Chart icon"
                    >
                      📊
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">CV Status</h2>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {cvs.length === 0 ? (
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span
                          className="text-2xl"
                          role="img"
                          aria-label="Notepad icon"
                        >
                          📝
                        </span>
                      </div>
                      <h3 className="font-semibold text-amber-800 mb-2">
                        Ready to Start?
                      </h3>
                      <p className="text-sm text-amber-600">
                        Upload your first CV to begin your professional journey
                        with expert reviews.
                      </p>
                    </div>
                  ) : (
                    cvs.map((cv, index) => (
                      <motion.div
                        key={cv.id}
                        className="group p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center mb-1">
                              <span
                                className="text-lg mr-2 shrink-0"
                                role="img"
                                aria-label="Document icon"
                              >
                                📄
                              </span>
                              <h3
                                className="font-semibold text-gray-900 truncate"
                                title={cv.file_name}
                              >
                                {cv.file_name}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              Uploaded{" "}
                              {new Date(cv.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <div
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(
                                  cv.status
                                )} text-white shadow-sm capitalize`}
                              >
                                <span className="mr-1.5" aria-hidden="true">
                                  {getStatusIcon(cv.status)}
                                </span>
                                {cv.status.replace("_", " ")}
                              </div>
                              {cv.review_count > 0 && (
                                <div className="flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                                  <span
                                    className="mr-1"
                                    role="img"
                                    aria-label="Chat bubble"
                                  >
                                    💬
                                  </span>
                                  {cv.review_count}{" "}
                                  {cv.review_count === 1 ? "review" : "reviews"}
                                </div>
                              )}
                            </div>
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => handleViewCV(cv.id)}
                            className="ml-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-purple-100 hover:to-indigo-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300 transform hover:scale-105 whitespace-nowrap shrink-0"
                            aria-label={`View details for ${cv.file_name}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <EyeIcon className="h-4 w-4 inline mr-1" />
                            View
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Meetings Section */}
              <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shrink-0">
                    <VideoCameraIcon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Meetings</h2>
                </div>

                {upcomingMeetings.length === 0 ? (
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <VideoCameraIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-purple-800 mb-2">
                      No Meetings Yet
                    </h3>
                    <p className="text-sm text-purple-600 mb-4">
                      Book a consultation with our experts for personalized
                      feedback.
                    </p>
                    <motion.button
                      onClick={handleGoToMeetings}
                      className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Go to Meetings
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.slice(0, 3).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-green-800 mb-1">
                              {meeting.title}
                            </h4>
                            <p className="text-sm text-green-600">
                              {meeting.expert_name}
                            </p>
                            <p className="text-xs text-green-500">
                              {formatDateTime(
                                meeting.meeting_date,
                                meeting.start_time
                              )}
                            </p>
                          </div>
                          {meeting.google_meet_link && (
                            <motion.a
                              href={meeting.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              Join
                            </motion.a>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* View All Meetings Button */}
                    <motion.button
                      onClick={handleGoToMeetings}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 text-sm font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        View All Meetings
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </div>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Progress Stats */}
              {cvs.length > 0 && (
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span
                      className="mr-2"
                      role="img"
                      aria-label="Increasing chart"
                    >
                      📈
                    </span>
                    Your Progress
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center bg-white/10 p-3 rounded-xl">
                      <div className="text-3xl font-bold">{cvs.length}</div>
                      <div className="text-purple-100 text-sm">
                        CVs Uploaded
                      </div>
                    </div>
                    <div className="text-center bg-white/10 p-3 rounded-xl">
                      <div className="text-3xl font-bold">
                        {cvs.reduce(
                          (acc, cvItem) => acc + cvItem.review_count,
                          0
                        )}
                      </div>
                      <div className="text-purple-100 text-sm">
                        Total Reviews
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews Section */}
          <div className="mt-12">
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                  <span className="text-2xl" role="img" aria-label="Star">
                    ⭐
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recent Expert Reviews
                  </h2>
                  <p className="text-gray-600">
                    Get insights from industry professionals
                  </p>
                </div>
              </div>

              {cvs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl" role="img" aria-label="Target">
                      🎯
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Ready for Expert Feedback?
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Upload your CV above to receive personalized reviews from
                    industry experts who will help you stand out.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span
                      className="text-4xl"
                      role="img"
                      aria-label={
                        cvs.some((cv) => cv.review_count > 0)
                          ? "Party popper"
                          : "Alarm clock"
                      }
                    >
                      {cvs.some((cv) => cv.review_count > 0) ? "🎉" : "⏰"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {cvs.some((cv) => cv.review_count > 0)
                      ? "Great Progress!"
                      : "Reviews Coming Soon"}
                  </h3>
                  <p className="text-gray-600 max-w-lg mx-auto">
                    {cvs.some((cv) => cv.review_count > 0)
                      ? 'Click "View" on any CV in the status list to see detailed reviews and insights from our experts.'
                      : "Your CV is in the queue for expert review. Our professionals will provide feedback to help you improve your application!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
