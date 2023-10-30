console.log("in background script")

let defaultDuration = 1.0;

chrome.alarms.onAlarm.addListener(function (alarm) {
    console.log(alarm);
    const url = "https://ayah.nawafdev.com/api/dekr?types=random"
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            const dekr = data.content;
            const category = data.category
            chrome.notifications.create("my notification", {
                type: "basic",
                iconUrl: "./images/icon.png",
                title: "",
                message: dekr,
                eventTime: Date.now() + 50000,
            }, function (notificationID) {
                console.log("displayed the notification");
            });
        })
        .catch((error) => console.error(error));
});


function createAlarm() {
    chrome.alarms.create("dekr-reminder", { delayInMinutes: defaultDuration });
}

createAlarm()

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log("Event recieved in background page " + request.minutes);
        defaultDuration = request.minutes * 1.0;
        createAlarm()
        sendResponse({ success: true });
    });

// omnibox

chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
    console.log(text);
    suggest([
        { content: "First content", description: "First desc" },
        { content: "Second Content", description: "Second Desc" }
    ])
})

chrome.omnibox.setDefaultSuggestion({ description: "Default suggestion here" })

chrome.storage.sync.set({ Name: "hoceine" }, function () {
    // when set runs
    console.log("value is set");

    chrome.storage.sync.get(['Name'], function (result) {
        console.log(result)
    })
})

