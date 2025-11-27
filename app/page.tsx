"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect based on role
      // Admins go to admin panel (they can manually navigate to team owner if they have teams)
      if (session.user.role === "ADMIN") {
        router.push("/admin/auctions");
      } else if (session.user.role === "TEAM_OWNER") {
        router.push("/team-owner/dashboard");
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Cricket Auction Platform
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Professional cricket player auction management system for tournaments
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Admin Control Panel</CardTitle>
              <CardDescription>Complete auction management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Manage auctions, teams, and players. Conduct live auctions with real-time bidding control.</p>
              <Button asChild className="w-full">
                <Link href="/auth/signin">Access Admin Panel</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Owner Portal</CardTitle>
              <CardDescription>Manage your teams and bid on players</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">View your teams, manage roster, and participate in live player auctions with real-time bidding.</p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/auth/signin">Team Owner Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public Display Screen</CardTitle>
              <CardDescription>Audience view for live auctions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Full-screen display showing current player, live bids, and team standings.</p>
              <p className="text-sm text-muted-foreground">URL: /auction/[auction-id]/display</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center text-slate-600">
          <p className="text-sm">
            Built with Next.js, TypeScript, Prisma, and Socket.io
          </p>
        </div>
      </main>
    </div>
  );
}
