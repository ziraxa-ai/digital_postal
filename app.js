(() => {
  const card = document.getElementById("card");
  const openBtn = document.getElementById("openBtn");
  const closeBtn = document.getElementById("closeBtn");
  const learnBtn = document.getElementById("learnBtn");
  const toggleAudioBtn = document.getElementById("toggleAudio");
  const bgm = document.getElementById("bgm");
  const year = document.getElementById("year");

  year.textContent = String(new Date().getFullYear());

  let hasUserInteracted = false;
  let audioEnabled = false;

  function setAudioUI() {
    toggleAudioBtn.textContent = audioEnabled ? "Sound: On" : "Sound: Off";
    toggleAudioBtn.setAttribute("aria-pressed", audioEnabled ? "true" : "false");
  }

  async function enableAudioIfAllowed() {
    // Browsers require a user gesture for audio playback.
    if (!hasUserInteracted) return;

    try {
      if (audioEnabled) {
        await bgm.play();
      } else {
        bgm.pause();
        bgm.currentTime = 0;
      }
    } catch (e) {
      // If playback fails (policy/device), keep it off.
      audioEnabled = false;
      setAudioUI();
    }
  }

  function openBrochure() {
    card.classList.add("is-open");
  }

  function closeBrochure() {
    card.classList.remove("is-open");
  }

  function markInteraction() {
    if (!hasUserInteracted) hasUserInteracted = true;
  }

  openBtn.addEventListener("click", async () => {
    markInteraction();
    openBrochure();

    // Auto-enable sound on first open (professional “wow” factor),
    // but still user-gesture compliant.
    audioEnabled = true;
    setAudioUI();
    await enableAudioIfAllowed();
  });

  closeBtn.addEventListener("click", () => {
    markInteraction();
    closeBrochure();
  });

  learnBtn.addEventListener("click", () => {
    markInteraction();
    openBrochure();
  });

  toggleAudioBtn.addEventListener("click", async () => {
    markInteraction();
    audioEnabled = !audioEnabled;
    setAudioUI();
    if (audioEnabled) {
      await enableAudioIfAllowed();
    } else {
      bgm.pause();
    }
  });

  // Optional: click outside to close (desktop UX)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBrochure();
  });

  // Initialize
  setAudioUI();
})();
