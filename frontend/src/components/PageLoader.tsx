import { Rocket } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 min-h-[400px]">
      <div className="relative h-16 w-16">
        {/* Static background ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(99,102,241,0.08)" }}
        />
        {/* Spinning arc */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 64 64"
          style={{ animation: "loaderSpin 1.2s linear infinite" }}
        >
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeDasharray="50 130"
            strokeLinecap="round"
          />
        </svg>
        {/* Rocket in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Rocket
            size={20}
            style={{
              color: "#818cf8",
              animation: "loaderRocket 1.4s ease-in-out infinite",
            }}
          />
        </div>
      </div>
      <span className="text-xs font-medium tracking-wide" style={{ color: "#555080" }}>
        Загрузка
      </span>
    </div>
  );
}
