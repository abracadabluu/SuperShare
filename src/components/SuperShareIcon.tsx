import React from 'react';

interface SuperShareIconProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SuperShareIcon: React.FC<SuperShareIconProps> = ({
  className = '',
  size = 40,
  showText = false,
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>

        <linearGradient id="lightningGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <filter id="glowIcon" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded squircle background */}
      <rect width="512" height="512" rx="128" fill="url(#bgGradIcon)" />
      <rect
        width="504"
        height="504"
        x="4"
        y="4"
        rx="124"
        fill="none"
        stroke="#334155"
        strokeWidth="6"
      />

      {/* Lightning bolt as 'S' */}
      <g filter="url(#glowIcon)">
        <path
          d="M 330 110 
             C 330 110, 245 95, 195 135 
             C 155 168, 165 215, 215 235 
             L 315 270 
             L 245 315 
             L 345 310 
             L 210 420 
             C 210 420, 275 425, 320 385 
             C 355 352, 345 315, 305 295 
             L 205 260 
             L 275 215 
             L 175 220 
             Z"
          fill="url(#lightningGradIcon)"
        />
      </g>

      <path
        d="M 320 120 
           C 260 102, 205 130, 185 165 
           C 168 196, 188 228, 225 242 
           L 305 272 
           L 230 320 
           L 340 310 
           L 190 425 
           C 260 425, 325 390, 340 345 
           C 352 308, 328 280, 290 265 
           L 215 238 
           L 290 190 
           L 180 200 
           Z"
        fill="#ffffff"
        opacity="0.9"
      />

      {/* SuperShare Typography */}
      <text
        x="256"
        y="468"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="46"
        fontWeight="900"
        letterSpacing="2"
        fill="#ffffff"
      >
        Super<tspan fill="#38bdf8">Share</tspan>
      </text>
    </svg>
  );
};
