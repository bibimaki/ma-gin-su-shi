"use client";

const LOGO = "/brand/logo.png";

export function Brand({ compact = false }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <img
        src={LOGO}
        alt="ซูชิวังหน้า"
        className="brand-logo"
      />
    </div>
  );
}

export function TitleBlock({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="title-block">
      {eyebrow && (
        <div className="eyebrow">
          {eyebrow}
        </div>
      )}

      <h1>{title}</h1>

      {description && (
        <p className="muted">
          {description}
        </p>
      )}
    </div>
  );
}

export function SectionIcon({ type }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "menu") {
    return (
      <svg {...common}>
        <path d="M4 4v16" />
        <path d="M8 4v7a2 2 0 0 0 4 0V4" />
        <path d="M10 4v7" />
        <path d="M14 4v16" />
        <path d="M18 4v16" />
      </svg>
    );
  }

  if (type === "qr") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <path d="M14 14h3v3h-3z" />
        <path d="M20 14v6" />
        <path d="M14 20h3" />
      </svg>
    );
  }

  if (type === "table") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="4" rx="1" />
        <path d="M6 9v10" />
        <path d="M18 9v10" />
        <path d="M3 19h18" />
      </svg>
    );
  }

  if (type === "kitchen") {
    return (
      <svg {...common}>
        <path d="M6 3v8" />
        <path d="M9 3v8" />
        <path d="M12 3v8" />
        <path d="M9 11v10" />
        <path d="M17 3c2 2 2 6 0 8v10" />
      </svg>
    );
  }

  if (type === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 15v3" />
        <path d="M11 11v7" />
        <path d="M15 8v10" />
        <path d="M19 5v13" />
      </svg>
    );
  }

  return null;
}
