"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Camera,
  Info,
  Briefcase,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  User,
  Building,
  FileText,
  Target,
  Clock,
  UserCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface ProfileFormProps {
  role: "expert" | "applicant";
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
  out: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } },
};

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function ProfileForm({ role }: ProfileFormProps) {
  const router = useRouter();
  const isExpert = role === "expert";

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // expert fields
  const [specialty, setSpecialty] = useState("");
  const [yearsExp, setYearsExp] = useState(0);
  const [company, setCompany] = useState("");
  const [details, setDetails] = useState("");

  // applicant fields
  const [purpose, setPurpose] = useState("");
  const [age, setAge] = useState(0);
  const [gender, setGender] = useState("");
  const [career, setCareer] = useState("");

  useEffect(() => {
    axios
      .get(`/api/${role}/profile`)
      .then((res) => {
        const p = res.data;
        if (!p) return;
        setBio(p.bio || "");
        setAvatarUrl(p.avatar_url || "");
        if (isExpert) {
          setSpecialty(p.specialty || "");
          setYearsExp(p.years_exp || 0);
          setCompany(p.company || "");
          setDetails(p.details || "");
        } else {
          setPurpose(p.purpose || "");
          setAge(p.age || 0);
          setGender(p.gender || "");
          setCareer(p.career || "");
        }
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [role, isExpert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSuccess(false);

    try {
      const payload = isExpert
        ? {
            bio,
            specialty,
            years_exp: yearsExp,
            company,
            details,
            avatar_url: avatarUrl,
          }
        : { bio, purpose, age, gender, career, avatar_url: avatarUrl };

      await axios.put(`/api/${role}/profile`, payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-100 relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-sky-400/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
        variants={pageVariants}
        initial="initial"
        animate="in"
        exit="out"
      >
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href={`/${role}/dashboard`}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </motion.div>

        {/* Header Section */}
        <motion.div
          className="text-center mb-10"
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
            {isExpert ? "Expert Profile" : "Applicant Profile"}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isExpert
              ? "Share your expertise and help shape careers with your valuable insights"
              : "Tell us about yourself and your career aspirations"}
          </p>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl flex items-center shadow-lg"
          >
            <CheckCircle2 className="mr-3 h-5 w-5 text-green-500" />
            <span className="font-medium">Profile updated successfully!</span>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl flex items-start shadow-lg"
          >
            <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        {/* Main Form Card */}
        <motion.div
          className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-white/30 overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="p-8 md:p-10">
            <motion.form
              onSubmit={handleSubmit}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Bio Section */}
              <motion.div variants={itemVariants} className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-2 text-sky-600" />
                  Bio
                </label>
                <div className="relative">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 resize-none bg-white/50 backdrop-blur-sm"
                    placeholder={
                      isExpert
                        ? "Share your professional background and expertise..."
                        : "Tell us about yourself..."
                    }
                  />
                </div>
              </motion.div>

              {/* Role-Specific Fields */}
              {isExpert ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Specialty */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Briefcase className="inline h-4 w-4 mr-2 text-sky-600" />
                        Specialty
                      </label>
                      <div className="relative">
                        <input
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="e.g. Engineering, Finance, Marketing"
                        />
                      </div>
                    </motion.div>

                    {/* Years Experience */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Clock className="inline h-4 w-4 mr-2 text-sky-600" />
                        Years of Experience
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={yearsExp}
                          onChange={(e) => setYearsExp(+e.target.value)}
                          min="0"
                          max="50"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Years of experience"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Company */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Building className="inline h-4 w-4 mr-2 text-sky-600" />
                        Company
                      </label>
                      <div className="relative">
                        <input
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Your current company"
                        />
                      </div>
                    </motion.div>

                    {/* Details */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Info className="inline h-4 w-4 mr-2 text-sky-600" />
                        Additional Details
                      </label>
                      <div className="relative">
                        <textarea
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 resize-none bg-white/50 backdrop-blur-sm"
                          placeholder="Any additional information about your expertise"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Purpose */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Target className="inline h-4 w-4 mr-2 text-sky-600" />
                        Purpose
                      </label>
                      <div className="relative">
                        <textarea
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 resize-none bg-white/50 backdrop-blur-sm"
                          placeholder="Why did you join our platform?"
                        />
                      </div>
                    </motion.div>

                    {/* Career */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <MapPin className="inline h-4 w-4 mr-2 text-sky-600" />
                        Career Path
                      </label>
                      <div className="relative">
                        <input
                          value={career}
                          onChange={(e) => setCareer(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Your desired career path"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Age */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Calendar className="inline h-4 w-4 mr-2 text-sky-600" />
                        Age
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(+e.target.value)}
                          min="16"
                          max="100"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                          placeholder="Your age"
                        />
                      </div>
                    </motion.div>

                    {/* Gender */}
                    <motion.div variants={itemVariants} className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Users className="inline h-4 w-4 mr-2 text-sky-600" />
                        Gender
                      </label>
                      <div className="relative">
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm appearance-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Avatar URL */}
              <motion.div variants={itemVariants} className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <Camera className="inline h-4 w-4 mr-2 text-sky-600" />
                  Avatar URL
                </label>
                <div className="relative">
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="https://example.com/your-avatar.jpg"
                  />
                </div>
                {avatarUrl && (
                  <div className="mt-3 flex items-center space-x-3">
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-sky-200"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="text-sm text-gray-500">
                      Avatar preview
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-6">
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02, y: saving ? 0 : -2 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  className="w-full flex items-center justify-center py-4 px-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-5 h-5 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full mr-3"
                      />
                      Saving Profile...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      {isExpert ? "Update Expert Profile" : "Update Profile"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </div>
                  )}
                </motion.button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>

        {/* Settings Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
            <span className="text-sm text-gray-600 mr-2">
              Need to change your login details?
            </span>
            <Link
              href={`/${role}/settings`}
              className="text-sky-600 hover:text-sky-700 font-medium text-sm transition-colors duration-200"
            >
              Go to Settings
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
