document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get(["dekrType", "minutes"], function (data) {
    const adkarTypeSelect = document.getElementById("adkarType");
    const numInput = document.getElementById("num");

    if (!adkarTypeSelect || !numInput) {
      console.error("Required DOM elements not found");
      return;
    }

    console.log("min : " + data.minutes + "  type = " + data.dekrType);

    if (data.dekrType) {
      adkarTypeSelect.value = data.dekrType;
    }

    if (data.minutes) {
      numInput.value = data.minutes;
    }
  });

  const addButton = document.getElementById("add");
  if (addButton) {
    addButton.addEventListener("click", remind);
  } else {
    console.error("Add button not found");
  }
});

function remind() {
  const adkarTypeSelect = document.getElementById("adkarType");
  const numInput = document.getElementById("num");

  if (!adkarTypeSelect || !numInput) {
    console.error("Required DOM elements not found in remind function");
    return;
  }

  const dekrType = adkarTypeSelect.value;
  const minutes = parseInt(numInput.value);

  if (isNaN(minutes) || minutes < 1) {
    console.log("Invalid number entered");
    return;
  }

  chrome.storage.sync.set({ dekrType, minutes }, function () {
    console.log("Values saved to storage.");
  });

  chrome.runtime.sendMessage({ minutes, dekrType }, function (response) {
    if (chrome.runtime.lastError) {
      console.error("Error sending message:", chrome.runtime.lastError);
    } else {
      console.log(response);
    }
  });
}
