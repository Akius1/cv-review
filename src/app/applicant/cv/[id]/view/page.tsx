/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  UserIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Dynamically import the PDFViewer with enhanced loading
const PDFViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col justify-center items-center h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-white/30">
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-t-sky-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full"
        />
        <DocumentTextIcon className="w-10 h-10 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <motion.p
        className="text-lg text-gray-600 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Loading Your Document...
      </motion.p>
      <motion.p
        className="text-sm text-gray-500 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Please wait while we prepare your CV
      </motion.p>
    </div>
  ),
});

// Initialize the Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CVData {
  id: number;
  file_name: string;
  file_path: string;
  created_at?: string;
  status?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
  out: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } },
};

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function ApplicantCVViewerPage() {
  const router = useRouter();
  const params = useParams();
  const cvId = params.id as string;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
        console.log(e)
      return "Invalid Date";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "under_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleDownload = async () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = cvData?.file_name || "cv-document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    if (!cvId) {
      setError("CV ID is not specified.");
      setIsLoading(false);
      return;
    }

    const fetchAndGenerateUrl = async () => {
      try {
        // Step 1: Fetch the CV metadata
        const response = await fetch(`/api/cv/${cvId}`);
        const data: any = await response.json();

        if (!data.success || !data.cv) {
          throw new Error(data.error || "Could not find the specified CV.");
        }

        const cv: CVData = data.cv;
        setCvData(cv);

        // Step 2: Generate a secure, time-limited URL for the PDF
        const { data: signed, error: urlError } = await supabaseClient.storage
          .from("cvs")
          .createSignedUrl(cv.file_path, 3600); // Valid for 1 hour

        if (urlError) {
          throw urlError;
        }

        setPdfUrl(signed.signedUrl);
      } catch (err: any) {
        console.error("Failed to load CV:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndGenerateUrl();
  }, [cvId]);

  return (
    <AuthGuard userType="applicant">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <motion.div
          className="relative z-10 min-h-screen flex flex-col"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
        >
          {/* Enhanced Header */}
          <motion.header
            className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-xl border-b border-white/30"
            variants={headerVariants}
            initial="initial"
            animate="animate"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left Side - Navigation & Info */}
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/applicant/cv/${cvId}`)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 rounded-xl shadow-lg hover:bg-white border border-gray-200 transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Back to Feedback</span>
                  </motion.button>

                  <div className="hidden md:flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                      <DocumentTextIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-800 truncate max-w-xs">
                        {cvData?.file_name || "CV Document"}
                      </h1>
                      {cvData?.status && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(cvData.status)}`}
                        >
                          {cvData.status.replace("_", " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex items-center space-x-3">
                  {pdfUrl && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownload}
                        className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white/80 rounded-lg shadow-md hover:bg-gray-50 border transition-all duration-200"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Download</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg shadow-md hover:bg-emerald-200 border border-emerald-200 transition-all duration-200"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Viewing</span>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Info Bar */}
              <div className="md:hidden pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium text-gray-800 truncate">
                      {cvData?.file_name || "CV Document"}
                    </span>
                  </div>
                  {cvData?.status && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(cvData.status)}`}
                    >
                      {cvData.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.header>

          {/* Document Info Panel */}
          {cvData && !error && (
            <motion.div
              className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-white/30"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>Uploaded: {formatDate(cvData.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>Your Document</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Secure View
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Content */}
          <main className="flex-grow relative z-10 p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-center"
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="initial"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/30 max-w-md mx-auto">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-red-700 mb-4">
                      Failed to Load Document
                    </h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {error}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg font-medium"
                      >
                        Try Again
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push("/applicant/dashboard")}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-md font-medium"
                      >
                        Go to Dashboard
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {!isLoading && !error && pdfUrl && (
                <motion.div
                  className="h-[calc(100vh-200px)] w-full"
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                >
                  <div className="h-full bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/30">
                    <PDFViewer fileUrl={pdfUrl} />
                  </div>
                </motion.div>
              )}

              {isLoading && !error && (
                <motion.div
                  className="h-[calc(100vh-200px)] w-full"
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                >
                  <div className="h-full bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/30">
                    <PDFViewer fileUrl="" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Enhanced Success Footer */}
          {!error && !isLoading && (
            <motion.div
              className="relative z-10 bg-white/60 backdrop-blur-sm border-t border-white/30 py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <SparklesIcon className="h-4 w-4 text-emerald-500" />
                  <span>
                    Document loaded successfully • Secure viewing session active
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AuthGuard>
  );
}
