console.log("in background script");

let defaultDuration = 1.0;
let dekrType = "random";

chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log(alarm);
    const url = "https://ayah.nawafdev.com/api/dekr?types=" + dekrType;
    console.log(url);
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            const dekr = data.content;
            const category = data.category;
            chrome.notifications.create("my-notification", {
                type: "basic",
                iconUrl: "./images/icon.png",
                title: dekrType === "random" ? "Daily Dekr" : category,
                message: dekr,
                eventTime: Date.now() + 50000,
            }, function (notificationID) {
                console.log("Displayed the notification");
            });
        })
        .catch((error) => console.error(error));
});

function createAlarm() {
    chrome.alarms.create("dekr-reminder", { delayInMinutes: defaultDuration });
}

createAlarm();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    defaultDuration = request.minutes * 1.0;
    dekrType = request.dekrType;
    console.log("Event received in the background page. Minutes: " + request.minutes + " Dekr Type: " + dekrType);
    createAlarm();
    sendResponse({ success: true });
});

// Omnibox (Optional)

chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
    console.log(text);
    suggest([
        { content: "First content", description: "First desc" },
        { content: "Second Content", description: "Second Desc" }
    ]);
});

chrome.omnibox.setDefaultSuggestion({ description: "Default suggestion here" });

chrome.storage.sync.set({ Name: "hoceine" }, function () {
    console.log("Value is set");
    chrome.storage.sync.get(['Name'], function (result) {
        console.log(result);
    });
});
