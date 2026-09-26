const SERVICE_EMAIL = "Swiftmovemovingservice@gmail.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let toastTimer;

export function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.remove("is-visible");
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => {
      toast.hidden = true;
    }, 220);
  }, 2800);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("Clipboard access is unavailable.");
  }
}

function buildEstimateMailto(data) {
  const clean = (value) => String(value || "").trim();
  const name = clean(data.get("name"));
  const email = clean(data.get("email"));
  const moveDate = clean(data.get("move-date")) || "Not specified";
  const moveType = clean(data.get("move-type")) || "Not specified";
  const details =
    clean(data.get("details")).replace(/\r\n?/g, "\n").replace(/\n/g, "\r\n") ||
    "No additional details provided.";
  const subject = `Swift Move estimate request - ${name}`;
  const body = [
    "Hello Swift Move team,",
    "",
    "I'd like to request an estimate for my move.",
    "",
    "CUSTOMER INFORMATION",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "MOVE INFORMATION",
    `Preferred date: ${moveDate}`,
    `Move type: ${moveType}`,
    "",
    "MOVE DETAILS",
    details,
    "",
    "Thank you,",
    name,
  ].join("\r\n");
  return `mailto:${SERVICE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function initializeForms(controls) {
  const form = document.querySelector("#contact-form");
  const confirmation = document.querySelector("#confirmation");
  const submitButton = form?.querySelector('[type="submit"]');
  const errorMessage = document.querySelector("#form-error");
  const emailCopyButton = document.querySelector("#copy-email");
  const emailCopyStatus = document.querySelector("#copy-status");
  const mailtoLink = document.querySelector("#send-email");

  emailCopyButton?.addEventListener("click", async () => {
    try {
      await copyText(SERVICE_EMAIL);
      if (emailCopyStatus)
        emailCopyStatus.textContent = "Email address copied.";
      showToast("Service email copied to clipboard.");
    } catch {
      if (emailCopyStatus) {
        emailCopyStatus.textContent = `Copy unavailable. Email us at ${SERVICE_EMAIL}.`;
      }
      showToast("Copy unavailable. Select the email address to copy it.");
    }
  });

  if (!form || !confirmation || !submitButton) return;

  const fields = [
    document.querySelector("#full-name"),
    document.querySelector("#email"),
    document.querySelector("#move-date"),
  ].filter(Boolean);

  const validateField = (field, showEmpty = false) => {
    const value = field.value.trim();
    let message = "";
    if (field.id === "full-name" && !value && showEmpty) {
      message = "Please enter your full name.";
    } else if (field.id === "email") {
      if (!value && showEmpty) message = "Please enter your email address.";
      else if (value && !emailPattern.test(value)) {
        message = "Enter a valid email address, such as name@example.com.";
      }
    } else if (field.id === "move-date" && value) {
      const selectedDate =
        controls.getDatePicker("move-date")?.selectedDates[0];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const date = selectedDate || new Date(`${value}T00:00:00`);
      if (Number.isNaN(date.getTime()) || date < today) {
        message = "Choose today or a future move date.";
      }
    }

    const feedback = document.querySelector(`#${field.id}-error`);
    field.setAttribute("aria-invalid", String(Boolean(message)));
    if (feedback) {
      feedback.textContent = message;
      feedback.hidden = !message;
    }
    field
      .closest(".form-field")
      ?.classList.toggle("has-error", Boolean(message));
    return !message;
  };

  fields.forEach((field) => {
    field.addEventListener("input", () => validateField(field));
    field.addEventListener("change", () => validateField(field));
    field.addEventListener("blur", () => validateField(field, field.required));
  });

  const setBusy = (busy) => {
    submitButton.disabled = busy;
    submitButton.setAttribute("aria-busy", String(busy));
    if (busy) {
      submitButton.dataset.originalContent = submitButton.innerHTML;
      submitButton.innerHTML =
        '<span class="loading-spinner" aria-hidden="true"></span> Preparing email…';
    } else if (submitButton.dataset.originalContent) {
      submitButton.innerHTML = submitButton.dataset.originalContent;
      delete submitButton.dataset.originalContent;
      window.lucide?.createIcons();
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const isValid = fields
      .map((field) => validateField(field, field.required))
      .every(Boolean);
    if (!isValid) {
      errorMessage.textContent =
        "Please correct the highlighted fields to continue.";
      errorMessage.hidden = false;
      fields
        .find((field) => field.getAttribute("aria-invalid") === "true")
        ?.focus();
      return;
    }

    errorMessage.hidden = true;
    setBusy(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const data = new FormData(form);
      const mailto = buildEstimateMailto(data);
      const details = [
        ["Name", data.get("name")],
        ["Email", data.get("email")],
        ["Preferred date", data.get("move-date") || "Not specified"],
        ["Move type", data.get("move-type") || "Not specified"],
      ];
      const summary = document.querySelector("#confirmation-summary");
      summary?.replaceChildren(
        ...details.map(([label, value]) => {
          const row = document.createElement("p");
          row.className = "confirmation-summary-row";
          const strong = document.createElement("strong");
          strong.textContent = `${label}: `;
          row.append(strong, document.createTextNode(String(value)));
          return row;
        }),
      );
      const fallbackLink = document.querySelector("#fallback-email");
      if (fallbackLink) {
        fallbackLink.href = `mailto:${SERVICE_EMAIL}`;
        fallbackLink.textContent = SERVICE_EMAIL;
      }
      if (mailtoLink) mailtoLink.href = mailto;
      document.querySelector("#confirmation-title").textContent =
        "Your request is ready.";
      document.querySelector("#confirmation-message").textContent =
        "Review your move details, then open your email app to send the request to our team.";
      confirmation.showModal();
    } catch (error) {
      console.error("Could not prepare estimate email.", error);
      document.querySelector("#confirmation-title").textContent =
        "Your request could not be prepared.";
      document.querySelector("#confirmation-message").textContent =
        "Please email us directly using the address below. Your details are still on this form.";
      const fallbackLink = document.querySelector("#fallback-email");
      if (fallbackLink) {
        fallbackLink.href = `mailto:${SERVICE_EMAIL}`;
        fallbackLink.textContent = SERVICE_EMAIL;
      }
      if (mailtoLink) mailtoLink.href = `mailto:${SERVICE_EMAIL}`;
      confirmation.showModal();
    } finally {
      setBusy(false);
    }
  });

  document
    .querySelector("#close-confirmation")
    ?.addEventListener("click", () => confirmation.close());
  document
    .querySelector("#done-confirmation")
    ?.addEventListener("click", () => confirmation.close());
  confirmation.addEventListener("click", (event) => {
    if (event.target === confirmation) confirmation.close();
  });
  mailtoLink?.addEventListener("click", () => confirmation.close());
  document
    .querySelector("#copy-fallback-email")
    ?.addEventListener("click", async () => {
      try {
        await copyText(SERVICE_EMAIL);
        showToast("Service email copied to clipboard.");
      } catch {
        showToast(`Please contact ${SERVICE_EMAIL} directly.`);
      }
    });
}
