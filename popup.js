document.addEventListener("DOMContentLoaded", function () {
  const adkarTypeSelect = document.querySelector(".custom-select");
  const numInput = document.getElementById("num");
  const statusMessage = document.getElementById("status-message");

  if (!adkarTypeSelect || !numInput) {
    console.error("Required DOM elements not found");
    return;
  }

  // Load saved values
  chrome.storage.sync.get(["dekrType", "minutes"], function (data) {
    if (data.dekrType) {
      updateSelectValue(data.dekrType);
    }
    if (data.minutes) {
      numInput.value = data.minutes;
    }
  });

  // Custom Select Logic
  const selectTrigger = adkarTypeSelect.querySelector(".custom-select-trigger");
  const options = adkarTypeSelect.querySelectorAll(".custom-option");

  selectTrigger.addEventListener("click", () => {
    adkarTypeSelect.classList.toggle("open");
  });

  options.forEach((option) => {
    option.addEventListener("click", function () {
      const value = this.getAttribute("data-value");
      updateSelectValue(value);
      adkarTypeSelect.classList.remove("open");
    });
  });

  function updateSelectValue(value) {
    const selectedOption = adkarTypeSelect.querySelector(
      `.custom-option[data-value="${value}"]`
    );
    if (selectedOption) {
      adkarTypeSelect.querySelector(".custom-select-trigger span").textContent =
        selectedOption.textContent;
      options.forEach((opt) => opt.classList.remove("selected"));
      selectedOption.classList.add("selected");
      adkarTypeSelect.setAttribute("data-value", value);
    }
  }

  // Input Stepper Logic
  document.getElementById("increment").addEventListener("click", () => {
    numInput.value = parseInt(numInput.value, 10) + 1;
  });

  document.getElementById("decrement").addEventListener("click", () => {
    const currentValue = parseInt(numInput.value, 10);
    if (currentValue > 1) {
      numInput.value = currentValue - 1;
    }
  });

  // Main Button Logic
  document.getElementById("add").addEventListener("click", remind);

  function remind() {
    const dekrType = adkarTypeSelect.getAttribute("data-value") || "random";
    const minutes = parseInt(numInput.value);

    if (isNaN(minutes) || minutes < 1) {
      showStatus("Invalid number!", true);
      return;
    }

    chrome.storage.sync.set({ dekrType, minutes }, () => {
      showStatus("Reminder set successfully!", false);
    });

    chrome.runtime.sendMessage({ minutes, dekrType }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        showStatus("Error setting reminder.", true);
      } else {
        console.log(response);
      }
    });
  }

  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? "#d93025" : "var(--primary-color)";
    statusMessage.style.opacity = 1;

    setTimeout(() => {
      statusMessage.style.opacity = 0;
    }, 3000);
  }

  // Close select when clicking outside
  window.addEventListener("click", function (e) {
    if (!adkarTypeSelect.contains(e.target)) {
      adkarTypeSelect.classList.remove("open");
    }
  });
});
