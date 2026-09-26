import { initializeControls } from "./controls.js";
import { initializeForms } from "./forms.js";

const tailwindReady = () => {
  for (const sheet of document.styleSheets) {
    try {
      if (
        [...sheet.cssRules].some((rule) => rule.selectorText === ".bg-paper")
      ) {
        return true;
      }
    } catch {
      // Cross-origin stylesheets are not readable; Tailwind injects its rules locally.
    }
  }
  return false;
};

const waitForTailwind = () =>
  new Promise((resolve) => {
    const startedAt = performance.now();
    const check = () => {
      if (tailwindReady() || performance.now() - startedAt >= 1200) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

await waitForTailwind();
window.lucide?.createIcons();
const controls = initializeControls();
initializeForms(controls);
document.documentElement.classList.remove("app-loading");
document.documentElement.classList.add("app-ready");

const navigationEntry = performance.getEntriesByType("navigation")[0];
if (navigationEntry?.type === "reload") {
  history.scrollRestoration = "manual";
  history.replaceState(null, "", location.pathname + location.search);
  const resetScroll = () => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.style.removeProperty("scroll-behavior");
    });
  };
  resetScroll();
  window.addEventListener("pageshow", resetScroll, { once: true });
}

const menuToggle = document.querySelector("#menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const setMobileMenuOpen = (isOpen) => {
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
  mobileNav?.classList.toggle("hidden", !isOpen);
  if (menuToggle) {
    menuToggle.innerHTML = `<i data-lucide="${isOpen ? "x" : "menu"}" class="h-5 w-5"></i>`;
    window.lucide?.createIcons();
  }
};

menuToggle?.addEventListener("click", () => {
  setMobileMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});
mobileNav
  ?.querySelectorAll("a")
  .forEach((link) =>
    link.addEventListener("click", () => setMobileMenuOpen(false)),
  );
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuToggle?.getAttribute("aria-expanded") === "true"
  ) {
    setMobileMenuOpen(false);
    menuToggle.focus();
  }
});

const revealElements = document.querySelectorAll(".reveal");
document.documentElement.classList.add("js-ready");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("process-step")) {
          entry.target.parentElement.classList.add("is-started");
        }
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const galleryFilters = [...document.querySelectorAll(".gallery-filter")];
galleryFilters.forEach((button) =>
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    galleryFilters.forEach((item) => {
      const active = item === button;
      item.setAttribute("aria-pressed", String(active));
      item.classList.toggle("bg-citrus", active);
      item.classList.toggle("text-ink", active);
      item.classList.toggle("border", !active);
      item.classList.toggle("border-white/25", !active);
      item.classList.toggle("text-white/80", !active);
      item.classList.toggle("font-bold", active);
      item.classList.toggle("font-semibold", !active);
    });
    document.querySelectorAll(".gallery-card").forEach((card) => {
      card.classList.toggle(
        "hidden",
        filter !== "all" && card.dataset.category !== filter,
      );
    });
  }),
);

document.querySelectorAll(".faq-question").forEach((button) =>
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const isOpen = item.dataset.open === "true";
    item.dataset.open = String(!isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));
  }),
);

document.querySelector("#year").textContent = new Date().getFullYear();
