/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: /app/schedule/page.tsx
// Frontend page for applicants to view and book available slots
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Availability, Expert } from "@/types";
// import { createClientComponentClient } from "@/lib/supabase";

export default function SchedulePage() {
  const [availableSlots, setAvailableSlots] = useState<
    (Availability & { expert: Expert })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<
    (Availability & { expert: Expert }) | null
  >(null);
  const [applicantData, setApplicantData] = useState({
    name: "",
    email: "",
  });
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const router = useRouter();

  // Get client-side Supabase instance
  //   const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchAvailableSlots() {
      try {
        const response = await fetch("/api/availabilities");
        if (!response.ok) {
          throw new Error("Failed to fetch available slots");
        }
        const data = await response.json();
        setAvailableSlots(data);
      } catch (err) {
        setError("Error loading available slots. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableSlots();
  }, []);

  const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApplicantData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBooking = async () => {
    if (!selectedSlot || !applicantData.name || !applicantData.email) {
      setError("Please fill in all required fields");
      return;
    }

    setBooking(true);
    setError("");

    try {
      // First create or get applicant
      const applicantResponse = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicantData),
      });

      if (!applicantResponse.ok) {
        throw new Error("Failed to create applicant");
      }

      const applicant = await applicantResponse.json();

      // Then book the slot
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityId: selectedSlot.id,
          applicantId: applicant?.id,
        }),
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.error || "Failed to book slot");
      }

      setBookingSuccess(true);

      // Show success for a moment before redirecting
      setTimeout(() => {
        router.push("/schedule/confirmation");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred during booking");
      console.error(err);
    } finally {
      setBooking(false);
    }
  };

  const groupSlotsByExpert = () => {
    const groupedSlots: Record<
      string,
      { expert: Expert; slots: (Availability & { expert: Expert })[] }
    > = {};

    availableSlots?.forEach((slot) => {
      const expertId = slot.expert.id;
      if (!groupedSlots[expertId]) {
        groupedSlots[expertId] = {
          expert: slot.expert,
          slots: [],
        };
      }
      groupedSlots[expertId].slots.push(slot);
    });

    return Object.values(groupedSlots);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Loading available slots...
            </h1>
            <div className="mt-6 flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Booking Successful!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Check your email for interview details.
            </p>
            <p className="mt-1 text-gray-500">
              Redirecting to confirmation page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const expertGroups = groupSlotsByExpert();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Schedule Your Interview
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Select an available time slot with one of our experts
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Available slots section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Available Time Slots
              </h2>
            </div>
            <div className="bg-white p-6">
              {expertGroups.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No available slots found
                </p>
              ) : (
                expertGroups.map((group) => (
                  <div key={group.expert.id} className="mb-8">
                    <h3 className="text-md font-semibold mb-3 pb-2 border-b border-gray-200">
                      {group.expert.name} - {group.expert.expertise.join(", ")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`${
                            selectedSlot?.id === slot.id
                              ? "bg-blue-50 border-blue-500"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          } border rounded-md p-3 cursor-pointer transition`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <div className="font-medium">
                            {format(parseISO(slot.start_time), "MMMM d, yyyy")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(parseISO(slot.start_time), "h:mm a")} -
                            {format(parseISO(slot.end_time), "h:mm a")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Applicant details section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Your Information
              </h2>
            </div>
            <div className="bg-white p-6">
              {selectedSlot ? (
                <div>
                  <div className="mb-6 p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-900">
                      Selected Time Slot
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      {format(
                        parseISO(selectedSlot.start_time),
                        "MMMM d, yyyy"
                      )}{" "}
                      at {format(parseISO(selectedSlot.start_time), "h:mm a")} -
                      {format(parseISO(selectedSlot.end_time), "h:mm a")}
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      Expert: {selectedSlot.expert.name}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={applicantData.name}
                        onChange={handleApplicantChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={applicantData.email}
                        onChange={handleApplicantChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleBooking}
                        disabled={
                          booking || !applicantData.name || !applicantData.email
                        }
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          booking || !applicantData.name || !applicantData.email
                            ? "bg-blue-300 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        }`}
                      >
                        {booking ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            Processing...
                          </>
                        ) : (
                          "Book Interview"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No time slot selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please select an available time slot from the left panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
