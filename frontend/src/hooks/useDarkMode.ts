import { useEffect, useState } from "react";
export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem("vm_theme") === "dark");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vm_theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}
