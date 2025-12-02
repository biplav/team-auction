"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface BidCountdownTimerProps {
  timerSeconds: number;
  lastBidTime: Date | null;
  currentPlayerSetAt: Date | null;
  auctionStatus: string;
  timerEnabled?: boolean;
  variant?: "default" | "compact" | "large";
}

export function BidCountdownTimer({
  timerSeconds,
  lastBidTime,
  currentPlayerSetAt,
  auctionStatus,
  timerEnabled = true,
  variant = "default",
}: BidCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);

  useEffect(() => {
    // Only run timer when auction is in progress
    if (auctionStatus !== "IN_PROGRESS") {
      setTimeRemaining(timerSeconds);
      return;
    }

    // Calculate time remaining based on last bid time or when player was set
    const calculateTimeRemaining = () => {
      // Use lastBidTime if available, otherwise use when current player was set
      const referenceTime = lastBidTime || currentPlayerSetAt;

      if (!referenceTime) {
        return timerSeconds;
      }

      const now = new Date();
      const reference = new Date(referenceTime);
      const elapsedSeconds = Math.floor((now.getTime() - reference.getTime()) / 1000);
      const remaining = Math.max(0, timerSeconds - elapsedSeconds);

      return remaining;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBidTime, currentPlayerSetAt, timerSeconds, auctionStatus]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get color based on time remaining
  const getColorClass = () => {
    const percentage = (timeRemaining / timerSeconds) * 100;

    if (percentage > 50) {
      return "text-green-600 bg-green-50 border-green-200";
    } else if (percentage > 20) {
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    } else {
      return "text-red-600 bg-red-50 border-red-200";
    }
  };

  // Get progress percentage for visual indicator
  const getProgressPercentage = () => {
    return (timeRemaining / timerSeconds) * 100;
  };

  // Don't show timer if disabled or if auction is not in progress
  if (!timerEnabled || auctionStatus !== "IN_PROGRESS") {
    return null;
  }

  // Compact variant for mobile/tight spaces
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getColorClass()}`}>
        <Clock className="h-3 w-3" />
        <span className="text-sm font-bold tabular-nums">{formatTime(timeRemaining)}</span>
      </div>
    );
  }

  // Large variant for prominent display
  if (variant === "large") {
    return (
      <div className={`p-4 md:p-6 rounded-lg md:rounded-xl border-2 ${getColorClass()} transition-all duration-300`}>
        <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
          <Clock className="h-5 md:h-6 w-5 md:h-6" />
          <p className="text-xs md:text-sm font-semibold uppercase tracking-wide">Time Since Last Bid</p>
        </div>
        <div className="text-center">
          <p className="text-3xl sm:text-4xl md:text-5xl font-black tabular-nums">{formatTime(timeRemaining)}</p>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 transition-all duration-1000 ease-linear ${
              getProgressPercentage() > 50
                ? "bg-green-500"
                : getProgressPercentage() > 20
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        {timeRemaining === 0 && (
          <p className="text-center text-xs mt-2 font-semibold animate-pulse">
            Timer expired - waiting for next bid
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`p-4 rounded-lg border ${getColorClass()} transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Time Since Last Bid</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-3xl font-black tabular-nums">{formatTime(timeRemaining)}</p>
        <div className="text-right">
          <p className="text-xs text-gray-600">
            {timeRemaining === 0 ? "Expired" : `${Math.floor(getProgressPercentage())}% left`}
          </p>
        </div>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 transition-all duration-1000 ease-linear ${
            getProgressPercentage() > 50
              ? "bg-green-500"
              : getProgressPercentage() > 20
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>
    </div>
  );
}
