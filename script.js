// script.js
(() => {
  "use strict";

  const brochure = document.getElementById("brochure");
  const dots = document.querySelectorAll(".p-dot");

  const state = { open: false };

  function apply() {
    brochure.classList.toggle("is-open", state.open);
    brochure.classList.toggle("is-closed", !state.open);
    brochure.setAttribute("aria-expanded", String(state.open));

    // Pager: dot 1 = cover, dot 2 = open spread
    if (dots.length >= 2) {
      dots[0].classList.toggle("is-on", !state.open);
      dots[1].classList.toggle("is-on", state.open);
    }
  }

  function toggle() {
    state.open = !state.open;
    apply();
  }

  // Tap/click anywhere on brochure
  brochure.addEventListener("click", toggle, { passive: true });

  // Keyboard accessibility
  brochure.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  // Start state: closed (cover only)
  apply();
})();
