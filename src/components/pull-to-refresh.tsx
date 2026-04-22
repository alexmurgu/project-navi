"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const [isEnabled, setIsEnabled] = useState(true);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 120;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we are at the top of the page
      if (window.scrollY > 5) {
        setIsEnabled(false);
        return;
      }
      setIsEnabled(true);
      startY.current = e.touches[0].pageY;
      isPulling.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing || !isEnabled) return;
      
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance
        const distance = Math.min(diff * 0.4, MAX_PULL);
        setPullDistance(distance);
        
        // Prevent browser's native pull-to-refresh if we are handling it
        if (diff > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing || !isEnabled) return;
      isPulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, isEnabled, onRefresh]);

  return (
    <div className="relative w-full">
      {/* Pull indicator */}
      <div 
        className={cn(
          "fixed left-1/2 -translate-x-1/2 flex items-center justify-center z-[100] transition-opacity duration-200 pointer-events-none",
          (pullDistance > 10 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: isRefreshing ? 20 : Math.max(-40, pullDistance - 40),
        }}
      >
        <div className="bg-white rounded-full p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-navi-border/20">
          <RefreshCcw 
            className={cn(
              "size-5 text-navi-blue",
              isRefreshing && "animate-spin"
            )}
            style={{ 
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)` 
            }}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div 
        className={cn(
          "transition-transform",
          !isPulling.current && "duration-300"
        )}
        style={{ 
          transform: isRefreshing ? "translateY(60px)" : `translateY(${pullDistance * 0.4}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
}
