
// document.getElementById("add").addEventListener("click", remind);


// function remind() {
//     const adkarTypeSelect = document.getElementById("adkarType");
//     const dekrType = adkarTypeSelect.value;
//     const minutes = parseInt(document.getElementById("num").value);

//     if (isNaN(minutes)) {
//         console.log("It's not a number");
//     } else {
//         console.log(minutes);
//         chrome.runtime.sendMessage({ minutes, dekrType }, function (response) {
//             console.log(response);
//         });
//     }

// }
document.addEventListener("DOMContentLoaded", function () {
    // Load stored values from Chrome storage and set them as defaults if available
    chrome.storage.sync.get(["dekrType", "minutes"], function (data) {
        const adkarTypeSelect = document.getElementById("adkarType");
        const numInput = document.getElementById("num");
        console.log('min : ' + data.minutes + "  type = " + data.dekrType)
        if (data.dekrType) {
            adkarTypeSelect.value = data.dekrType;
        }

        if (data.minutes) {
            numInput.value = data.minutes;
        }
    });

    document.getElementById("add").addEventListener("click", remind);
});

function remind() {
    const adkarTypeSelect = document.getElementById("adkarType");
    const dekrType = adkarTypeSelect.value;
    const numInput = document.getElementById("num");
    const minutes = parseInt(numInput.value);

    if (isNaN(minutes)) {
        console.log("It's not a number");
    } else {
        // Save the selected values to Chrome storage for future use
        chrome.storage.sync.set({ dekrType, minutes }, function () {
            console.log("Values saved to storage.");
        });

        chrome.runtime.sendMessage({ minutes, dekrType }, function (response) {
            console.log(response);
        });
    }
}
