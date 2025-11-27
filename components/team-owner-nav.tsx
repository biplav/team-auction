"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LogOut, User, Settings } from "lucide-react";

export function TeamOwnerNav() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/team-owner/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                Cricket Auction
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/team-owner/dashboard">
                <Home className="h-4 w-4 mr-2" />
                My Teams
              </Link>
            </Button>

            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/auctions">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            )}

            {session?.user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Admin
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
