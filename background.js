console.log("in background script");

let defaultDuration = 1.0;
let dekrType = "random";
let adkarData = null;
let dataLoaded = false;

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

chrome.runtime.onStartup.addListener(() => {
  loadAdkarData();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await loadAdkarData();

  if (reason === "install") {
    chrome.storage.sync.set(
      { dekrType, minutes: defaultDuration, newTab: true },
      function () {
        console.log("Values saved to storage for the first time.");
      }
    );
  }
});

function createAlarm() {
  chrome.storage.sync.get(["dekrType", "minutes"], function (data) {
    dekrType = data.dekrType || "random";
    defaultDuration = data.minutes || 1;
    chrome.alarms.clear("dekr-reminder", () => {
      chrome.alarms.create("dekr-reminder", {
        periodInMinutes: defaultDuration,
      });
      console.log(`Alarm created for ${defaultDuration} minutes`);
    });
  });
}

createAlarm();

function getRandomAdkar(category) {
  if (!dataLoaded || !adkarData) {
    console.error("Adkar data not loaded yet");
    return null;
  }

  let selectedCategory;

  if (category === "random") {
    const categories = Object.keys(adkarData);
    selectedCategory =
      categories[Math.floor(Math.random() * categories.length)];
  } else {
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
    selectedCategory = categoryMap[category];
  }

  if (!selectedCategory || !adkarData[selectedCategory]) {
    console.error("Category not found:", selectedCategory);
    return null;
  }

  const adkarArray = adkarData[selectedCategory];
  if (!adkarArray || adkarArray.length === 0) {
    console.error("No adhkar found in category:", selectedCategory);
    return null;
  }

  const randomIndex = Math.floor(Math.random() * adkarArray.length);
  const selectedAdkar = adkarArray[randomIndex];

  return {
    content: selectedAdkar.content,
    category: selectedCategory,
    count: selectedAdkar.count,
    description: selectedAdkar.description,
  };
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "dekr-reminder") {
    chrome.storage.sync.get(["dekrType"], function (data) {
      dekrType = data.dekrType || "random";

      if (!dataLoaded) {
        console.log("Data not loaded yet, attempting to reload...");
        loadAdkarData().then(() => {
          if (dataLoaded) {
            showNotification(dekrType);
          }
        });
      } else {
        showNotification(dekrType);
      }
    });
  }
});

function showNotification(dekrType) {
  const adkar = getRandomAdkar(dekrType);

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
        }
      }
    );
  } else {
    console.error("Failed to get adkar for notification");
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.minutes !== undefined) {
    defaultDuration = request.minutes * 1.0;
    dekrType = request.dekrType;

    chrome.storage.sync.set(
      { dekrType, minutes: defaultDuration },
      function () {
        console.log("Values saved to storage.");
      }
    );

    createAlarm();
    sendResponse({ success: true });
  }
});

let overrideNewTab = true;
