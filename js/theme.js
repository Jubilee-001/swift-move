const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector("#theme-color");
const brandLogo = document.querySelector(".brand-logo");

export function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
    themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    themeToggle.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}" class="h-[18px] w-[18px]"></i>`;
  }
  if (brandLogo) {
    brandLogo.src = isDark
      ? brandLogo.dataset.darkLogo
      : brandLogo.dataset.lightLogo;
  }
  if (themeColor) themeColor.content = isDark ? "#101412" : "#f7f7f2";
  window.lucide?.createIcons();
}

try {
  applyTheme(
    localStorage.getItem("swift-move-theme") === "dark" ? "dark" : "light",
  );
} catch {
  applyTheme("light");
}

themeToggle?.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("swift-move-theme", nextTheme);
  } catch {
    // Theme remains usable when browser storage is unavailable.
  }
  applyTheme(nextTheme);
});
