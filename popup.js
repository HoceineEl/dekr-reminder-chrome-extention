document.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);
  const els = {
    enabled: $("reminders-enabled"),
    controls: $("reminder-controls"),
    type: $("dekr-type"),
    minutes: $("minutes"),
    presets: $("presets"),
    summary: $("reminder-summary"),
    test: $("test"),
    status: $("status"),
  };

  let statusTimer;
  let saveTimer;

  function showStatus(message, isError = false) {
    clearTimeout(statusTimer);
    els.status.textContent = message;
    els.status.classList.toggle("error", isError);
    statusTimer = setTimeout(() => (els.status.textContent = ""), 2500);
  }

  function readSettings() {
    return {
      dekrType: els.type.value,
      minutes: Math.min(1440, Math.max(1, parseInt(els.minutes.value, 10) || 5)),
      remindersEnabled: els.enabled.checked,
    };
  }

  function formatInterval(minutes) {
    if (minutes === 60) return "ساعة";
    if (minutes % 60 === 0) return `${(minutes / 60).toLocaleString("ar-EG")} ساعات`;
    return `${minutes.toLocaleString("ar-EG")} ${minutes <= 10 && minutes > 2 ? "دقائق" : "دقيقة"}`;
  }

  function render({ minutes, remindersEnabled }) {
    els.controls.disabled = !remindersEnabled;
    els.summary.textContent = remindersEnabled ? `كل ${formatInterval(minutes)}` : "متوقفة";
    els.presets.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.minutes) === minutes));
    });
  }

  async function save() {
    const settings = readSettings();
    els.minutes.value = settings.minutes;
    render(settings);
    try {
      const response = await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      if (!response?.success) throw new Error(response?.error);
      showStatus("تم الحفظ");
    } catch (error) {
      console.error(error);
      showStatus("تعذّر حفظ الإعدادات", true);
    }
  }

  els.enabled.addEventListener("change", save);
  els.type.addEventListener("change", save);
  els.minutes.addEventListener("input", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 600);
  });
  els.minutes.addEventListener("change", () => {
    clearTimeout(saveTimer);
    save();
  });
  els.presets.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-minutes]");
    if (!button) return;
    els.minutes.value = button.dataset.minutes;
    save();
  });
  els.test.addEventListener("click", async () => {
    const response = await chrome.runtime.sendMessage({ action: "testNotification", dekrType: els.type.value });
    showStatus(response?.success ? "أُرسل التذكير" : "تحقّق من إذن الإشعارات في المتصفح", !response?.success);
  });

  const data = await chrome.storage.sync.get(["dekrType", "minutes", "remindersEnabled"]);
  els.type.value = data.dekrType || "random";
  els.minutes.value = data.minutes || 5;
  els.enabled.checked = data.remindersEnabled !== false;
  render(readSettings());
});
