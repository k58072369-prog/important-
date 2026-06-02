import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 4000);
        setWasOffline(false);
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [wasOffline]);

  // App is local-first — always functional offline
  if (isOnline && !showReconnected) return null;

  return (
    <div
      dir="rtl"
      className={cn(
        "fixed bottom-4 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all duration-500",
        isOnline
          ? "bg-green-600 text-white animate-in slide-in-from-bottom-2"
          : "bg-secondary text-white animate-in slide-in-from-bottom-2"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 flex-shrink-0" />
          <span>عاد الاتصال بالإنترنت — البيانات محفوظة بأمان</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <div>
            <div>وضع عدم الاتصال</div>
            <div className="text-xs opacity-80 font-normal">النظام يعمل بالكامل — جميع البيانات محفوظة محلياً</div>
          </div>
        </>
      )}
    </div>
  );
}
