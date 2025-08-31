"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-transparent z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="text-base text-blue-600">Carregando...</span>
      </div>
    </div>
  );
}
