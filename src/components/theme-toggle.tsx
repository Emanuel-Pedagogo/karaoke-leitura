"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "high-contrast") {
      setHighContrast(true);
      document.documentElement.setAttribute("data-theme", "high-contrast");
    }
  }, []);

  function toggle() {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "high-contrast");
      localStorage.setItem("theme", "high-contrast");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "default");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-xs px-2 py-1 rounded border border-foreground/20 hover:bg-foreground/5"
      aria-pressed={highContrast}
      aria-label="Alternar alto contraste"
    >
      {highContrast ? "Contraste ✓" : "Alto contraste"}
    </button>
  );
}
