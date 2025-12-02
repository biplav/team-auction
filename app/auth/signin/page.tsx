"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState("admin@cricauction.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam === "unauthorized") {
      setError("You don't have permission to access that page. Please sign in with appropriate credentials.");
    }
  }, [errorParam]);

  // If already signed in, redirect to callback or dashboard
  useEffect(() => {
    if (session?.user) {
      const redirectTo = callbackUrl || getDashboardForRole(session.user.role);
      router.push(redirectTo);
    }
  }, [session, callbackUrl, router]);

  const getDashboardForRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin/auctions";
      case "TEAM_OWNER":
        return "/team-owner/dashboard";
      default:
        return "/";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Redirect to callback URL or role-based dashboard
        const redirectTo = callbackUrl || "/";
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sports Auction Platform</CardTitle>
          <CardDescription>Sign in to manage your auctions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cricauction.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-semibold mb-2">Default Credentials:</p>
            <p>📧 Email: <code>admin@cricauction.com</code></p>
            <p>🔑 Password: <code>admin123</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
