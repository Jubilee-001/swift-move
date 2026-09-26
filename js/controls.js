function initializeListbox({
  field,
  trigger,
  menu,
  valueElement,
  chevron,
  options,
  checkSelector,
  readLabel,
  onSelect,
}) {
  if (!field || !trigger || !menu || !valueElement) return { setValue() {} };

  let activeIndex = 0;
  const setValue = (value) => {
    field.value = value;
    valueElement.textContent = readLabel(value);
    activeIndex = Math.max(
      options.findIndex((option) => option.dataset.value === value),
      0,
    );
    options.forEach((option) => {
      const selected = option.dataset.value === value;
      option.setAttribute("aria-selected", String(selected));
      option.classList.remove("is-active");
      option
        .querySelector(checkSelector)
        ?.classList.toggle("hidden", !selected);
    });
    onSelect?.(value);
  };

  const close = (restoreFocus = false) => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
    chevron?.classList.remove("rotate-180");
    options.forEach((option) => option.classList.remove("is-active"));
    if (restoreFocus) trigger.focus();
  };

  const open = () => {
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    chevron?.classList.add("rotate-180");
    activeIndex = Math.max(
      options.findIndex((option) => option.dataset.value === field.value),
      0,
    );
    options.forEach((option, index) =>
      option.classList.toggle("is-active", index === activeIndex),
    );
    trigger.setAttribute(
      "aria-activedescendant",
      options[activeIndex]?.id || "",
    );
  };

  const choose = () => {
    if (!options[activeIndex]) return;
    setValue(options[activeIndex].dataset.value);
    close(true);
  };

  trigger.addEventListener("click", () => (menu.hidden ? open() : close()));
  trigger.addEventListener("keydown", (event) => {
    const isOpen = !menu.hidden;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!isOpen) open();
      if (event.key === "ArrowDown")
        activeIndex = (activeIndex + 1) % options.length;
      if (event.key === "ArrowUp") {
        activeIndex = (activeIndex - 1 + options.length) % options.length;
      }
      if (event.key === "Home") activeIndex = 0;
      if (event.key === "End") activeIndex = options.length - 1;
      options.forEach((option, index) =>
        option.classList.toggle("is-active", index === activeIndex),
      );
      trigger.setAttribute(
        "aria-activedescendant",
        options[activeIndex]?.id || "",
      );
    } else if (isOpen && ["Enter", " "].includes(event.key)) {
      event.preventDefault();
      choose();
    } else if (isOpen && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
  options.forEach((option) =>
    option.addEventListener("click", () => {
      setValue(option.dataset.value);
      close(true);
    }),
  );
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(`#${trigger.id}, #${menu.id}`)) close();
  });
  field.addEventListener("change", () => setValue(field.value));
  setValue(field.value);
  return { setValue, close };
}

export function initializeControls() {
  const moveTypeField = document.querySelector("#move-type");
  const moveType = initializeListbox({
    field: moveTypeField,
    trigger: document.querySelector("#move-type-trigger"),
    menu: document.querySelector("#move-type-listbox"),
    valueElement: document.querySelector("#move-type-value"),
    chevron: document.querySelector("#move-type-chevron"),
    options: [...document.querySelectorAll("#move-type-listbox [role=option]")],
    checkSelector: ".move-type-check",
    readLabel: (value) => value,
  });

  const moveSizeField = document.querySelector("#move-size");
  const moveSize = initializeListbox({
    field: moveSizeField,
    trigger: document.querySelector("#move-size-trigger"),
    menu: document.querySelector("#move-size-listbox"),
    valueElement: document.querySelector("#move-size-value"),
    chevron: document.querySelector("#move-size-chevron"),
    options: [...document.querySelectorAll("#move-size-listbox [role=option]")],
    checkSelector: ".move-size-check",
    readLabel: (value) =>
      moveSizeField.selectedOptions[0]?.textContent || "Choose a move size",
  });

  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);
  const localMinimumDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const datePickerInstances = new Map();

  document.querySelectorAll("input[data-date-field]").forEach((input) => {
    const trigger = document.querySelector(`[data-date-trigger="${input.id}"]`);
    let picker = null;
    if (typeof window.flatpickr === "function") {
      try {
        input.type = "text";
        picker = window.flatpickr(input, {
          dateFormat: "F j, Y",
          minDate: localMinimumDate,
          disableMobile: true,
          allowInput: false,
          animate: !window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
        });
        datePickerInstances.set(input.id, picker);
      } catch (error) {
        console.error("Date picker initialization failed.", error);
        input.type = "date";
        input.min = localDate;
      }
    } else {
      input.type = "date";
      input.min = localDate;
    }

    trigger?.addEventListener("click", () => {
      if (picker) picker.open();
      else if (typeof input.showPicker === "function") input.showPicker();
      else input.focus();
    });
  });

  const setDateField = (id, value) => {
    const picker = datePickerInstances.get(id);
    if (picker) picker.setDate(value, true);
    else {
      const date =
        value instanceof Date ? value : new Date(`${value}T00:00:00`);
      const isoDate = Number.isNaN(date.getTime())
        ? ""
        : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);
      document.querySelector(`#${id}`).value = isoDate;
    }
  };

  const sizePrices = {
    "1-bedroom": 480,
    "2-bedroom": 780,
    "3-bedroom": 1180,
    office: 850,
    "few-items": 240,
  };
  document.querySelector("#estimator")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const pickup = form.elements.pickup.value.trim();
    const dropoff = form.elements.dropoff.value.trim();
    const datePicker = datePickerInstances.get("quick-date");
    const moveDate = datePicker?.selectedDates[0] || form.elements.date.value;
    const moveSize = moveSizeField.value;
    const base = sizePrices[moveSize];
    if (!base || !moveDate) return;
    const local = pickup === dropoff;
    const low = base + (local ? 0 : 220);
    const high = Math.round((low * 1.45) / 10) * 10;
    const result = document.querySelector("#estimate-result");
    const resultStrong = document.createElement("strong");
    resultStrong.className = "text-ink";
    resultStrong.textContent = `A starting range: $${low.toLocaleString()}–$${high.toLocaleString()}`;
    result.replaceChildren(
      resultStrong,
      document.createElement("br"),
      document.createTextNode(
        `Based on a ${form.elements["move-size"].selectedOptions[0].text.toLowerCase()} ${local ? "local move" : "move between ZIP codes"}. Request a detailed quote below.`,
      ),
    );
    result.classList.remove("hidden");
    setDateField("move-date", moveDate);
    moveType.setValue(moveSize === "office" ? "Office" : "Home");
    result.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  return {
    getDatePicker: (id) => datePickerInstances.get(id),
    setDateField,
    setMoveType: moveType.setValue,
    setMoveSize: moveSize.setValue,
  };
}
