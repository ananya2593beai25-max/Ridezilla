// Dark or light look. The choice is saved in localStorage and set as data-theme on <html>,
// where the colour tokens in styles/base.css pick it up. index.html applies it before the first paint.

import { useSyncExternalStore } from "react";
import { STORAGE } from "./config";

const listeners = new Set();

export function getTheme() {
  try {
    return localStorage.getItem(STORAGE.theme) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#F3F6F5" : "#07090B");
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", theme);
}

export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE.theme, theme);
  } catch {
    /* storage blocked: the choice lasts until the page is closed */
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  // Another tab changed the theme.
  const onStorage = (e) => {
    if (e.key === STORAGE.theme) {
      applyTheme(getTheme());
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** [theme, toggle] for a button that switches between dark and light. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark");
  return [theme, () => setTheme(theme === "light" ? "dark" : "light")];
}
