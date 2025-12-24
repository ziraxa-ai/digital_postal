// script.js
(() => {
  "use strict";

  const brochure = document.getElementById("brochure");
  const pagerDots = document.querySelectorAll(".pager .dot");

  const state = { open: false };

  function applyState() {
    brochure.classList.toggle("is-open", state.open);
    brochure.classList.toggle("is-closed", !state.open);
    brochure.setAttribute("aria-expanded", String(state.open));

    // Pager: Page 1 (closed cover) vs Page 2 (open spread)
    if (pagerDots.length >= 2) {
      pagerDots[0].classList.toggle("is-on", !state.open);
      pagerDots[1].classList.toggle("is-on", state.open);
    }
  }

  function toggleOpen() {
    state.open = !state.open;
    applyState();
  }

  // Tap anywhere on the brochure toggles open/close
  brochure.addEventListener("click", toggleOpen);

  // Keyboard accessibility
  brochure.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  });

  applyState();
})();
