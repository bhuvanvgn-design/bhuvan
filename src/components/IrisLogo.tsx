import React from 'react';

export function IrisLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2C10 7 10 10 12 14C14 10 14 7 12 2Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 22C14 17 14 14 12 10C10 14 10 17 12 22Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M2 12C7 10 10 10 14 12C10 14 7 14 2 12Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M22 12C17 14 14 14 10 12C14 10 17 10 22 12Z" fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
