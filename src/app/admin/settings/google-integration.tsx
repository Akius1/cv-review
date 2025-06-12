/* eslint-disable @typescript-eslint/no-explicit-any */
// /src/app/expert/settings/google-integration.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

interface GoogleStatus {
  connected: boolean;
  expired: boolean;
  needs_reauth: boolean;
  user_connected: boolean;
  system_connected: boolean;
}

export default function ExpertGoogleIntegrationSettings() {
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Check Google OAuth status
  useEffect(() => {
    checkGoogleStatus();
  }, []);

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch("/api/admin/google-status");
      const data: any = await response.json();
      setGoogleStatus(data);
    } catch (error) {
      console.error("Error checking Google status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    setConnecting(true);
    // Redirect to Google OAuth flow
    window.location.href = "/api/auth/google";
  };

  const getStatusInfo = () => {
    if (!googleStatus) return null;

    if (googleStatus.user_connected) {
      return {
        color: "green",
        icon: CheckCircleIcon,
        title: "Google Meet Integration Active",
        description:
          "Your Google account is connected. Real Google Meet links will be created for your meetings.",
        action: "Reconnect Google Account",
        actionColor: "blue",
      };
    } else if (googleStatus.system_connected) {
      return {
        color: "blue",
        icon: CheckCircleIcon,
        title: "System Google Meet Available",
        description:
          "Another expert has connected Google. You can also connect your account for personalized meetings.",
        action: "Connect Your Google Account",
        actionColor: "green",
      };
    } else if (googleStatus.connected && googleStatus.expired) {
      return {
        color: "yellow",
        icon: ExclamationTriangleIcon,
        title: "Google Authentication Expired",
        description:
          "Please reconnect your Google account to continue creating Google Meet links.",
        action: "Reconnect Google Account",
        actionColor: "yellow",
      };
    } else {
      return {
        color: "gray",
        icon: LinkIcon,
        title: "Google Meet Not Connected",
        description:
          "Connect your Google account to create real Google Meet links for your meetings. Otherwise, Jitsi Meet will be used.",
        action: "Connect Google Account",
        actionColor: "green",
      };
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Google Meet Integration
        </h3>
        <p className="text-sm text-gray-500">
          Connect your Google account to create real Google Meet rooms for your
          consultations
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border-2 border-dashed p-6 ${
          statusInfo.color === "green"
            ? "border-green-300 bg-green-50"
            : statusInfo.color === "blue"
              ? "border-blue-300 bg-blue-50"
              : statusInfo.color === "yellow"
                ? "border-yellow-300 bg-yellow-50"
                : "border-gray-300 bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-3">
          <statusInfo.icon
            className={`h-8 w-8 ${
              statusInfo.color === "green"
                ? "text-green-600"
                : statusInfo.color === "blue"
                  ? "text-blue-600"
                  : statusInfo.color === "yellow"
                    ? "text-yellow-600"
                    : "text-gray-600"
            }`}
          />
          <div className="flex-1">
            <h4 className="text-base font-medium text-gray-900">
              {statusInfo.title}
            </h4>
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>
        </div>

        <div className="mt-4">
          <motion.button
            onClick={handleConnectGoogle}
            disabled={connecting}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              statusInfo.actionColor === "green"
                ? "bg-green-600 hover:bg-green-700"
                : statusInfo.actionColor === "yellow"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            {connecting ? "Connecting..." : statusInfo.action}
          </motion.button>
        </div>
      </motion.div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          How it works:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Connect your Google account using OAuth2 (secure authentication)
          </li>
          <li>
            When applicants book meetings with you, real Google Meet rooms are
            created
          </li>
          <li>Calendar invitations are automatically sent to participants</li>
          <li>
            If Google is not connected, Jitsi Meet rooms are used as fallback
          </li>
          <li>Your Google Calendar will show all scheduled meetings</li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">
          Benefits for Experts:
        </h4>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>Professional Google Meet links for all your consultations</li>
          <li>Automatic calendar sync with your Google Calendar</li>
          <li>Meeting recordings can be saved to Google Drive (if enabled)</li>
          <li>Better integration with your existing workflow</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Environment Setup Required:
        </h4>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            Add these to your{" "}
            <code className="bg-gray-200 px-1 rounded">.env.local</code>:
          </p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {`GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback`}
          </pre>
        </div>
      </div>
    </div>
  );
}
