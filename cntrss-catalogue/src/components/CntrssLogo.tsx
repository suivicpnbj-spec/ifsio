import React from 'react';

interface CntrssLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  subtitleColor?: string;
}

export const CntrssEmblem: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CNTRSS Logo Emblem"
    >
      <defs>
        <linearGradient id="cntrssBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="cntrssGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="cntrssTealGreenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>

      {/* Outer circular frame arch */}
      <path
        d="M 60 280 A 155 155 0 1 1 340 280"
        stroke="url(#cntrssBlueGrad)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner green accent ring arch */}
      <path
        d="M 85 270 A 130 130 0 1 1 315 270"
        stroke="url(#cntrssGreenGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* Base Open Book - Teal & Navy Pages */}
      <path
        d="M 200 325 C 235 305 285 305 355 315 C 335 345 285 375 200 375 C 115 375 65 345 45 315 C 115 305 165 305 200 325 Z"
        fill="url(#cntrssBlueGrad)"
      />
      <path
        d="M 200 315 C 240 295 290 295 345 305 C 330 330 280 355 200 355 C 120 355 70 330 55 305 C 110 295 160 295 200 315 Z"
        fill="#f8fafc"
      />
      {/* Book center spine notch */}
      <path
        d="M 195 318 C 198 322 202 322 205 318 L 205 372 C 202 370 198 370 195 372 Z"
        fill="#0369a1"
      />

      {/* Fan of green book pages rising */}
      <path
        d="M 80 270 L 140 310 L 180 312 L 110 230 Z"
        fill="url(#cntrssGreenGrad)"
        opacity="0.9"
      />
      <path
        d="M 125 210 L 175 305 L 195 308 L 175 195 Z"
        fill="url(#cntrssGreenGrad)"
      />
      <path
        d="M 320 270 L 260 310 L 220 312 L 290 230 Z"
        fill="url(#cntrssGreenGrad)"
        opacity="0.9"
      />
      <path
        d="M 275 210 L 225 305 L 205 308 L 225 195 Z"
        fill="url(#cntrssGreenGrad)"
      />

      {/* Graduation Cap (Mortarboard) at Top */}
      <polygon
        points="200,62 315,108 200,150 85,108"
        fill="#075985"
      />
      {/* Cap Skull cap / base */}
      <path
        d="M 130 130 C 130 168 270 168 270 130"
        fill="#0c4a6e"
      />
      {/* Tassel */}
      <path
        d="M 285 110 Q 295 140 290 170"
        stroke="#0284c7"
        strokeWidth="4"
        fill="none"
      />
      <polygon
        points="286,170 294,170 297,192 283,192"
        fill="#0369a1"
      />
      <circle cx="200" cy="106" r="4" fill="#38bdf8" />

      {/* Central Caduceus (Staff of Asclepius) */}
      {/* Staff */}
      <circle cx="200" cy="165" r="9" fill="#0284c7" />
      <rect x="196" y="170" width="8" height="150" rx="4" fill="#0369a1" />

      {/* Serpent Coiled Around Staff */}
      <path
        d="M 198 175 C 220 180 228 198 215 212 C 190 228 175 240 190 260 C 205 280 215 288 200 305 C 190 315 185 318 198 322"
        stroke="#0c4a6e"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {/* Serpent head */}
      <ellipse cx="218" cy="186" rx="9" ry="6" fill="#0c4a6e" transform="rotate(-15 218 186)" />
      <circle cx="222" cy="184" r="1.5" fill="#ffffff" />

      {/* Left: Medical Syringe */}
      <g transform="translate(68, 140) rotate(-35)">
        <rect x="0" y="20" width="18" height="65" rx="3" fill="#0284c7" />
        {/* Syringe markings */}
        <line x1="2" y1="35" x2="10" y2="35" stroke="#ffffff" strokeWidth="2.5" />
        <line x1="2" y1="50" x2="14" y2="50" stroke="#ffffff" strokeWidth="2.5" />
        <line x1="2" y1="65" x2="10" y2="65" stroke="#ffffff" strokeWidth="2.5" />
        {/* Plunger */}
        <rect x="5" y="85" width="8" height="24" fill="#0369a1" />
        <rect x="1" y="107" width="16" height="5" rx="2" fill="#0284c7" />
        {/* Needle tip */}
        <polygon points="5,20 13,20 9,6" fill="#0284c7" />
        <line x1="9" y1="6" x2="9" y2="-16" stroke="#0369a1" strokeWidth="2.5" />
      </g>

      {/* Right: Medical Stethoscope / Fetoscope Horn Instrument */}
      <g transform="translate(290, 160) rotate(32)">
        {/* Trumpet/Pinard bell mouth */}
        <path
          d="M -16 -25 C 0 -22 16 -22 32 -25 C 28 -5 18 20 12 50 L 4 50 C -2 20 -12 -5 -16 -25 Z"
          fill="#0284c7"
        />
        {/* Base stem */}
        <rect x="4" y="50" width="8" height="40" rx="3" fill="#0369a1" />
        <ellipse cx="8" cy="90" rx="7" ry="5" fill="#0c4a6e" />
      </g>
    </svg>
  );
};

export const CntrssLogo: React.FC<CntrssLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor,
  subtitleColor
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', title: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', title: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', title: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', title: 'text-3xl', sub: 'text-sm' }
  };

  const { icon, title, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <CntrssEmblem className={`${icon} shrink-0`} />
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${title} ${
                textColor || 'text-slate-900 dark:text-white'
              }`}
            >
              CNTRSS
            </span>
          </div>
          <span
            className={`font-medium tracking-normal ${sub} line-clamp-1 max-w-[280px] sm:max-w-none ${
              subtitleColor || 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Catalogue Numérique des Travaux de Recherches en Sciences de Santé
          </span>
        </div>
      )}
    </div>
  );
};
