/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Briefcase,
  Calendar,
  Users,
  Info,
  Mail,
  MapPin,
  Target,
  User,
  UserCheck,
  Building,
  Clock,
  FileText,
  Edit3,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface ProfileDisplayProps {
  role: "expert" | "applicant";
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
  out: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } },
};

const cardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const detailItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function ProfileDisplay({
  role,
  setIsEditing,
  isEditing,
}: ProfileDisplayProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isExpert = role === "expert";

  useEffect(() => {
    axios
      .get(`/api/${role}/profile`)
      .then((res) => setProfile(res.data))
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [role]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-t-sky-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full"
          />
          <User className="w-10 h-10 text-sky-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 flex items-center justify-center">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <motion.div
          className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 max-w-md mx-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <motion.div
        className="relative z-10 max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
      >
        {/* Header Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg">
              {isExpert ? (
                <UserCheck className="h-8 w-8 text-white" />
              ) : (
                <User className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 mb-4">
            {isExpert ? "Expert Profile" : "My Profile"}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isExpert
              ? "Professional expertise and experience overview"
              : "Your personal information and career aspirations"}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column - Avatar and Basic Info */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="lg:col-span-4 bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border border-white/30 text-center h-fit"
          >
            <div className="relative inline-block mb-6">
              <motion.img
                src={profile.avatar_url || "/default-avatar.png"}
                alt="Profile Avatar"
                className="w-32 h-32 rounded-full mx-auto shadow-2xl object-cover border-4 border-white"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${profile.first_name || ""} ${profile.last_name || ""}`
                  )}&background=0ea5e9&color=fff&size=128`;
                }}
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-3 border-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {`${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
                "User"}
            </h2>

            <motion.div
              className="flex items-center justify-center text-gray-600 mb-6"
              variants={detailItemVariants}
            >
              <div className="flex items-center px-3 py-2 bg-sky-50 rounded-full">
                <Mail className="mr-2 h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium">{profile.email}</span>
              </div>
            </motion.div>

            {/* Role Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full text-sm font-semibold shadow-lg mb-6"
              variants={detailItemVariants}
            >
              {isExpert ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Expert
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Applicant
                </>
              )}
            </motion.div>

            {/* Edit Profile Button */}
            <motion.div
              onClick={() => setIsEditing(!isEditing)}
              variants={detailItemVariants}
            >
              <div className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Detailed Information */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-8 bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-8 border border-white/30"
          >
            <div className="space-y-8">
              {/* Bio Section */}
              <motion.div
                variants={detailItemVariants}
                className="pb-6 border-b border-gray-100"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-sky-100 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-sky-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Bio</h3>
                </div>
                <p className="text-gray-600 leading-relaxed pl-12">
                  {profile.bio ||
                    "No bio provided yet. Consider adding a brief description about yourself."}
                </p>
              </motion.div>

              {/* Expert-Specific Information */}
              {isExpert && (
                <>
                  {/* Professional Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={detailItemVariants}>
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3">
                          <Briefcase className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Specialty
                        </h3>
                      </div>
                      <p className="text-gray-600 pl-12 font-medium">
                        {profile.specialty || "Not specified"}
                      </p>
                    </motion.div>

                    <motion.div variants={detailItemVariants}>
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Experience
                        </h3>
                      </div>
                      <p className="text-gray-600 pl-12 font-medium">
                        {profile.years_exp
                          ? `${profile.years_exp} years`
                          : "Not specified"}
                      </p>
                    </motion.div>
                  </div>

                  {/* Company */}
                  <motion.div
                    variants={detailItemVariants}
                    className="pb-6 border-b border-gray-100"
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                        <Building className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Company
                      </h3>
                    </div>
                    <p className="text-gray-600 pl-12 font-medium">
                      {profile.company || "Not specified"}
                    </p>
                  </motion.div>

                  {/* Additional Details */}
                  {profile.details && (
                    <motion.div variants={detailItemVariants}>
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3">
                          <Info className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          Additional Details
                        </h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed pl-12">
                        {profile.details}
                      </p>
                    </motion.div>
                  )}
                </>
              )}

              {/* Applicant-Specific Information */}
              {!isExpert && (
                <>
                  {/* Purpose */}
                  <motion.div
                    variants={detailItemVariants}
                    className="pb-6 border-b border-gray-100"
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                        <Target className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Purpose
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed pl-12">
                      {profile.purpose || "No purpose statement provided yet."}
                    </p>
                  </motion.div>

                  {/* Personal Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={detailItemVariants}>
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Age
                        </h3>
                      </div>
                      <p className="text-gray-600 pl-12 font-medium">
                        {profile.age
                          ? `${profile.age} years old`
                          : "Not specified"}
                      </p>
                    </motion.div>

                    <motion.div variants={detailItemVariants}>
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-pink-100 rounded-lg mr-3">
                          <Users className="h-5 w-5 text-pink-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Gender
                        </h3>
                      </div>
                      <p className="text-gray-600 pl-12 font-medium">
                        {profile.gender || "Not specified"}
                      </p>
                    </motion.div>
                  </div>

                  {/* Career Path */}
                  <motion.div variants={detailItemVariants}>
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                        <MapPin className="h-5 w-5 text-yellow-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        Desired Career Path
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed pl-12 font-medium">
                      {profile.career || "Career path not specified yet."}
                    </p>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
          onClick={() => setIsEditing(!isEditing)}
        >
          <div className="inline-flex items-center space-x-4 px-6 py-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
            <span className="text-gray-600 font-medium">
              Need to update your information?
            </span>
            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
