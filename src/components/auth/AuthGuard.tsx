"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthResponse } from "@/app/applicant/cv/[id]/page";

interface AuthGuardProps {
  children: React.ReactNode;
  userType?: "applicant" | "expert";
}

export default function AuthGuard({ children, userType }: AuthGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data: AuthResponse = await response.json();

        if (!data.authenticated) {
          router.push("/auth/login");
          return;
        }

        // If userType is specified, check if user has the correct type
        if (userType && data?.user?.user_type !== userType) {
          if (data?.user?.user_type === "applicant") {
            router.push("/applicant/dashboard");
          } else {
            router.push("/expert/dashboard");
          }
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router, userType]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
