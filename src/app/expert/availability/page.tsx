/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  VideoCameraIcon,
  UserGroupIcon,
  InformationCircleIcon,
  FunnelIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface TimeSlot {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  maxBookings: number;
  currentBookings?: number;
  isSelected?: boolean;
}

interface AvailabilityPreference {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  availability?: any[];
  preferences?: any[];
  error?: string;
}

type FilterPeriod = "day" | "week" | "month" | "all";

export default function AvailabilityManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"calendar" | "preferences">(
    "calendar"
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [preferences, setPreferences] = useState<AvailabilityPreference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    out: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  useEffect(() => {
    fetchAvailability();
    fetchPreferences();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterPeriod, filterDate, allTimeSlots]);

  const fetchAvailability = async () => {
    setIsLoading(true);
    try {
      // Fetch all availability data initially
      const response = await fetch(`/api/expert/availability?period=all`);
      const data: ApiResponse = await response.json();

      if (data.success && data.availability) {
        const slots: TimeSlot[] = data.availability.map((slot: any) => ({
          id: slot.id,
          date: slot.date,
          startTime: slot.start_time.substring(0, 5), // "09:00"
          endTime: slot.end_time.substring(0, 5), // "10:00"
          timezone: slot.timezone,
          maxBookings: slot.max_bookings,
          currentBookings: slot.bookings
            ? slot.bookings.filter((b: any) => b.status === "scheduled").length
            : 0,
        }));
        setAllTimeSlots(slots);
        setTimeSlots(slots);
      } else {
        setAllTimeSlots([]);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setMessage({ type: "error", text: "Failed to load availability" });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    if (filterPeriod === "all") {
      setTimeSlots(allTimeSlots);
      return;
    }

    const baseDate = new Date(filterDate);
    let filteredSlots: TimeSlot[] = [];

    switch (filterPeriod) {
      case "day":
        filteredSlots = allTimeSlots.filter((slot) => slot.date === filterDate);
        break;

      case "week":
        // Get the start of the week (Monday)
        const startOfWeek = new Date(baseDate);
        const dayOfWeek = startOfWeek.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), subtract 6; otherwise subtract (dayOfWeek - 1)
        startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        filteredSlots = allTimeSlots.filter((slot) => {
          const slotDate = new Date(slot.date);
          return slotDate >= startOfWeek && slotDate <= endOfWeek;
        });
        break;

      case "month":
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();

        filteredSlots = allTimeSlots.filter((slot) => {
          const slotDate = new Date(slot.date);
          return (
            slotDate.getFullYear() === year && slotDate.getMonth() === month
          );
        });
        break;
    }

    setTimeSlots(filteredSlots);
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/expert/availability/preferences");
      const data: ApiResponse = await response.json();

      if (data.success) {
        setPreferences(data.preferences || []);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      date: selectedDate,
      startTime: "09:00",
      endTime: "10:00",
      timezone: "Africa/Lagos", // Default to WAT
      maxBookings: 1,
      isSelected: true,
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const deleteExistingSlot = async (slotId: number) => {
    try {
      const response = await fetch(`/api/expert/availability?id=${slotId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Availability slot deleted successfully!",
        });
        fetchAvailability(); // Refresh the list
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete availability slot",
        });
      }
    } catch (error) {
      console.error("Error deleting availability:", error);
      setMessage({ type: "error", text: "Failed to delete availability slot" });
    }
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    try {
      const slotsToSave = timeSlots
        .filter((slot) => !slot.id)
        .map((slot) => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: slot.timezone,
          maxBookings: slot.maxBookings,
        }));

      if (slotsToSave.length === 0) {
        setMessage({ type: "error", text: "No new slots to save" });
        setIsSaving(false);
        return;
      }

      const response = await fetch("/api/expert/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: slotsToSave }),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Availability saved successfully!",
        });
        fetchAvailability(); // Refresh the list
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save availability",
        });
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      setMessage({ type: "error", text: "Failed to save availability" });
    } finally {
      setIsSaving(false);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const getFilterLabel = () => {
    switch (filterPeriod) {
      case "day":
        return `Day: ${new Date(filterDate).toLocaleDateString()}`;
      case "week":
        const baseDate = new Date(filterDate);
        const startOfWeek = new Date(baseDate);
        const dayOfWeek = startOfWeek.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Week: ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
      case "month":
        return `Month: ${new Date(filterDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      case "all":
        return "All Slots";
    }
  };

  const groupSlotsByDate = () => {
    const grouped = timeSlots.reduce(
      (acc, slot) => {
        if (!acc[slot.date]) {
          acc[slot.date] = [];
        }
        acc[slot.date].push(slot);
        return acc;
      },
      {} as Record<string, TimeSlot[]>
    );

    // Sort dates and slots within each date
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  };

  return (
    <AuthGuard userType="expert">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm shadow-xl sticky top-0 z-50 border-b border-white/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/expert/dashboard")}
                  className="h-12 w-12 flex items-center justify-center rounded-xl bg-white/70 text-sky-600 hover:bg-sky-50 transition-all duration-300 shadow-lg border border-white/30"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </motion.button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                    Manage Availability
                  </h1>
                  <p className="text-sm text-gray-600">
                    Set your available times for CV consultations
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="hidden md:flex bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/30">
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`px-6 py-2.5 font-medium text-sm rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "calendar"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-sky-600 hover:bg-white/50"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>Calendar View</span>
                </button>
                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`px-6 py-2.5 font-medium text-sm rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                    activeTab === "preferences"
                      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-sky-600 hover:bg-white/50"
                  }`}
                >
                  <ClockIcon className="h-4 w-4" />
                  <span>Preferences</span>
                </button>
              </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="flex mt-4 bg-white/60 backdrop-blur-sm p-1 rounded-xl md:hidden shadow-lg border border-white/30">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  activeTab === "calendar"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600"
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                  activeTab === "preferences"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600"
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                <span>Preferences</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <motion.main
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
        >
          {/* Success/Error Messages */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckIcon className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <XMarkIcon className="h-5 w-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
                <button
                  onClick={() => setMessage(null)}
                  className="ml-auto hover:opacity-70"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Date Selector & Add Button */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Schedule Availability
                      </h2>
                      <p className="text-gray-600">
                        Add time slots when you&apos;re available for CV
                        consultations
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addTimeSlot}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:from-sky-600 hover:to-blue-700 transition-all duration-300"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add Slot</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-6 border border-white/30"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-3">
                      <FunnelIcon className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Filter Availability
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {timeSlots.length} slots
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                          Filter by:
                        </label>
                        <select
                          value={filterPeriod}
                          onChange={(e) =>
                            setFilterPeriod(e.target.value as FilterPeriod)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        >
                          <option value="all">All Time</option>
                          <option value="day">Single Day</option>
                          <option value="week">Week</option>
                          <option value="month">Month</option>
                        </select>
                      </div>

                      {filterPeriod !== "all" && (
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Date:
                          </label>
                          <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                          />
                        </div>
                      )}

                      <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <span className="font-medium">Showing:</span>{" "}
                        {getFilterLabel()}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Time Slots */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
                >
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Available Time Slots
                    </h3>
                  </div>

                  <div className="p-6">
                    {isLoading ? (
                      <div className="text-center py-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-gray-600">Loading availability...</p>
                      </div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-center py-12">
                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          {filterPeriod === "all"
                            ? "No time slots yet"
                            : `No slots found for ${getFilterLabel()}`}
                        </h3>
                        <p className="text-gray-500 mb-6">
                          {filterPeriod === "all"
                            ? "Add your first availability slot to get started"
                            : "Try adjusting your filter or add new slots for this period"}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={addTimeSlot}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300"
                        >
                          <PlusIcon className="h-5 w-5" />
                          <span>Add First Slot</span>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="space-y-6 max-h-96 overflow-y-auto">
                        {Object.entries(groupSlotsByDate()).map(
                          ([date, slots]) => (
                            <div key={date} className="space-y-3">
                              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                                <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">
                                  {new Date(date).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </h4>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {slots.length} slot
                                  {slots.length !== 1 ? "s" : ""}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {slots.map((slot, index) => (
                                  <motion.div
                                    key={slot.id || `new-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                      slot.id
                                        ? "border-green-200 bg-green-50"
                                        : "border-blue-200 bg-blue-50 border-dashed"
                                    }`}
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Date
                                        </label>
                                        <input
                                          type="date"
                                          value={slot.date}
                                          onChange={(e) =>
                                            updateTimeSlot(
                                              index,
                                              "date",
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                          disabled={!!slot.id}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Start Time
                                        </label>
                                        <select
                                          value={slot.startTime}
                                          onChange={(e) =>
                                            updateTimeSlot(
                                              index,
                                              "startTime",
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                          disabled={!!slot.id}
                                        >
                                          {generateTimeOptions().map((time) => (
                                            <option key={time} value={time}>
                                              {time}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          End Time
                                        </label>
                                        <select
                                          value={slot.endTime}
                                          onChange={(e) =>
                                            updateTimeSlot(
                                              index,
                                              "endTime",
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                          disabled={!!slot.id}
                                        >
                                          {generateTimeOptions().map((time) => (
                                            <option key={time} value={time}>
                                              {time}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Max Bookings
                                        </label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="10"
                                          value={slot.maxBookings}
                                          onChange={(e) =>
                                            updateTimeSlot(
                                              index,
                                              "maxBookings",
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                          disabled={!!slot.id}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Timezone
                                        </label>
                                        <select
                                          value={slot.timezone}
                                          onChange={(e) =>
                                            updateTimeSlot(
                                              index,
                                              "timezone",
                                              e.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                          disabled={!!slot.id}
                                        >
                                          <option value="Africa/Lagos">
                                            West Africa Time (WAT)
                                          </option>
                                          <option value="UTC">UTC</option>
                                          <option value="America/New_York">
                                            Eastern Time
                                          </option>
                                          <option value="America/Chicago">
                                            Central Time
                                          </option>
                                          <option value="America/Denver">
                                            Mountain Time
                                          </option>
                                          <option value="America/Los_Angeles">
                                            Pacific Time
                                          </option>
                                          <option value="Europe/London">
                                            London Time
                                          </option>
                                        </select>
                                      </div>

                                      <div className="flex flex-col items-end space-y-2">
                                        {slot.id ? (
                                          <>
                                            <div className="flex items-center space-x-2 text-green-600">
                                              <CheckIcon className="h-4 w-4" />
                                              <span className="text-sm font-medium">
                                                Saved
                                              </span>
                                            </div>
                                            {slot.currentBookings !==
                                              undefined && (
                                              <div className="text-xs text-gray-500">
                                                {slot.currentBookings}/
                                                {slot.maxBookings} booked
                                              </div>
                                            )}
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() =>
                                                deleteExistingSlot(slot.id!)
                                              }
                                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                              title="Delete this slot"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </motion.button>
                                          </>
                                        ) : (
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() =>
                                              removeTimeSlot(index)
                                            }
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </motion.button>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {timeSlots.some((slot) => !slot.id) && (
                    <div className="px-6 pb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={saveAvailability}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isSaving ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-5 w-5" />
                            <span>Save Availability</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "preferences" && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Weekly Preferences */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
                >
                  <div className="bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Weekly Availability Preferences
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">
                      Set your regular weekly schedule for automatic slot
                      generation
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="text-center py-12">
                      <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Preferences Coming Soon
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Set up recurring weekly availability patterns to
                        automatically generate time slots
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Weekly Patterns
                          </h4>
                          <p className="text-sm text-gray-500">
                            Set regular hours for each day of the week
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Auto-Generation
                          </h4>
                          <p className="text-sm text-gray-500">
                            Automatically create slots based on your patterns
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Buffer Times
                          </h4>
                          <p className="text-sm text-gray-500">
                            Set breaks between meetings
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Meeting Templates */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
                >
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <VideoCameraIcon className="h-5 w-5 mr-2" />
                      Meeting Templates
                    </h3>
                    <p className="text-emerald-100 text-sm mt-1">
                      Predefined meeting types for different consultation needs
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-blue-900">
                            CV Review Session
                          </h4>
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                            60 min
                          </span>
                        </div>
                        <p className="text-blue-700 text-sm mb-4">
                          Detailed review of your CV with feedback and
                          suggestions
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600 font-medium">
                            Google Meet
                          </span>
                          <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">
                            Default
                          </span>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-emerald-900">
                            Quick CV Consultation
                          </h4>
                          <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs rounded-full">
                            30 min
                          </span>
                        </div>
                        <p className="text-emerald-700 text-sm mb-4">
                          Brief consultation about your CV structure and key
                          points
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-600 font-medium">
                            Google Meet
                          </span>
                          <span className="text-xs text-emerald-600 bg-emerald-200 px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-purple-900">
                            Career Guidance Meeting
                          </h4>
                          <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full">
                            45 min
                          </span>
                        </div>
                        <p className="text-purple-700 text-sm mb-4">
                          Discussion about career path and opportunities
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-600 font-medium">
                            Google Meet
                          </span>
                          <span className="text-xs text-purple-600 bg-purple-200 px-2 py-1 rounded">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>Create New Template</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent Bookings Section */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-white/30"
          >
            <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Recent Bookings & Upcoming Meetings
              </h3>
              <p className="text-cyan-100 text-sm mt-1">
                Your scheduled meetings and recent booking activity
              </p>
            </div>

            <div className="p-6">
              <div className="text-center py-12">
                <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No meetings scheduled yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Once applicants book meetings with you, they will appear here
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <h4 className="font-medium text-gray-700 mb-2">Upcoming</h4>
                    <p className="text-sm text-gray-500">
                      Scheduled meetings with applicants
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Past Meetings
                    </h4>
                    <p className="text-sm text-gray-500">
                      Completed consultation sessions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tips & Help Section */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border-2 border-blue-200"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <InformationCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Tips for Managing Your Availability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="space-y-2">
                    <p>
                      • <strong>Set buffer time:</strong> Allow 15-30 minutes
                      between meetings
                    </p>
                    <p>
                      • <strong>Block recurring slots:</strong> Use weekly
                      patterns for consistency
                    </p>
                    <p>
                      • <strong>Update regularly:</strong> Keep your
                      availability current
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p>
                      • <strong>Time zones matter:</strong> Consider your
                      applicants&apos; locations
                    </p>
                    <p>
                      • <strong>Meeting types:</strong> Offer different
                      consultation lengths
                    </p>
                    <p>
                      • <strong>Be specific:</strong> Clear descriptions help
                      applicants choose
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </div>
    </AuthGuard>
  );
}
