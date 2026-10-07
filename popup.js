document.addEventListener("DOMContentLoaded", async () => {
  const ALARM_NAME = "dekr-reminder";
  const PRESETS = [5, 15, 30, 60];
  const $ = (id) => document.getElementById(id);
  const els = {
    enabled: $("reminders-enabled"),
    controls: $("reminder-controls"),
    type: $("dekr-type"),
    minutes: $("minutes"),
    presets: $("presets"),
    custom: $("custom"),
    summary: $("reminder-summary"),
    snooze: $("snooze"),
    test: $("test"),
    status: $("status"),
    previewCategory: $("preview-category"),
    previewText: $("preview-text"),
    previewNext: $("preview-next"),
    theme: $("theme"),
  };

  let statusTimer;
  let saveTimer;
  let snoozedUntil = 0;

  const arabic = (n) => Number(n).toLocaleString("ar-EG");

  function showStatus(message, isError = false) {
    clearTimeout(statusTimer);
    els.status.textContent = message;
    els.status.classList.toggle("error", isError);
    statusTimer = setTimeout(() => (els.status.textContent = ""), message.length > 20 ? 4500 : 2000);
  }

  function readSettings() {
    return {
      dekrType: els.type.value,
      minutes: Math.min(1440, Math.max(1, parseInt(els.minutes.value, 10) || 5)),
      remindersEnabled: els.enabled.checked,
    };
  }

  function formatDuration(minutes) {
    if (minutes < 1) return "أقل من دقيقة";
    if (minutes === 1) return "دقيقة";
    if (minutes === 2) return "دقيقتين";
    if (minutes < 60) return `${arabic(minutes)} ${minutes <= 10 ? "دقائق" : "دقيقة"}`;
    const hours = Math.round(minutes / 60);
    if (hours === 1) return "ساعة";
    if (hours === 2) return "ساعتين";
    return `${arabic(hours)} ${hours <= 10 ? "ساعات" : "ساعة"}`;
  }

  async function renderSummary() {
    const { remindersEnabled } = readSettings();
    if (!remindersEnabled) {
      els.summary.textContent = "متوقفة";
      return;
    }
    if (snoozedUntil > Date.now()) {
      els.summary.textContent = `متوقفة مؤقتًا، تعود بعد ${formatDuration(Math.ceil((snoozedUntil - Date.now()) / 60000))}`;
      return;
    }
    const alarm = await chrome.alarms.get(ALARM_NAME);
    const left = alarm ? Math.ceil((alarm.scheduledTime - Date.now()) / 60000) : null;
    els.summary.textContent = left === null ? `كل ${formatDuration(readSettings().minutes)}` : `التذكير القادم بعد ${formatDuration(left)}`;
  }

  function render() {
    const { minutes, remindersEnabled } = readSettings();
    els.controls.disabled = !remindersEnabled;
    els.snooze.hidden = !remindersEnabled;
    els.custom.classList.toggle("active", !PRESETS.includes(minutes));
    els.presets.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-checked", String(Number(button.dataset.minutes) === minutes));
    });
    const snoozed = snoozedUntil > Date.now();
    const snoozeLabel = snoozed ? "استئناف التذكيرات الآن" : "إيقاف مؤقت لساعة";
    els.snooze.setAttribute("aria-pressed", String(snoozed));
    els.snooze.setAttribute("aria-label", snoozeLabel);
    els.snooze.title = snoozeLabel;
    renderSummary();
  }

  async function save() {
    const settings = readSettings();
    els.minutes.value = settings.minutes;
    try {
      const response = await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      if (!response?.success) throw new Error(response?.error);
      render();
      showStatus("تم الحفظ");
    } catch (error) {
      console.error(error);
      showStatus("تعذّر حفظ الإعدادات", true);
    }
  }

  function applyTheme(theme) {
    if (theme === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
    els.theme.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.theme === theme));
    });
  }

  async function requestPreview(attempt = 0) {
    try {
      const response = await chrome.runtime.sendMessage({ action: "previewDekr", dekrType: els.type.value });
      if (response?.dekr) return response.dekr;
    } catch (error) {
      console.warn("Preview request failed:", error);
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return requestPreview(attempt + 1);
    }
    const adkar = Object.values(await (await fetch("data/adkar.json")).json()).flat();
    return adkar[Math.floor(Math.random() * adkar.length)];
  }

  async function loadPreview() {
    els.previewText.classList.add("fading");
    const dekr = await requestPreview().catch(() => null);
    els.previewCategory.textContent = dekr?.category ?? "";
    els.previewText.textContent = dekr?.content ?? "تعذّر تحميل الذكر";
    els.previewText.classList.remove("fading");
  }

  els.enabled.addEventListener("change", save);
  els.type.addEventListener("change", () => {
    save();
    loadPreview();
  });
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
  els.snooze.addEventListener("click", async () => {
    snoozedUntil = snoozedUntil > Date.now() ? 0 : Date.now() + 60 * 60 * 1000;
    await chrome.storage.local.set({ snoozedUntil });
    render();
    showStatus(snoozedUntil ? "أوقفت التذكيرات لساعة" : "عادت التذكيرات");
  });
  els.previewNext.addEventListener("click", loadPreview);
  els.theme.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-theme]");
    if (!button) return;
    applyTheme(button.dataset.theme);
    chrome.storage.sync.set({ popupTheme: button.dataset.theme });
  });
  els.test.addEventListener("click", async () => {
    const response = await chrome.runtime.sendMessage({ action: "testNotification", dekrType: els.type.value });
    showStatus(
      response?.success
        ? "أُرسل التذكير. لم يظهر؟ فعّل إشعارات المتصفح من إعدادات النظام"
        : response?.blocked
          ? "الإشعارات محظورة لهذه الإضافة في المتصفح"
          : "تعذّر الإرسال، أعد المحاولة",
      !response?.success
    );
  });

  const [data, local] = await Promise.all([
    chrome.storage.sync.get(["dekrType", "minutes", "remindersEnabled", "popupTheme"]),
    chrome.storage.local.get("snoozedUntil"),
  ]);
  applyTheme(data.popupTheme || "auto");
  els.type.value = data.dekrType || "random";
  els.minutes.value = data.minutes || 5;
  els.enabled.checked = data.remindersEnabled !== false;
  snoozedUntil = local.snoozedUntil || 0;
  render();
  loadPreview();
  setInterval(renderSummary, 30000);
});
