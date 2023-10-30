
document.getElementById("add").addEventListener("click", remind);
const adkarTypeSelect = document.getElementById("adkarType");

// Get the selected value
const selectedAdkarType = adkarTypeSelect.value;
function remind() {
    const minutes = parseInt(document.getElementById("num").value);

    if (isNaN(minutes)) {
        console.log("It's not a number");
    } else {
        console.log(minutes);
        chrome.runtime.sendMessage({ minutes }, function (response) {
            console.log(response);
        });
    }

    // create a reminder here
}