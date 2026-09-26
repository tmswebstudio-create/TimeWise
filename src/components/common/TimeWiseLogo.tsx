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
        {/* Outer Ring Blue Gradient */}
        <linearGradient id="tw-ring-grad" x1="60" y1="420" x2="450" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#003EE2" />
          <stop offset="40%" stopColor="#0052FF" />
          <stop offset="75%" stopColor="#0080FF" />
          <stop offset="100%" stopColor="#00B2FF" />
        </linearGradient>

        {/* Clock Inner Radial Face */}
        <radialGradient id="tw-clock-bg" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="80%" stopColor="#F5F8FF" />
          <stop offset="100%" stopColor="#E5EFFF" />
        </radialGradient>

        {/* Upper Wave Gradient (Deep Royal Blue) */}
        <linearGradient id="tw-wave-top" x1="80" y1="360" x2="440" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0038E0" />
          <stop offset="50%" stopColor="#0055FF" />
          <stop offset="100%" stopColor="#0077FF" />
        </linearGradient>

        {/* Lower Wave Gradient (Vibrant Cyan / Leaf) */}
        <linearGradient id="tw-wave-bot" x1="90" y1="450" x2="450" y2="340" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#005BEA" />
          <stop offset="45%" stopColor="#0091FF" />
          <stop offset="85%" stopColor="#00C4FF" />
          <stop offset="100%" stopColor="#3CD6FF" />
        </linearGradient>
      </defs>

      {/* Clock Inner Face Background */}
      <circle cx="256" cy="256" r="210" fill="url(#tw-clock-bg)" />

      {/* Outer Main Clock Ring */}
      <path
        d="M 120 392 A 186 186 0 1 1 392 392"
        stroke="url(#tw-ring-grad)"
        strokeWidth="46"
        strokeLinecap="round"
        fill="none"
      />

      {/* Clock Hour Ticks */}
      <rect x="243" y="108" width="26" height="34" rx="13" fill="#0052FF" />
      <rect x="130" y="243" width="34" height="26" rx="13" fill="#0052FF" />
      <rect x="348" y="243" width="34" height="26" rx="13" fill="#0052FF" />

      {/* Center Pivot Hub */}
      <circle cx="256" cy="256" r="28" fill="#0052FF" />

      {/* Minute Hand (Vertical to 12) */}
      <rect x="243" y="148" width="26" height="98" rx="13" fill="#0052FF" />

      {/* Hour Hand (Diagonal to ~4 o'clock) */}
      <g transform="rotate(128 256 256)">
        <rect x="244" y="166" width="24" height="80" rx="12" fill="#0052FF" />
      </g>

      {/* Upper Wave Swoosh */}
      <path
        d="M 92 340 C 130 355, 180 295, 275 290 C 355 285, 412 318, 442 368 C 398 332, 342 334, 288 348 C 205 368, 140 372, 92 340 Z"
        fill="url(#tw-wave-top)"
      />

      {/* Lower Base Wave / Leaf Swoosh */}
      <path
        d="M 92 340 C 150 405, 240 338, 310 342 C 382 346, 422 366, 448 388 C 405 442, 335 464, 256 464 C 180 464, 118 420, 92 340 Z"
        fill="url(#tw-wave-bot)"
      />

      {/* White Separator Stroke between Waves */}
      <path
        d="M 124 398 C 180 384, 272 332, 356 338 C 406 342, 432 362, 448 388"
        stroke="#FFFFFF"
        strokeWidth="6"
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
