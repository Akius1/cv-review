"use client";

import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ApplicantRegisterPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </nav>

        <motion.div
          className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column - Registration Form */}
          <motion.div className="w-full lg:w-1/2" variants={itemVariants}>
            <RegisterForm userType="applicant" />
          </motion.div>

          {/* Right Column - Benefits */}
          <motion.div
            className="w-full lg:w-1/2 xl:w-2/5"
            variants={itemVariants}
          >
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Applicant Benefits
                </h2>
              </div>

              <ul className="space-y-4">
                {[
                  "Get expert feedback on your CV from industry professionals",
                  "Understand how recruiters view your application",
                  "Receive personalized improvement suggestions",
                  "Increase your chances of landing interviews",
                  "Track your progress with detailed analytics",
                ].map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3">
                  How it works:
                </h3>
                <ol className="space-y-3">
                  {[
                    "Create your account",
                    "Upload your CV",
                    "Get matched with experts in your field",
                    "Receive detailed feedback within 48 hours",
                    "Apply with confidence",
                  ].map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                  Looking to provide expert reviews?{" "}
                  <Link
                    href="/auth/register/expert"
                    className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                  >
                    Register as an expert
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
