// function fetchAndDisplayDekr() {
//     fetch("https://ayah.nawafdev.com/api/dekr?types=m")
//         .then((response) => response.json())
//         .then((data) => {
//             const dekrContainer = document.getElementById("dekr-container");
//             dekrContainer.innerHTML = `${data.content}`;
//         })
//         .catch((error) => console.error(error));
// }

// fetchAndDisplayDekr();
// setInterval(fetchAndDisplayDekr, 30000); // Refresh every 30 seconds
// add event listener on button

// grab the value from input
// create an alarm for that value

document.getElementById("add").addEventListener("click", remind);

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