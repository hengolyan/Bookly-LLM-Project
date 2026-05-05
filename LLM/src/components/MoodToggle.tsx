"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("bookly-theme", theme);
}

export function MoodToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("bookly-theme") as Theme | null;
    const initial = stored === "dark" || stored === "light" ? stored : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="mood-sun shrink-0"
      aria-label={`Switch to ${theme === "light" ? "dark enchanted" : "light garden"} mood`}
      title={`Switch to ${theme === "light" ? "dark enchanted" : "light garden"} mood`}
    />
  );
}
