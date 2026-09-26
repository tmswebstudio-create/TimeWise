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
        {/* Outer Ring Smooth Blue Gradient (Modern Tailwind Blue, non-oversaturated) */}
        <linearGradient id="tw-ring-grad" x1="80" y1="420" x2="430" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="35%" stopColor="#2563EB" />
          <stop offset="70%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Clock Inner Face Background */}
        <radialGradient id="tw-clock-bg" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#EDF5FF" />
        </radialGradient>

        {/* Upper Wave Gradient (Balanced Royal Blue) */}
        <linearGradient id="tw-wave-top" x1="100" y1="360" x2="420" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="60%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Lower Base Wave / Leaf (Soft Cyan / Azure) */}
        <linearGradient id="tw-wave-bot" x1="100" y1="440" x2="430" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="45%" stopColor="#0284C7" />
          <stop offset="80%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#7DD3FC" />
        </linearGradient>
      </defs>

      {/* Clock Inner Face Background */}
      <circle cx="256" cy="240" r="180" fill="url(#tw-clock-bg)" />

      {/* Outer Main Clock Ring */}
      <path
        d="M 136 358 A 160 160 0 1 1 376 358"
        stroke="url(#tw-ring-grad)"
        strokeWidth="38"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clock Hour Ticks */}
      <rect x="245" y="112" width="22" height="30" rx="11" fill="#2563EB" />
      <rect x="146" y="229" width="30" height="22" rx="11" fill="#2563EB" />
      <rect x="336" y="229" width="30" height="22" rx="11" fill="#2563EB" />

      {/* Center Pivot Hub */}
      <circle cx="256" cy="240" r="24" fill="#2563EB" />

      {/* Minute Hand (Vertical to 12) */}
      <rect x="245" y="146" width="22" height="88" rx="11" fill="#2563EB" />

      {/* Hour Hand (Diagonal to ~4 o'clock) */}
      <g transform="rotate(128 256 240)">
        <rect x="246" y="160" width="20" height="70" rx="10" fill="#2563EB" />
      </g>

      {/* Upper Wave Swoosh */}
      <path
        d="M 112 315 C 145 328, 190 275, 272 270 C 342 265, 392 295, 418 338 C 380 306, 332 308, 284 320 C 212 338, 154 342, 112 315 Z"
        fill="url(#tw-wave-top)"
      />

      {/* Lower Base Wave / Leaf Swoosh */}
      <path
        d="M 112 315 C 162 372, 242 312, 304 316 C 368 320, 402 338, 424 358 C 386 405, 325 424, 256 424 C 188 424, 134 386, 112 315 Z"
        fill="url(#tw-wave-bot)"
      />

      {/* White Separator Line between Waves */}
      <path
        d="M 140 366 C 190 354, 270 308, 344 313 C 388 316, 410 334, 424 358"
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
