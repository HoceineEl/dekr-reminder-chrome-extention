let adkarData = null;
let dataLoaded = false;
const ALARM_NAME = "dekr-reminder";

async function loadAdkarData() {
  if (dataLoaded) return;
  try {
    const response = await fetch(chrome.runtime.getURL("data/adkar.json"));
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    adkarData = await response.json();
    dataLoaded = true;
  } catch (error) {
    console.error("Failed to load adkar data:", error);
  }
}

async function updateAlarm(settings) {
  await chrome.alarms.clear(ALARM_NAME);
  if (settings.remindersEnabled) {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: settings.minutes,
    });
  }
}

async function showNotification() {
  if (!dataLoaded) await loadAdkarData();
  const { dekrType } = await chrome.storage.sync.get("dekrType");
  const adkar = await getRandomAdkar(dekrType || "random");
  if (adkar) {
    chrome.notifications.create(`dekr-notification-${Date.now()}`, {
      type: "basic",
      iconUrl: "./images/icon.png",
      title: adkar.category,
      message: adkar.content,
      priority: 2,
    });
  }
}

async function getRandomAdkar(category) {
  if (!dataLoaded || !adkarData) return null;
  const categoryMap = {
    m: "أذكار الصباح",
    e: "أذكار المساء",
    qd: "أدعية قرآنية",
    pd: "أدعية الأنبياء",
    t: "تسابيح",
    bs: "أذكار النوم",
    wu: "أذكار الاستيقاظ",
    ps: "أذكار بعد السلام من الصلاة المفروضة",
  };
  const selectedCategoryName =
    category === "random"
      ? Object.keys(adkarData)[
          Math.floor(Math.random() * Object.keys(adkarData).length)
        ]
      : categoryMap[category];

  if (!selectedCategoryName || !adkarData[selectedCategoryName]) return null;
  const adkarArray = adkarData[selectedCategoryName];
  if (!adkarArray?.length) return null;

  const randomIndex = Math.floor(Math.random() * adkarArray.length);
  return adkarArray[randomIndex];
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveSettings") {
    (async () => {
      try {
        await chrome.storage.sync.set(request.settings);
        await updateAlarm(request.settings);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const { remindersEnabled } = await chrome.storage.sync.get(
      "remindersEnabled"
    );
    if (remindersEnabled) {
      showNotification();
    }
  }
});

async function checkAlarmState() {
  const settings = await chrome.storage.sync.get([
    "minutes",
    "remindersEnabled",
  ]);
  const alarm = await chrome.alarms.get(ALARM_NAME);

  if (settings.remindersEnabled && !alarm) {
    updateAlarm(settings);
  } else if (!settings.remindersEnabled && alarm) {
    await chrome.alarms.clear(ALARM_NAME);
  }
}

chrome.runtime.onStartup.addListener(() => {
  loadAdkarData();
  checkAlarmState();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const defaultSettings = {
      dekrType: "random",
      minutes: 5,
      remindersEnabled: true,
      theme: "light",
    };
    await chrome.storage.sync.set(defaultSettings);
    await updateAlarm(defaultSettings);
  }
  loadAdkarData();
  checkAlarmState();
});

loadAdkarData();
