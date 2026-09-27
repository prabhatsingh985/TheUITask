import React from 'react';

// Exact SVG Icons as seen in the video dropdown menu
export function ThemeIcon({ type, className = '', size = 16, color = 'currentColor' }) {
  switch (type) {
    case 'eye': // Pre-dawn icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'sunrise': // Sunrise icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2v4" />
          <path d="m4.93 10.93 2.83-2.83" />
          <path d="m16.24 8.1 2.83 2.83" />
          <path d="M2 18h20" />
          <path d="M7 18a5 5 0 0 1 10 0" />
        </svg>
      );
    case 'sun': // Daytime icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case 'dusk': // Dusk icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4 12h2" />
          <path d="M18 12h2" />
          <path d="m6 6 1.5 1.5" />
          <path d="m16.5 16.5 1.5 1.5" />
          <path d="m6 18 1.5-1.5" />
          <path d="m16.5 7.5 1.5-1.5" />
        </svg>
      );
    case 'sunset': // Sunset icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 10v4" />
          <path d="m4.93 6.93 2.83 2.83" />
          <path d="m16.24 9.76 2.83-2.83" />
          <path d="M2 18h20" />
          <path d="M7 18a5 5 0 0 1 10 0" />
        </svg>
      );
    case 'moon': // Night icon
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      );
  }
}
