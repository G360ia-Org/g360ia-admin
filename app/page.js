"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-[#F2F4F6] flex items-center justify-center px-4 relative overflow-hidden">
        {showSplash && (
          <div className="fixed inset-0 bg-[#F2F4F6] flex flex-col items-center justify-center gap-[18px] z-[9999] transition-opacity duration-500 ease-in-out">
            <div className="w-20 h-20 bg-[#506886] rounded-[20px] flex items-center justify-center shadow-[0_6px_20px_rgba(80,104,134,.4)] animate-[g360IconPop_.5s_cubic-bezier(.34,1.56,.64,1)_forwards]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" width="42" height="36">
                <rect x="0" y="14" width="8" height="8" rx="2" fill="white" opacity=".3" />
                <rect x="0" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
                <rect x="0" y="0" width="8" height="8" rx="2" fill="white" />
                <rect x="10" y="0" width="8" height="8" rx="2" fill="white" />
                <rect x="10" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
                <rect x="20" y="0" width="8" height="8" rx="2" fill="#B08A55" />
              </svg>
            </div>

            <div className="text-[22px] font-bold text-[#1F2937] tracking-[-0.3px] animate-[g360FadeUp_.4s_ease_.3s_both]">
              Gestión 360 <span className="text-[#B08A55]">iA</span>
            </div>

            <div className="text-[11px] font-semibold text-[#9CA3AF] tracking-[2px] uppercase animate-[g360FadeUp_.4s_ease_.5s_both]">
              Cargando...
            </div>

            <div className="flex gap-[7px] animate-[g360FadeUp_.4s_ease_.7s_both]">
              <div className="g360-dot" />
              <div className="g360-dot" style={{ animationDelay: ".2s" }} />
              <div className="g360-dot" style={{ animationDelay: ".4s" }} />
            </div>
          </div>
        )}

        <div
          className={`w-full max-w-md transition-all duration-500 ${
            showSplash ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="bg-white rounded-[28px] shadow-[0_20px_60px_rgba(15,23,42,.10)] border border-[#E5E7EB] px-8 py-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#506886] rounded-[20px] flex items-center justify-center shadow-[0_6px_20px_rgba(80,104,134,.25)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" width="42" height="36">
                  <rect x="0" y="14" width="8" height="8" rx="2" fill="white" opacity=".3" />
                  <rect x="0" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
                  <rect x="0" y="0" width="8" height="8" rx="2" fill="white" />
                  <rect x="10" y="0" width="8" height="8" rx="2" fill="white" />
                  <rect x="10" y="7" width="8" height="8" rx="2" fill="white" opacity=".6" />
                  <rect x="20" y="0" width="8" height="8" rx="2" fill="#B08A55" />
                </svg>
              </div>
            </div>

            <h1 className="text-[30px] leading-[1.1] font-bold text-[#1F2937] mb-2">
              Gestión 360 <span className="text-[#B08A55]">iA</span>
            </h1>

            <p className="text-[#6B7280] text-sm mb-8">
              Ingresá al panel de administración con tu cuenta autorizada.
            </p>

            <button
              onClick={() => signIn("google")}
              className="w-full rounded-2xl bg-[#506886] hover:opacity-95 text-white font-semibold py-3.5 px-4 transition shadow-[0_10px_25px_rgba(80,104,134,.25)]"
            >
              Acceder
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes g360IconPop {
          from {
            transform: scale(0.4);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes g360FadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes g360Pulse {
          0%,
          100% {
            background: #d1d5db;
            transform: scale(1);
          }
          50% {
            background: #506886;
            transform: scale(1.4);
          }
        }

        .g360-dot {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #d1d5db;
          animation: g360Pulse 1.2s ease infinite;
        }
      `}</style>
    </>
  );
}
