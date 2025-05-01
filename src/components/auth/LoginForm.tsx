"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthResponse } from "@/app/applicant/cv/[id]/page";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

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

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      {serverError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="identifier"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email or Phone Number
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.identifier ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter your email or phone number"
          />
          {errors.identifier && (
            <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register/applicant"
            className="text-blue-600 hover:text-blue-800"
          >
            Register as Applicant
          </Link>
        </p>
        <p className="mt-2">
          <Link
            href="/auth/register/expert"
            className="text-blue-600 hover:text-blue-800"
          >
            Register as Expert
          </Link>
        </p>
      </div>
    </div>
  );
}
