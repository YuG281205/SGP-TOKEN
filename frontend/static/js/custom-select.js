// Custom dropdown replacement for the native <select id="model">.
// The option list is appended to <body> and positioned with
// position:fixed so it can never be clipped by a parent's
// overflow:hidden, no matter where the select lives in the layout.

(function () {
  const wrapper = document.getElementById("modelCustomSelect");
  if (!wrapper) return;

  const trigger = document.getElementById("modelTrigger");
  const triggerLabel = document.getElementById("modelTriggerLabel");
  const list = document.getElementById("modelList");
  const hiddenSelect = document.getElementById("model");
  const options = Array.from(list.querySelectorAll(".custom-select-option"));

  // Move the list out to <body> so no ancestor's overflow/clip/
  // z-index can hide it.
  document.body.appendChild(list);
  list.classList.add("custom-select-list--portaled");

  function positionList() {
    const rect = trigger.getBoundingClientRect();
    list.style.position = "fixed";
    list.style.left = rect.left + "px";
    list.style.top = rect.bottom + 6 + "px";
    list.style.width = rect.width + "px";
  }

  function closeList() {
    list.classList.remove("is-open");
    trigger.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    window.removeEventListener("scroll", positionList, true);
    window.removeEventListener("resize", positionList);
  }

  function openList() {
    positionList();
    list.classList.add("is-open");
    trigger.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    window.addEventListener("scroll", positionList, true);
    window.addEventListener("resize", positionList);
  }

  function selectOption(option) {
    options.forEach((o) => {
      o.classList.remove("is-selected");
      o.setAttribute("aria-selected", "false");
    });
    option.classList.add("is-selected");
    option.setAttribute("aria-selected", "true");

    const value = option.dataset.value;

    triggerLabel.textContent = option.textContent;
    triggerLabel.classList.toggle("is-placeholder", value === "");

    hiddenSelect.value = value;
    hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));

    closeList();
    trigger.focus();
  }

  trigger.addEventListener("click", () => {
    list.classList.contains("is-open") ? closeList() : openList();
  });

  options.forEach((option) => {
    option.addEventListener("click", () => selectOption(option));
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target) && !list.contains(e.target)) closeList();
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!list.classList.contains("is-open")) openList();
    } else if (e.key === "Escape") {
      closeList();
    }
  });

  list.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeList();
      trigger.focus();
    }
  });
})();