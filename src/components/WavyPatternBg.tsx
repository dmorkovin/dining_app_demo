export function WavyPatternBg() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="wavy-stripes"
            x="0"
            y="0"
            width="40"
            height="100%"
            patternUnits="userSpaceOnUse"
          >
            <rect width="40" height="100%" fill="#D76B7B" />
            <path
              d="M12 0 C18 12.5, 18 25, 12 37.5 C6 50, 6 62.5, 12 75 C18 87.5, 18 100, 12 112.5 C6 125, 6 137.5, 12 150 C18 162.5, 18 175, 12 187.5 C6 200, 6 212.5, 12 225 C18 237.5, 18 250, 12 262.5 C6 275, 6 287.5, 12 300"
              fill="none"
              stroke="#C73E2C"
              strokeWidth="14"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wavy-stripes)" />
      </svg>
    </div>
  );
}
