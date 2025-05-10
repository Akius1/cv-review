"use client";

import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";
import { ArrowLeft, Briefcase, Star, Shield, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function ExpertRegisterPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const benefitVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  const benefits = [
    {
      icon: <Briefcase className="h-5 w-5 text-indigo-500" />,
      title: "Flexible Schedule",
      description:
        "Work on your own time and choose the applications you want to review.",
    },
    {
      icon: <Star className="h-5 w-5 text-amber-500" />,
      title: "Build Your Reputation",
      description: "Earn ratings and grow your profile as an industry expert.",
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "Secure Payments",
      description: "Get paid promptly for every application you review.",
    },
    {
      icon: <Trophy className="h-5 w-5 text-purple-500" />,
      title: "Professional Growth",
      description:
        "Network with other experts and stay current with industry trends.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <motion.nav
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </motion.nav>

        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join Our Expert Network
          </motion.h1>
          <motion.p
            className="text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Help job seekers succeed by providing professional feedback on their
            applications
          </motion.p>
        </div>

        <motion.div
          className="flex flex-col items-center justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Card with form and benefits side by side */}
          <motion.div
            className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
            variants={itemVariants}
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left side - Benefits */}
              <div className="w-full lg:w-2/5 bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-6">
                  Why Become an Expert?
                </h2>

                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start"
                      variants={benefitVariants}
                      custom={index}
                    >
                      <div className="bg-white/20 p-2 rounded-lg mr-4">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {benefit.title}
                        </h3>
                        <p className="text-indigo-100 text-sm">
                          {benefit.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-indigo-500/30">
                  <p className="text-indigo-100 text-sm italic">
                    Joining as an expert has been incredibly rewarding. I&apos;ve
                    helped hundreds of applicants improve their chances of
                    landing their dream jobs.
                  </p>
                  <p className="text-indigo-200 text-sm mt-2 font-medium">
                    — Michael T., HR Professional
                  </p>
                </div>
              </div>

              {/* Right side - Registration Form */}
              <div className="w-full lg:w-3/5 p-8">
                <RegisterForm userType="expert" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-600">
            Need your CV reviewed instead?{" "}
            <Link
              href="/auth/register/applicant"
              className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
            >
              Register as an applicant
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
