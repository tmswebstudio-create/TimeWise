import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

export const TimeWiseMark: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-8 h-8',
  size,
}) => {
  const customStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      style={customStyle}
      aria-label="TimeWise Icon"
    >
      <defs>
        <linearGradient id="tw-ring-grad" x1="60" y1="460" x2="450" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#004AD7" />
          <stop offset="35%" stopColor="#0066FF" />
          <stop offset="70%" stopColor="#0099FF" />
          <stop offset="100%" stopColor="#00BFFF" />
        </linearGradient>

        <linearGradient id="tw-wave-top" x1="90" y1="360" x2="440" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0052FF" />
          <stop offset="100%" stopColor="#0080FF" />
        </linearGradient>

        <linearGradient id="tw-wave-bot" x1="100" y1="450" x2="440" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0091FF" />
          <stop offset="100%" stopColor="#00C8FF" />
        </linearGradient>
      </defs>

      {/* Main Clock Outer Ring */}
      <path
        d="M 120 376 A 176 176 0 1 1 392 376"
        stroke="url(#tw-ring-grad)"
        strokeWidth="44"
        strokeLinecap="round"
      />

      {/* Clock Markers (Ticks) */}
      <rect x="246" y="108" width="20" height="32" rx="10" fill="#0052FF" />
      <rect x="131" y="246" width="32" height="20" rx="10" fill="#0052FF" />
      <rect x="349" y="246" width="32" height="20" rx="10" fill="#0052FF" />

      {/* Center Pivot Hub */}
      <circle cx="256" cy="256" r="26" fill="#0052FF" />

      {/* Minute Hand (Vertical to 12) */}
      <rect x="244" y="152" width="24" height="96" rx="12" fill="#0052FF" />

      {/* Hour Hand (Diagonal to ~4 o'clock) */}
      <g transform="rotate(130 256 256)">
        <rect x="245" y="174" width="22" height="74" rx="11" fill="#0052FF" />
      </g>

      {/* Bottom Overlapping Wave 1 (Top Wave) */}
      <path
        d="M 92 350 C 130 365, 185 305, 275 300 C 355 295, 410 325, 444 374 C 400 340, 345 342, 290 355 C 205 375, 140 378, 92 350 Z"
        fill="url(#tw-wave-top)"
      />

      {/* Bottom Overlapping Wave 2 (Base Wave) */}
      <path
        d="M 92 350 C 150 410, 240 340, 310 345 C 380 350, 420 370, 448 388 C 405 440, 335 464, 256 464 C 180 464, 118 424, 92 350 Z"
        fill="url(#tw-wave-bot)"
      />

      {/* Separation Arc */}
      <path
        d="M 134 410 C 190 395, 280 340, 360 346 C 410 350, 436 370, 448 388"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export const TimeWiseLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  subtitle,
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 'w-8 h-8', text: 'text-lg', sub: 'text-[11px]' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-sm' },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <TimeWiseMark className={icon} />

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-heading font-extrabold tracking-tight ${text} flex items-center`}>
            <span className="text-[#0B1528]">Time</span>
            <span className="text-[#0052FF]">Wise</span>
          </div>
          {subtitle && (
            <span className={`font-medium text-slate-500 tracking-normal mt-0.5 ${sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
