
document.getElementById("add").addEventListener("click", remind);


function remind() {
    const adkarTypeSelect = document.getElementById("adkarType");
    const dekrType = adkarTypeSelect.value;
    const minutes = parseInt(document.getElementById("num").value);

    if (isNaN(minutes)) {
        console.log("It's not a number");
    } else {
        console.log(minutes);
        chrome.runtime.sendMessage({ minutes, dekrType }, function (response) {
            console.log(response);
        });
    }

    // create a reminder here
}