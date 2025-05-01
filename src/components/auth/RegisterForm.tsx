"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface RegisterFormProps {
  userType: "applicant" | "expert";
}

export default function RegisterForm({ userType }: RegisterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    // Confirm password validation
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        mode: "cors",
        credentials: "include", // Add this line
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          user_type: userType,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Registration failed");
      }

      // Redirect based on user type
      if (userType === "applicant") {
        router.push("/applicant/dashboard");
      } else {
        router.push("/expert/dashboard");
      }
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {userType === "applicant"
          ? "Applicant Registration"
          : "Expert Registration"}
      </h2>

      {serverError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name
            </Label>
            <Input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="phone_number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.phone_number ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.phone_number && (
            <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
          )}
        </div>

        <div className="mb-4">
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

        <div className="mb-6">
          <label
            htmlFor="confirm_password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.confirm_password ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.confirm_password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirm_password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
          Login
        </Link>
      </p>
    </div>
  );
}
