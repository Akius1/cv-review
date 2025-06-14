/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  PhoneIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

// --- Type Definitions ---
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
  notes?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  is_upcoming?: boolean;
  is_today?: boolean;
}

interface ExpertUser {
  id: number | string;
  email: string;
  user_type: "expert";
  first_name?: string;
  last_name?: string;
}

interface ApiResponse {
  success: boolean;
  meetings?: MeetingBooking[];
  meeting?: MeetingBooking;
  error?: string;
  message?: string;
  total?: number;
  has_more?: boolean;
}

// --- Helper Functions ---
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled":
      return "bg-green-100 text-green-800 border-green-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "rescheduled":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getMeetingTypeIcon = (type: string) => {
  switch (type) {
    case "google_meet":
    case "zoom":
      return <VideoCameraIcon className="h-4 w-4" />;
    case "phone":
      return <PhoneIcon className="h-4 w-4" />;
    case "in_person":
      return <MapPinIcon className="h-4 w-4" />;
    default:
      return <VideoCameraIcon className="h-4 w-4" />;
  }
};

const getTimeUntilMeeting = (date: string, time: string) => {
  const meetingDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  const diffMs = meetingDateTime.getTime() - now.getTime();

  if (diffMs <= 0) return "Past";

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) return `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `In ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  if (diffMinutes > 0)
    return `In ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
  return "Now";
};

export default function ExpertMeetingManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ExpertUser | null>(null);
  const [meetings, setMeetings] = useState<MeetingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "upcoming" | "today" | "past" | "cancelled"
  >("upcoming");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingBooking | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    out: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  // Fetch user data and meetings
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch user data
        const userResponse = await fetch("/api/auth/check");
        if (!userResponse.ok) throw new Error("Auth check failed");
        const userData: any = await userResponse.json();

        if (
          userData.authenticated &&
          userData.user &&
          userData.user.user_type === "expert"
        ) {
          setCurrentUser(userData.user as ExpertUser);

          // 2. Fetch meetings for expert
          const meetingsResponse = await fetch("/api/expert/meetings");
          if (meetingsResponse.ok) {
            const meetingsData: ApiResponse = await meetingsResponse.json();
            if (meetingsData.success && meetingsData.meetings) {
              setMeetings(meetingsData.meetings);
            } else {
              setMeetings([]);
            }
          } else {
            setMeetings([]);
          }
        } else {
          router.push("/auth/login");
        }
      } catch (err: any) {
        console.error("Error fetching meeting data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter meetings based on active filter
  const filteredMeetings = meetings.filter((meeting) => {
    const now = new Date();
    const meetingDateTime = new Date(
      `${meeting.meeting_date}T${meeting.start_time}`
    );
    const today = new Date().toISOString().split("T")[0];

    switch (activeFilter) {
      case "upcoming":
        return meetingDateTime > now && meeting.status === "scheduled";
      case "today":
        return meeting.meeting_date === today && meeting.status === "scheduled";
      case "past":
        return meetingDateTime <= now || meeting.status === "completed";
      case "cancelled":
        return meeting.status === "cancelled";
      case "all":
      default:
        return true;
    }
  });

  // Handle adding notes to meeting
  const handleAddNotes = async () => {
    if (!selectedMeeting) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/expert/meeting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: selectedMeeting.id,
          notes: meetingNotes,
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Notes added successfully",
        });

        // Update local state
        setMeetings(
          meetings.map((m) =>
            m.id === selectedMeeting.id ? { ...m, notes: meetingNotes } : m
          )
        );

        setShowNotesModal(false);
        setSelectedMeeting(null);
        setMeetingNotes("");
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to add notes",
        });
      }
    } catch (error) {
      console.error("Error adding notes:", error);
      setMessage({
        type: "error",
        text: "Failed to add notes. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle marking meeting as completed
  const handleMarkCompleted = async (meetingId: number) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/expert/complete-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Meeting marked as completed",
        });

        // Update local state
        setMeetings(
          meetings.map((m) =>
            m.id === meetingId ? { ...m, status: "completed" as const } : m
          )
        );
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to mark meeting as completed",
        });
      }
    } catch (error) {
      console.error("Error marking meeting as completed:", error);
      setMessage({
        type: "error",
        text: "Failed to mark meeting as completed. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get filter counts
  const getFilterCounts = () => {
    const now = new Date();
    const today = new Date().toISOString().split("T")[0];

    return {
      all: meetings.length,
      upcoming: meetings.filter((m) => {
        const meetingDateTime = new Date(`${m.meeting_date}T${m.start_time}`);
        return meetingDateTime > now && m.status === "scheduled";
      }).length,
      today: meetings.filter((m) => {
        return m.meeting_date === today && m.status === "scheduled";
      }).length,
      past: meetings.filter((m) => {
        const meetingDateTime = new Date(`${m.meeting_date}T${m.start_time}`);
        return meetingDateTime <= now || m.status === "completed";
      }).length,
      cancelled: meetings.filter((m) => m.status === "cancelled").length,
    };
  };

  const filterCounts = getFilterCounts();

  // --- Render Loading State ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100">
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
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm shadow-xl sticky top-0 z-40 border-b border-white/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/expert/dashboard")}
                  className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/70 text-sky-600 hover:bg-sky-50 transition-all duration-300 shadow-lg border border-white/30"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </motion.button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                    My Consultations
                  </h1>
                  <p className="text-sm text-gray-600">
                    View and manage your scheduled meetings with applicants
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/expert/availability")}
                className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Manage Availability</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
        >
          {/* Success/Error Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckBadgeIcon className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
                <button
                  onClick={() => setMessage(null)}
                  className="ml-auto hover:opacity-70"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
            <div className="flex flex-wrap gap-2">
              {(["upcoming", "today", "past", "cancelled", "all"] as const).map(
                (filter) => (
                  <motion.button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeFilter === filter
                        ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="capitalize">{filter}</span>
                    <span className="ml-2 text-xs opacity-80">
                      ({filterCounts[filter]})
                    </span>
                  </motion.button>
                )
              )}
            </div>
          </div>

          {/* Meetings List */}
          {filteredMeetings.length === 0 ? (
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-xl border border-white/20"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No {activeFilter === "all" ? "" : activeFilter} meetings found
              </h3>
              <p className="text-gray-500 mb-6">
                {activeFilter === "upcoming"
                  ? "You don't have any upcoming meetings. Check your availability settings."
                  : `No ${activeFilter} meetings to display.`}
              </p>
              {activeFilter === "upcoming" && (
                <motion.button
                  onClick={() => router.push("/expert/availability")}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-purple-600 hover:to-indigo-700 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Set Your Availability
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="grid gap-6"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredMeetings.map((meeting) => (
                <motion.div
                  key={meeting.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0">
                          {getMeetingTypeIcon(meeting.meeting_type)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {meeting.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            meeting.status
                          )}`}
                        >
                          {meeting.status.charAt(0).toUpperCase() +
                            meeting.status.slice(1)}
                        </span>
                        {meeting.is_today && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" />
                          <span>
                            Applicant: {meeting.applicant_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(meeting.meeting_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>
                            {formatTime(meeting.start_time)} -{" "}
                            {formatTime(meeting.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <InformationCircleIcon className="h-4 w-4" />
                          <span>
                            {getTimeUntilMeeting(
                              meeting.meeting_date,
                              meeting.start_time
                            )}
                          </span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="mt-3 text-sm text-gray-600">
                          {meeting.description}
                        </p>
                      )}

                      {meeting.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {meeting.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-2">
                      {meeting.status === "scheduled" &&
                        meeting.google_meet_link && (
                          <motion.a
                            href={meeting.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <VideoCameraIcon className="h-4 w-4 mr-2" />
                            Join Meeting
                          </motion.a>
                        )}

                      <motion.button
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </motion.button>

                      {meeting.status === "scheduled" && (
                        <>
                          <motion.button
                            onClick={() => {
                              setSelectedMeeting(meeting);
                              setMeetingNotes(meeting.notes || "");
                              setShowNotesModal(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                            {meeting.notes ? "Edit Notes" : "Add Notes"}
                          </motion.button>

                          <motion.button
                            onClick={() => handleMarkCompleted(meeting.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all duration-300"
                            whileHover={{ scale: actionLoading ? 1 : 1.05 }}
                            whileTap={{ scale: actionLoading ? 1 : 0.95 }}
                          >
                            <CheckBadgeIcon className="h-4 w-4 mr-2" />
                            Mark Complete
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.main>

        {/* Meeting Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedMeeting && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Meeting Details</h2>
                    <motion.button
                      onClick={() => setShowDetailsModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedMeeting.title}
                      </h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          selectedMeeting.status
                        )}`}
                      >
                        {selectedMeeting.status.charAt(0).toUpperCase() +
                          selectedMeeting.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Applicant
                        </label>
                        <p className="text-gray-900">
                          {selectedMeeting.applicant_name || "N/A"}
                        </p>
                        {selectedMeeting.applicant_email && (
                          <p className="text-sm text-gray-600">
                            {selectedMeeting.applicant_email}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <p className="text-gray-900">
                          {formatDate(selectedMeeting.meeting_date)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <p className="text-gray-900">
                          {formatTime(selectedMeeting.start_time)} -{" "}
                          {formatTime(selectedMeeting.end_time)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meeting Type
                        </label>
                        <div className="flex items-center">
                          {getMeetingTypeIcon(selectedMeeting.meeting_type)}
                          <span className="ml-2 text-gray-900 capitalize">
                            {selectedMeeting.meeting_type.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedMeeting.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <p className="text-gray-900">
                          {selectedMeeting.description}
                        </p>
                      </div>
                    )}

                    {selectedMeeting.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meeting Notes
                        </label>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-gray-900">
                            {selectedMeeting.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedMeeting.google_meet_link &&
                      selectedMeeting.status === "scheduled" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Link
                          </label>
                          <a
                            href={selectedMeeting.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                          >
                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                            Join Google Meet
                          </a>
                        </div>
                      )}

                    {selectedMeeting.cancellation_reason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cancellation Reason
                        </label>
                        <p className="text-red-600">
                          {selectedMeeting.cancellation_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Notes Modal */}
        <AnimatePresence>
          {showNotesModal && selectedMeeting && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotesModal(false)}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                      {selectedMeeting.notes ? "Edit Notes" : "Add Notes"}
                    </h2>
                    <motion.button
                      onClick={() => setShowNotesModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">
                      Meeting with{" "}
                      <strong>{selectedMeeting.applicant_name}</strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedMeeting.meeting_date)} at{" "}
                      {formatTime(selectedMeeting.start_time)}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label
                      htmlFor="meeting-notes"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Meeting Notes
                    </label>
                    <textarea
                      id="meeting-notes"
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      placeholder="Add your notes about this meeting, key discussion points, feedback provided, next steps, etc..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      These notes will be visible to you and can help track the
                      progress and outcomes of your consultation.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowNotesModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleAddNotes}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300"
                      whileHover={{ scale: actionLoading ? 1 : 1.02 }}
                      whileTap={{ scale: actionLoading ? 1 : 0.98 }}
                    >
                      {actionLoading ? (
                        <div className="flex items-center justify-center">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Saving...
                        </div>
                      ) : (
                        "Save Notes"
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
