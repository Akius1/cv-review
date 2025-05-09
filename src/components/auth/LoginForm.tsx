/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

// Define AuthResponse type
export interface AuthResponse {
  user?: {
    user_type: string;
    [key: string]: any;
  };
  error?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Identifier validation (email or phone)
    if (!formData.identifier.trim()) {
      newErrors.identifier = "Email or phone number is required";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect based on user type
      if (data?.user?.user_type === "applicant") {
        router.push("/applicant/dashboard");
      } else {
        router.push("/expert/dashboard");
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine icon for identifier field
  const identifierIcon = formData.identifier.includes("@") ? (
    <Mail size={18} />
  ) : (
    <Phone size={18} />
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white py-8 px-10 shadow-xl rounded-xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Sign In
        </h2>

        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-start"
          >
            <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="mb-5" variants={itemVariants}>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email or Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                {identifierIcon}
              </div>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border ${
                  errors.identifier ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                placeholder="Enter your email or phone"
              />
            </div>
            {errors.identifier && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.identifier}
              </p>
            )}
          </motion.div>

          <motion.div className="mb-6" variants={itemVariants}>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-3 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="mr-1 h-3 w-3" />
                {errors.password}
              </p>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center">
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </motion.button>
          </motion.div>
        </motion.form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account yet?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/auth/register/applicant"
                className="inline-flex items-center justify-center py-2 px-4 border border-indigo-600 rounded-lg text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition-colors duration-200"
              >
                Register as Applicant
              </Link>
              <Link
                href="/auth/register/expert"
                className="inline-flex items-center justify-center py-2 px-4 border border-purple-600 rounded-lg text-purple-600 text-sm font-medium hover:bg-purple-50 transition-colors duration-200"
              >
                Register as Expert
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex justify-center"
      >
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            Trusted by professionals from
          </p>
          <div className="flex space-x-6 justify-center items-center">
            <div className="h-5 w-16 bg-gray-400 opacity-50 rounded"></div>
            <div className="h-5 w-20 bg-gray-400 opacity-50 rounded"></div>
            <div className="h-5 w-16 bg-gray-400 opacity-50 rounded"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
