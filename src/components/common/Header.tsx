/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FileCheck, Bell, LogOut, Menu, X, User, Settings } from "lucide-react";

interface HeaderProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
}

export default function Header({
  user,
  activeTab,
  setActiveTab,
  handleLogout,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "Your CV has been reviewed by Sarah Johnson",
      isRead: false,
      date: "2025-05-08T14:30:00",
    },
    {
      id: 2,
      message: "New feedback available for your Marketing CV",
      isRead: false,
      date: "2025-05-07T09:15:00",
    },
    {
      id: 3,
      message: "Weekly job matches available based on your profile",
      isRead: true,
      date: "2025-05-06T11:45:00",
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return diffInHours === 0 ? "Just now" : `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
            <div className="flex-shrink-0 flex items-center">
              <Link href="/applicant/dashboard" className="flex items-center">
                <div className="bg-indigo-600 text-white p-1 rounded mr-2">
                  <FileCheck className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {activeTab}
                </span>
              </Link>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <p className="text-sm font-medium text-gray-900">
              Welcome {user?.first_name} 
            </p>

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                className="relative p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-6 w-6" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 ${
                              !notification.isRead ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <p className="text-sm text-gray-700">
                                {notification.message}
                              </p>
                              {!notification.isRead && (
                                <span className="ml-2 h-2 w-2 rounded-full bg-blue-500"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateRelative(notification.date)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No new notifications
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-2 border-t text-center">
                      <Link
                        href="/applicant/notifications"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                  {user?.first_name ? user.first_name.charAt(0) : "U"}
                </div>
              </button>

              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      href="/applicant/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="mr-3 h-5 w-5 text-gray-400" />
                      Your Profile
                    </Link>

                    <Link
                      href="/applicant/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
              activeTab === "dashboard"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => {
              setActiveTab("cvs");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
              activeTab === "cvs"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            My CVs
          </button>

          <button
            onClick={() => {
              setActiveTab("feedback");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
              activeTab === "feedback"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Feedback
          </button>

          <button
            onClick={() => {
              setActiveTab("profile");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
              activeTab === "profile"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Profile
          </button>

          <div className="pt-4 pb-2">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                  {user?.first_name ? user.first_name.charAt(0) : "U"}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-sm font-medium text-gray-500 truncate max-w-[200px]">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
