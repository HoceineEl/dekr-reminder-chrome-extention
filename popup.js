document.addEventListener("DOMContentLoaded", function () {
  const adkarTypeSelect = document.querySelector(".custom-select");
  const numInput = document.getElementById("num");
  const statusMessage = document.getElementById("status-message");
  const themeSwitch = document.getElementById("checkbox");
  const reminderCountEl = document.getElementById("reminder-count");
  const remindersEnabledToggle = document.getElementById(
    "reminders-enabled-toggle"
  );
  const reminderControls = document.getElementById("reminder-controls");
  const tabs = document.querySelectorAll(".tab-button");
  const tabPanes = document.querySelectorAll(".tab-pane");

  // --- Tab Logic ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetPaneId = this.getAttribute("data-tab");
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      tabPanes.forEach((pane) =>
        pane.classList.toggle("active", pane.id === targetPaneId)
      );
    });
  });

  // --- Theme Management ---
  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    if (themeSwitch) themeSwitch.checked = isDark;
  }

  if (themeSwitch) {
    themeSwitch.addEventListener("change", function () {
      chrome.storage.sync.set({ theme: this.checked ? "dark" : "light" });
    });
  }

  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.theme) {
      applyTheme(changes.theme.newValue === "dark");
    }
    if (changes.reminderCount && reminderCountEl) {
      reminderCountEl.textContent = changes.reminderCount.newValue || 0;
    }
  });

  // --- Reminder Controls Logic ---
  function updateReminderControlsState(isEnabled) {
    if (reminderControls) {
      reminderControls.classList.toggle("disabled", !isEnabled);
      reminderControls.style.maxHeight = isEnabled
        ? reminderControls.scrollHeight + "px"
        : "0";
    }
  }

  if (remindersEnabledToggle) {
    remindersEnabledToggle.addEventListener("change", () => {
      updateReminderControlsState(remindersEnabledToggle.checked);
    });
  }

  // --- Load saved values ---
  chrome.storage.sync.get(
    ["dekrType", "minutes", "theme", "reminderCount", "remindersEnabled"],
    function (data) {
      applyTheme(data.theme === "dark");

      if (adkarTypeSelect) updateSelectValue(data.dekrType || "random");
      if (numInput) numInput.value = data.minutes || 5;
      if (reminderCountEl)
        reminderCountEl.textContent = data.reminderCount || 0;

      if (remindersEnabledToggle) {
        remindersEnabledToggle.checked = data.remindersEnabled !== false; // Default to true
        updateReminderControlsState(remindersEnabledToggle.checked);
      }
    }
  );

  // --- Custom Select Logic ---
  function updateSelectValue(value) {
    if (!adkarTypeSelect) return;
    const selectedOption = adkarTypeSelect.querySelector(
      `.custom-option[data-value="${value}"]`
    );
    if (selectedOption) {
      adkarTypeSelect.querySelector(".custom-select-trigger span").textContent =
        selectedOption.textContent;
      adkarTypeSelect
        .querySelectorAll(".custom-option")
        .forEach((opt) => opt.classList.remove("selected"));
      selectedOption.classList.add("selected");
      adkarTypeSelect.setAttribute("data-value", value);
    }
  }

  if (adkarTypeSelect) {
    const selectTrigger = adkarTypeSelect.querySelector(
      ".custom-select-trigger"
    );
    if (selectTrigger) {
      selectTrigger.addEventListener("click", () =>
        adkarTypeSelect.classList.toggle("open")
      );
    }
    adkarTypeSelect.querySelectorAll(".custom-option").forEach((option) => {
      option.addEventListener("click", function () {
        updateSelectValue(this.getAttribute("data-value"));
        adkarTypeSelect.classList.remove("open");
      });
    });
    window.addEventListener("click", (e) => {
      if (adkarTypeSelect && !adkarTypeSelect.contains(e.target)) {
        adkarTypeSelect.classList.remove("open");
      }
    });
  }

  // --- Input Stepper Logic ---
  const incrementBtn = document.getElementById("increment");
  const decrementBtn = document.getElementById("decrement");
  if (numInput && incrementBtn && decrementBtn) {
    incrementBtn.addEventListener(
      "click",
      () => (numInput.value = parseInt(numInput.value, 10) + 1)
    );
    decrementBtn.addEventListener("click", () => {
      const val = parseInt(numInput.value, 10);
      if (val > 1) numInput.value = val - 1;
    });
  }

  // --- Main Button Logic ---
  const saveButton = document.getElementById("add");
  if (saveButton) {
    saveButton.addEventListener("click", saveAllSettings);
  }

  function saveAllSettings() {
    const settings = {
      dekrType: adkarTypeSelect
        ? adkarTypeSelect.getAttribute("data-value")
        : "random",
      minutes: numInput ? parseInt(numInput.value) : 5,
      remindersEnabled: remindersEnabledToggle
        ? remindersEnabledToggle.checked
        : true,
    };

    if (isNaN(settings.minutes) || settings.minutes < 1) {
      showStatus("Invalid interval!", true);
      return;
    }

    // Send a one-way message to the background script
    chrome.runtime.sendMessage({ settings });

    // Show immediate feedback to the user
    showStatus("Settings saved successfully!", false);

    // Optional: Close the popup after a short delay
    // setTimeout(() => window.close(), 1000);
  }

  function showStatus(message, isError = false) {
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.style.color = isError ? "#d93025" : "var(--primary-color)";
      statusMessage.style.opacity = 1;
      setTimeout(() => (statusMessage.style.opacity = 0), 3000);
    }
  }
});
