/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
// import { usePathname } from "next/navigation";
import { FileCheck, Bell, LogOut, Menu, X, User } from "lucide-react";

interface HeaderProps {
  user: {
    first_name: string;
    last_name: string;
    email: string;
    user_type: "applicant" | "expert";
  };
  // you can remove these if you switch to auto‑derived tabs
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
}

export default function Header({
  user,
  activeTab,
  // setActiveTab,
  handleLogout,
}: HeaderProps) {
  // const pathname = usePathname();
  const base = user?.user_type; // “applicant” or “expert”

  // optional: auto‑derive activeTab from URL
  // useEffect(() => {
  //   const parts = pathname.split("/").filter(Boolean);
  //   // e.g. [ 'applicant', 'profile' ] → 'profile'
  //   if (parts[1]) setActiveTab(parts[1]);
  // }, [pathname, setActiveTab]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // dummy notifications state
  const [notifications] = useState([
    /* … your existing array … */
  ]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  console.log("active,", activeTab);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* → logo / dashboard link */}
          <div className="flex items-center">
            <button
              className="md:hidden p-2 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <Link
              href={`/${base}/dashboard`}
              className="flex items-center ml-2 md:ml-0"
            >
              <div className="bg-indigo-600 text-white p-1 rounded mr-2">
                <FileCheck className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                {activeTab || "Dashboard"}
              </span>
            </Link>
          </div>

          {/* → right‑hand icons */}
          <div className="flex items-center space-x-4">
            <p className="text-sm font-medium text-gray-900">
              Welcome, {user?.first_name}
            </p>

            {/* notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                className="relative p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setNotificationsOpen((o) => !o)}
              >
                <Bell className="h-6 w-6" />
                {notifications.some((n: any) => !n?.isRead) && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>
              {notificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  {/* … your notifications list … */}
                </div>
              )}
            </div>

            {/* user menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex text-sm rounded-full focus:ring-2 focus:ring-indigo-500"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                  {user?.first_name?.charAt(0)}
                </div>
              </button>

              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {/* header */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* ← dynamically link to /applicant/profile or /expert/profile */}
                    <Link
                      href={`/${base}/profile`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="mr-3 h-5 w-5 text-gray-400" />
                      Your Profile
                    </Link>

                    {/* <Link
                      href={`/${base}/settings`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="mr-3 h-5 w-5 text-gray-400" />
                      Settings
                    </Link> */}

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

      {/* → mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* other tabs… */}
            <Link
              href={`/${base}/dashboard`}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "dashboard"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>

            {/* dynamically link to Profile */}
            <Link
              href={`/${base}/profile`}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                activeTab === "profile"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
