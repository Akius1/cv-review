"use client";

import { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import ProfileForm from "@/components/ProfileForm";
import ProfileDisplay from "@/components/ProfileDisplay";
import Link from "next/link";
import {
  ChevronLeft,
  Edit,
  X,
  UserCheck,
  Eye,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

export default function ExpertProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <motion.div
          className="relative z-10"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
        >
          {/* Enhanced Header */}
          <motion.header
            className="bg-white/80 backdrop-blur-sm shadow-xl border-b border-white/30 sticky top-0 z-50"
            variants={headerVariants}
            initial="initial"
            animate="animate"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left Side - Navigation */}
                <div className="flex items-center space-x-4">
                  <Link
                    href="/expert/dashboard"
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 group"
                  >
                    <ChevronLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span className="font-medium">Dashboard</span>
                  </Link>

                  <div className="hidden sm:flex items-center text-gray-400">
                    <span className="mx-2">/</span>
                    <div className="flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-sky-600" />
                      <span className="text-gray-700 font-medium">
                        Expert Profile
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center - Page Title (Mobile) */}
                <div className="sm:hidden">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-sky-600" />
                    <span className="font-semibold text-gray-800">Profile</span>
                  </div>
                </div>

                {/* Right Side - Actions */}
                <div className="flex items-center space-x-3">
                  {/* Mode Indicator */}
                  <div className="hidden md:flex items-center px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
                    {isEditing ? (
                      <>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Mode
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        View Mode
                      </>
                    )}
                  </div>

                  {/* Toggle Button */}
                  <motion.button
                    onClick={() => setIsEditing(!isEditing)}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center px-4 py-2 rounded-xl shadow-lg font-semibold transition-all duration-300 ${
                      isEditing
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                        : "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:via-blue-700 hover:to-indigo-700 text-white"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Cancel</span>
                        <span className="sm:hidden">Cancel</span>
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={isEditing ? "editing" : "display"}
                variants={contentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {isEditing ? (
                  <ProfileForm role="expert" />
                ) : (
                  <ProfileDisplay role="expert" />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Enhanced Footer */}
          <motion.footer
            className="relative z-10 mt-16 bg-white/60 backdrop-blur-sm border-t border-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mr-3">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-600 font-medium">
                    Expert Portal
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>© 2025 YourApp</span>
                  <Link
                    href="/expert/settings"
                    className="flex items-center hover:text-gray-700 transition-colors duration-200"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </motion.footer>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
