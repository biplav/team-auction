"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LogOut, User, Users } from "lucide-react";

export function AdminNav() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/admin/auctions" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">
                Cricket Auction - Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/auctions">
                <Home className="h-4 w-4 mr-2" />
                Auctions
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link href="/team-owner/dashboard">
                My Teams
              </Link>
            </Button>

            {session?.user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </span>
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Admin
                  </span>
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
