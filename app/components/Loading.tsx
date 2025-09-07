"use client";

import React from "react";

export default function Loading() {
  return (
    <div
      className="absolute left-0 right-0 flex items-start justify-center bg-transparent z-50"
      style={{
        top: "35%",
        bottom: "auto",
        height: "auto",
        position: "absolute",
      }}
    >
      <div className="flex flex-col items-center mb-4 mt-0">
        <div className="bg-indigo-600 rounded-full p-2 mb-2 animate-spin">
          {/* Ícone MoviTrace (globe) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="white"
            className="w-8 h-8"
          >
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <path
              stroke="white"
              strokeWidth="2"
              d="M2 12h20M12 2c3.5 4 3.5 16 0 20M12 2c-3.5 4-3.5 16 0 20"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-indigo-700 tracking-tight">
          MoviTrace
        </h1>
      </div>
    </div>
  );
}
