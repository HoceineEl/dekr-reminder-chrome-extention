console.log("in background script");

// Initialize default values
let defaultDuration = 1.0;
let dekrType = "random";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install') {
        return;
    }

    // Set initial values in Chrome storage
    chrome.storage.sync.set({ dekrType, minutes: defaultDuration, newTab: true }, function () {
        console.log("Values saved to storage for the first time.");
    });
});

function createAlarm() {
    // Fetch values from Chrome storage and create the alarm
    chrome.storage.sync.get(["dekrType", "minutes"], function (data) {
        dekrType = data.dekrType || "random";
        defaultDuration = data.minutes || 1;
        chrome.alarms.create("dekr-reminder", { periodInMinutes: defaultDuration });
    });
}

createAlarm();

chrome.alarms.onAlarm.addListener(function (alarm) {
    // Fetch values from Chrome storage before making the request
    chrome.storage.sync.get(["dekrType"], function (data) {
        dekrType = data.dekrType || "random";

        const url = "https://ayah.nawafdev.com/api/dekr?types=" + dekrType;
        console.log(url);
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                let dekr = data.content;
                let category = data.category;
                chrome.notifications.create("my-notification", {
                    type: "basic",
                    iconUrl: "./images/icon.png",
                    title: dekrType === "random" ? "" : category,
                    message: dekr,
                    eventTime: Date.now() + 50000,
                }, function (notificationID) {
                    console.log("Displayed the notification");
                });
            })
            .catch((error) => console.error(error));
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Update values in Chrome storage when a message is received
    if (request.minutes !== undefined) {
        defaultDuration = request.minutes * 1.0;
        dekrType = request.dekrType;

        chrome.storage.sync.set({ dekrType, minutes: defaultDuration }, function () {
            console.log("Values saved to storage.");
        });

        createAlarm();
        sendResponse({ success: true });
    }
});
let overrideNewTab = true; // Initial state





