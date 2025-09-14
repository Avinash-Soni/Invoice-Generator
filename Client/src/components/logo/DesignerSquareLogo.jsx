import React from "react";

export default function DesignerSquareLogo({ size = 120, className = "", primary = "#0ea5a4" }) {
  const width = typeof size === "number" ? size : size;
  const height = typeof size === "number" ? size : size;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Designer's Square logo"
      className={className}
    >
      <defs>
        {/* Gradient with 3 colors */}
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="50%" stopColor="#0bd1c5" />
          <stop offset="100%" stopColor="#056b66" />
        </linearGradient>

        {/* Smooth neon glow */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glossy highlight overlay */}
        <linearGradient id="highlight" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>

        {/* Subtle text glow */}
        <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Diamond with glow and slow rotation */}
      <g filter="url(#glow)">
        <rect
          x="25"
          y="25"
          width="150"
          height="150"
          rx="14"
          ry="14"
          transform="rotate(45 100 100)"
          fill="url(#g1)"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="45 100 100"
            to="405 100 100"
            dur="25s"
            repeatCount="indefinite"
          />
        </rect>
      </g>

      {/* Inner glossy highlight */}
      <rect
        x="25"
        y="25"
        width="150"
        height="75"
        transform="rotate(45 100 100)"
        fill="url(#highlight)"
        rx="14"
        ry="14"
        opacity="0.7"
      >
        <animate
          attributeName="opacity"
          values="0.7;0.5;0.7"
          dur="4s"
          repeatCount="indefinite"
        />
      </rect>

      {/* White inner border
      <rect
        x="38"
        y="38"
        width="124"
        height="124"
        rx="10"
        ry="10"
        transform="rotate(45 100 100)"
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="5"
      /> */}

      {/* Text: Designer's */}
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fontFamily="Poppins, Arial, sans-serif"
        fontWeight="700"
        fontSize="26"
        fill="#ffffff"
        filter="url(#textGlow)"
        letterSpacing="0.5"
      >
        Designer's
      </text>

      {/* Text: square */}
      <text
        x="100"
        y="125"
        textAnchor="middle"
        fontFamily="Poppins, Arial, sans-serif"
        fontWeight="500"
        fontSize="24"
        fill="#00ffe0"
        filter="url(#textGlow)"
        letterSpacing="0.5"
      >
        square
      </text>
    </svg>
  );
}
