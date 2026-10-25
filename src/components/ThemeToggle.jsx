// A button that switches between the dark and the light look.

import Icon from "./Icon";
import { useTheme } from "../lib/theme";

export default function ThemeToggle({ className = "" }) {
  const [theme, toggle] = useTheme();
  const next = theme === "light" ? "dark" : "light";
  return (
    <button className={`icon-btn theme-toggle ${className}`.trim()} type="button" onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <Icon name={theme === "light" ? "moon" : "sun"} />
    </button>
  );
}
