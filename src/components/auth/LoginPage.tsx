// LoginPage.tsx
"use client";

import { motion } from "framer-motion";

interface LoginPageProps {
  children: React.ReactNode;
}

export default function LoginPage({ children }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute top-48 -left-32 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1.5, delay: 0.4 }}
          className="absolute bottom-32 right-32 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to continue your professional journey
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        {children}
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-4 w-full flex justify-center text-gray-400 text-xs z-10">
        <p>Secure login • © {new Date().getFullYear()} ResumeXpert</p>
      </div>
    </div>
  );
}
