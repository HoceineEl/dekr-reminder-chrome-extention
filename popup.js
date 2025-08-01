document.addEventListener("DOMContentLoaded", () => {
  const UIElements = {
    adkarTypeSelect: document.querySelector(".custom-select"),
    numInput: document.getElementById("num"),
    statusMessage: document.getElementById("status-message"),
    themeSwitch: document.getElementById("checkbox"),
    remindersEnabledToggle: document.getElementById("reminders-enabled-toggle"),
    reminderControls: document.getElementById("reminder-controls"),
    saveButton: document.getElementById("add"),
    incrementBtn: document.getElementById("increment"),
    decrementBtn: document.getElementById("decrement"),
  };

  const a = (selector) => document.querySelector(selector);
  const on = (element, event, handler) =>
    element.addEventListener(event, handler);

  async function saveSettings() {
    const settings = {
      dekrType:
        UIElements.adkarTypeSelect?.getAttribute("data-value") || "random",
      minutes: parseInt(UIElements.numInput?.value, 10) || 5,
      remindersEnabled: UIElements.remindersEnabledToggle?.checked ?? true,
    };

    if (isNaN(settings.minutes) || settings.minutes < 1) {
      showStatus("Invalid interval!", true);
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSettings",
        settings,
      });
      if (response?.success) {
        showStatus("Settings saved successfully!", false);
      } else {
        showStatus(`Error: ${response?.error || "Unknown error"}`, true);
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, true);
    }
  }

  function showStatus(message, isError = false) {
    const { statusMessage } = UIElements;
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = isError ? "status-error" : "status-success";
    statusMessage.style.opacity = 1;
    setTimeout(() => (statusMessage.style.opacity = 0), 3000);
  }

  function updateSelectValue(value) {
    const { adkarTypeSelect } = UIElements;
    if (!adkarTypeSelect) return;
    const trigger = adkarTypeSelect.querySelector(
      ".custom-select-trigger span"
    );
    const option = adkarTypeSelect.querySelector(
      `.custom-option[data-value="${value}"]`
    );
    if (trigger && option) {
      trigger.textContent = option.textContent;
      adkarTypeSelect
        .querySelectorAll(".custom-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      adkarTypeSelect.setAttribute("data-value", value);
    }
  }

  function setupEventListeners() {
    const {
      themeSwitch,
      remindersEnabledToggle,
      adkarTypeSelect,
      incrementBtn,
      decrementBtn,
      saveButton,
      numInput,
    } = UIElements;

    if (themeSwitch) {
      on(themeSwitch, "change", () =>
        chrome.storage.sync.set({
          theme: themeSwitch.checked ? "dark" : "light",
        })
      );
    }
    if (remindersEnabledToggle) {
      on(remindersEnabledToggle, "change", () =>
        updateReminderControls(remindersEnabledToggle.checked)
      );
    }
    if (saveButton) on(saveButton, "click", saveSettings);
    if (incrementBtn)
      on(
        incrementBtn,
        "click",
        () => (numInput.value = parseInt(numInput.value, 10) + 1)
      );
    if (decrementBtn)
      on(decrementBtn, "click", () => {
        const val = parseInt(numInput.value, 10);
        if (val > 1) numInput.value = val - 1;
      });

    if (adkarTypeSelect) {
      const trigger = adkarTypeSelect.querySelector(".custom-select-trigger");
      if (trigger)
        on(trigger, "click", () => adkarTypeSelect.classList.toggle("open"));
      adkarTypeSelect.querySelectorAll(".custom-option").forEach((option) => {
        on(option, "click", function () {
          updateSelectValue(this.getAttribute("data-value"));
          adkarTypeSelect.classList.remove("open");
        });
      });
      on(window, "click", (e) => {
        if (!adkarTypeSelect.contains(e.target))
          adkarTypeSelect.classList.remove("open");
      });
    }
  }

  function updateReminderControls(isEnabled) {
    const { reminderControls } = UIElements;
    if (reminderControls)
      reminderControls.classList.toggle("disabled", !isEnabled);
  }

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    if (UIElements.themeSwitch) UIElements.themeSwitch.checked = isDark;
  }

  async function restoreSettings() {
    try {
      const data = await chrome.storage.sync.get([
        "dekrType",
        "minutes",
        "theme",
        "remindersEnabled",
      ]);
      applyTheme(data.theme === "dark");
      if (UIElements.adkarTypeSelect)
        updateSelectValue(data.dekrType || "random");
      if (UIElements.numInput) UIElements.numInput.value = data.minutes || 5;
      if (UIElements.remindersEnabledToggle) {
        UIElements.remindersEnabledToggle.checked =
          data.remindersEnabled !== false;
        updateReminderControls(UIElements.remindersEnabledToggle.checked);
      }
    } catch (error) {
      console.error("Failed to restore settings:", error);
      showStatus("Failed to load settings.", true);
    }
  }

  function init() {
    restoreSettings();
    setupEventListeners();
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.theme) applyTheme(changes.theme.newValue === "dark");
    });
  }

  init();
});
