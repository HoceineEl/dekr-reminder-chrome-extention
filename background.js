console.log("in background script");

let defaultDuration = 1.0;
let dekrType = "random";
let adkarData = null;
let dataLoaded = false;

// --- Data Loading ---
async function loadAdkarData() {
  try {
    const response = await fetch(chrome.runtime.getURL("data/adkar.json"));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    adkarData = await response.json();
    dataLoaded = true;
    console.log("Adkar data loaded successfully");
  } catch (error) {
    console.error("Failed to load adkar data:", error);
    dataLoaded = false;
  }
}

// --- Initialization ---
chrome.runtime.onStartup.addListener(() => {
  loadAdkarData();
  resetDailyCounter();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await loadAdkarData();
  resetDailyCounter();

  if (reason === "install") {
    chrome.storage.sync.set({
      dekrType,
      minutes: defaultDuration,
      remindersEnabled: true, // New master toggle
      reminderCount: 0,
      lastReset: new Date().toISOString().split("T")[0],
    });
  }
});

// --- Alarms ---
function createAlarm() {
  chrome.storage.sync.get(
    ["dekrType", "minutes", "remindersEnabled"],
    function (data) {
      if (data.remindersEnabled) {
        dekrType = data.dekrType || "random";
        defaultDuration = data.minutes || 1;
        chrome.alarms.create("dekr-reminder", {
          periodInMinutes: defaultDuration,
        });
        console.log(`Alarm created for ${defaultDuration} minutes`);
      } else {
        chrome.alarms.clear("dekr-reminder");
        console.log("Reminders are disabled. Alarm cleared.");
      }
    }
  );
}

createAlarm();

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "dekr-reminder") {
    chrome.storage.sync.get(["dekrType", "remindersEnabled"], function (data) {
      if (data.remindersEnabled) {
        const dekrType = data.dekrType || "random";
        showNotification(dekrType);
      }
    });
  }
});

// --- Notifications ---
async function showNotification(dekrType) {
  try {
    if (!dataLoaded) {
      console.log("Adkar data not loaded, attempting to load now...");
      await loadAdkarData();
      if (!dataLoaded) {
        console.error(
          "Failed to load adkar data after retry. Cannot show notification."
        );
        return;
      }
    }

    const adkar = await getRandomAdkar(dekrType);

    if (adkar) {
      chrome.notifications.create(
        "dekr-notification-" + Date.now(),
        {
          type: "basic",
          iconUrl: "./images/icon.png",
          title: adkar.category,
          message: adkar.content,
          priority: 2,
        },
        function (notificationID) {
          if (chrome.runtime.lastError) {
            console.error("Notification error:", chrome.runtime.lastError);
          } else {
            console.log("Notification displayed:", notificationID);
            updateReminderCount();
          }
        }
      );
    } else {
      console.error("Failed to get adkar for notification of type:", dekrType);
    }
  } catch (error) {
    console.error("Error in showNotification:", error);
  }
}

// --- Reminder Logic ---
async function getRandomAdkar(category) {
  if (!dataLoaded || !adkarData) {
    console.error("Adkar data not loaded yet");
    return null;
  }

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

  if (!selectedCategoryName || !adkarData[selectedCategoryName]) {
    console.error("Category not found:", selectedCategoryName);
    return null;
  }

  const adkarArray = adkarData[selectedCategoryName];
  if (!adkarArray || adkarArray.length === 0) {
    console.error("No adhkar found in category:", selectedCategoryName);
    return null;
  }

  const randomIndex = Math.floor(Math.random() * adkarArray.length);
  const selectedAdkar = adkarArray[randomIndex];

  return {
    content: selectedAdkar.content,
    category: selectedCategoryName,
    count: selectedAdkar.count,
    description: selectedAdkar.description,
  };
}

// --- Message Handling ---
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.settings) {
    chrome.storage.sync.set(
      {
        dekrType: request.settings.dekrType,
        minutes: request.settings.minutes,
        remindersEnabled: request.settings.remindersEnabled,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error saving settings:",
            chrome.runtime.lastError.message
          );
        } else {
          // Settings saved successfully, now update the alarm
          console.log("Settings saved, updating alarm.");
          createAlarm();
        }
      }
    );
    // No response needed for this one-way communication
  }

  // Test function for debugging tracker
  if (request.testIncrement) {
    updateReminderCount();
  }

  if (request.testReset) {
    resetDailyCounter();
  }
});

// --- Progress Tracker ---
function updateReminderCount() {
  chrome.storage.sync.get(["reminderCount"], function (data) {
    let count = data.reminderCount || 0;
    const newCount = count + 1;
    chrome.storage.sync.set({ reminderCount: newCount }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error updating reminder count:",
          chrome.runtime.lastError
        );
      } else {
        console.log(`Reminder count updated: ${count} → ${newCount}`);
      }
    });
  });
}

function resetDailyCounter() {
  const today = new Date().toISOString().split("T")[0];
  chrome.storage.sync.get("lastReset", function (data) {
    if (data.lastReset !== today) {
      chrome.storage.sync.set({ reminderCount: 0, lastReset: today }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error resetting daily counter:",
            chrome.runtime.lastError
          );
        } else {
          console.log(`Daily counter reset for ${today}. Count: 0`);
        }
      });
    } else {
      console.log(
        `Daily counter check: Last reset was ${data.lastReset}, no reset needed`
      );
    }
  });
}
