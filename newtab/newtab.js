document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const imagesNumber = 18;
  let audio = null;
  let currentAyahNumber = null;
  let tafseerDisplayed = false;
  const themeSwitch = document.getElementById("checkbox");

  // --- Functions ---

  async function fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok for ${url}`);
      }
      return response.json();
    } catch (error) {
      if (url.includes("api.alquran.cloud")) {
        setAyatAlkursi(); // Fallback for Quran API
      }
      console.error(`Error fetching data from ${url}:`, error);
      throw error;
    }
  }

  async function fetchRandomAyah() {
    try {
      const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
      const randomQuranAyah = `http://api.alquran.cloud/v1/ayah/${randomAyahNumber}/ar.alafasy`;
      const ayah = await fetchData(randomQuranAyah);

      if (ayah.data && ayah.data.text) {
        updateAyahData(ayah.data, randomAyahNumber);
      }
    } catch (error) {
      console.error("Error fetching random ayah:", error);
    }
  }

  function updateAyahData(data, ayahNumber, isPlayed = false) {
    const ayahTxt = document.getElementById("text");
    const surah = document.getElementById("surah-name");
    ayahTxt.textContent = data.text;
    surah.textContent = data.surah.name;
    currentAyahNumber = ayahNumber;
    if (audio) {
      audio.pause();
      audio = null;
    }
    audio = new Audio(data.audio);
    audio.onended = () => fetchSequentialAyah(true, true);
    if (isPlayed) audio.play();
    getAyahTafseer(data.surah.number, data.numberInSurah);
  }

  async function fetchSequentialAyah(isNext, endeed = false) {
    if (audio) {
      const direction = isNext ? 1 : -1;
      const newAyahNumber = currentAyahNumber + direction;
      const newQuranAyah = `http://api.alquran.cloud/v1/ayah/${newAyahNumber}/ar.alafasy`;

      try {
        const ayah = await fetchData(newQuranAyah);

        if (ayah.data && ayah.data.text) {
          updateAyahData(ayah.data, newAyahNumber, !audio.paused || endeed);
        }
      } catch (error) {
        console.error(
          `Error fetching ${isNext ? "next" : "previous"} ayah:`,
          error
        );
      }
    }
  }

  async function getAyahTafseer(surah, ayah) {
    const tafseerUrl = `http://api.quran-tafseer.com/tafseer/1/${surah}/${ayah}`;
    try {
      const tafseer = await fetchData(tafseerUrl);
      if (tafseer.text) {
        document.getElementById("tafseer").textContent = tafseer.text;
      }
    } catch (error) {
      console.error("Error fetching tafseer:", error);
    }
  }

  function displayTime() {
    const now = new Date();
    const clockEl = document.getElementById("clock");
    const dateEl = document.getElementById("date");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${hours}:${minutes}`;

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    dateEl.textContent = now.toLocaleDateString("en-US", options);
  }

  async function displayRandomDekr() {
    try {
      const adkarData = await fetchData("../data/adkar.json");
      const allAdkar = Object.values(adkarData).flat();
      const randomDekr = allAdkar[Math.floor(Math.random() * allAdkar.length)];
      document.getElementById("random-dekr").textContent = randomDekr.content;
    } catch (error) {
      console.error("Error displaying random dekr:", error);
    }
  }

  function initBackgroundImage() {
    const randomImage = Math.floor(Math.random() * imagesNumber) + 1;
    document.body.style.backgroundImage = `url(images/${randomImage}.jpeg)`;
  }

  function setAyatAlkursi() {
    document.getElementById("text").textContent =
      "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ ٢٥٥";
    document.getElementById("surah-name").textContent = "سورة البقرة";
    document.getElementById("tafseer").textContent =
      "الله الذي لا يستحق الألوهية والعبودية إلا هو، الحيُّ الذي له جميع معاني الحياة الكاملة كما يليق بجلاله، القائم على كل شيء، لا تأخذه سِنَة أي: نعاس، ولا نوم، كل ما في السماوات وما في الأرض ملك له، ولا يتجاسر أحد أن يشفع عنده إلا بإذنه، محيط علمه بجميع الكائنات ماضيها وحاضرها ومستقبلها، يعلم ما بين أَيْدِي الخلائق من الأمور المستقبلة، وما خلفهم من الأمور الماضية، ولا يَطَّلعُ أحد من الخلق على شيء من علمه إلا بما أعلمه الله وأطلعه عليه. وسع كرسيه السماوات والأرض، والكرسي: هو موضع قدمي الرب -جل جلاله- ولا يعلم كيفيته إلا الله سبحانه، ولا يثقله سبحانه حفظهما، وهو العلي بذاته وصفاته على جميع مخلوقاته، الجامع لجميع صفات العظمة والكبرياء. وهذه الآية أعظم آية في القرآن، وتسمى: (آية الكرسي). ";
  }

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    if (themeSwitch) themeSwitch.checked = isDark;
  }

  async function getPrayerTimes() {
    const prayerTimesList = document.getElementById("prayer-times-list");
    const prayerLocation = document.getElementById("prayer-location");

    const cachedData = await getFromCache("prayerTimes");
    if (cachedData) {
      displayPrayerTimes(cachedData.timings, cachedData.location);
      startCountdown(cachedData.timings);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const apiUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;

        try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error("Failed to fetch prayer times.");
          }
          const data = await response.json();
          const timings = data.data.timings;
          const location = data.data.meta.timezone;

          saveToCache(
            "prayerTimes",
            { timings, location },
            24 * 60 * 60 * 1000
          );
          displayPrayerTimes(timings, location);
          startCountdown(timings);
        } catch (error) {
          console.error(error);
          showPrayerError(
            "Could not fetch prayer times. Please try again later."
          );
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        showPrayerError("Please enable location access to see prayer times.");
      }
    );
  }

  function displayPrayerTimes(timings, location) {
    const prayerTimesList = document.getElementById("prayer-times-list");
    const prayerLocation = document.getElementById("prayer-location");
    const prayersToShow = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const currentTime = new Date();

    prayerTimesList.innerHTML = "";

    const nextPrayer = findNextPrayer(timings, prayersToShow);

    prayersToShow.forEach((prayerName) => {
      const time = timings[prayerName];
      const prayerEl = document.createElement("div");
      prayerEl.classList.add("prayer-time");

      const prayerTime = parseTime(time);
      const isNext = prayerName === nextPrayer.name;
      const isPassed = prayerTime < currentTime && !isNext;

      if (isNext) {
        prayerEl.classList.add("active");
      }
      if (isPassed) {
        prayerEl.classList.add("passed");
      }

      const icon = getPrayerIcon(prayerName);
      prayerEl.innerHTML = `
        <div class="name">${icon} ${prayerName}</div>
        <div class="time">${formatTime12Hour(time)}</div>
      `;
      prayerTimesList.appendChild(prayerEl);
    });

    prayerLocation.textContent = `📍 ${location.replace(/_/g, " ")}`;
  }

  function showPrayerError(message) {
    const prayerTimesList = document.getElementById("prayer-times-list");
    prayerTimesList.innerHTML = `<div class="error-prayer">${message}</div>`;
  }

  function getPrayerIcon(prayerName) {
    const icons = {
      Fajr: "🌅",
      Dhuhr: "☀️",
      Asr: "🌤️",
      Maghrib: "🌅",
      Isha: "🌙",
    };
    return icons[prayerName] || "🕌";
  }

  function findNextPrayer(timings, prayersToShow) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const prayerName of prayersToShow) {
      const prayerTime = parseTime(timings[prayerName]);
      const prayerMinutes =
        prayerTime.getHours() * 60 + prayerTime.getMinutes();

      if (prayerMinutes > currentMinutes) {
        return { name: prayerName, time: timings[prayerName] };
      }
    }

    return { name: prayersToShow[0], time: timings[prayersToShow[0]] };
  }

  function parseTime(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function formatTime12Hour(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  function startCountdown(timings) {
    const prayersToShow = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

    function updateCountdown() {
      const nextPrayer = findNextPrayer(timings, prayersToShow);
      const nextPrayerTime = parseTime(nextPrayer.time);
      const now = new Date();

      if (nextPrayer.name === "Fajr" && nextPrayerTime < now) {
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
      }

      const timeDiff = nextPrayerTime.getTime() - now.getTime();

      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        document.getElementById(
          "next-prayer-name"
        ).textContent = `Next: ${nextPrayer.name}`;
        document.getElementById("countdown-time").textContent = `${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
        document.getElementById(
          "next-prayer-time"
        ).textContent = `at ${formatTime12Hour(nextPrayer.time)}`;

        const totalDayMinutes = 24 * 60;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const nextPrayerMinutes =
          nextPrayerTime.getHours() * 60 + nextPrayerTime.getMinutes();

        let progress;
        if (nextPrayerMinutes > currentMinutes) {
          const timeToNext = nextPrayerMinutes - currentMinutes;
          const timeSinceStart = currentMinutes;
          progress = (timeSinceStart / (timeSinceStart + timeToNext)) * 100;
        } else {
          const timeToNext =
            nextPrayerMinutes + totalDayMinutes - currentMinutes;
          const timeSinceStart = currentMinutes;
          progress = (timeSinceStart / (timeSinceStart + timeToNext)) * 100;
        }

        document.getElementById("progress-fill").style.width = `${Math.min(
          progress,
          100
        )}%`;
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  async function saveToCache(key, data, ttl) {
    const item = {
      data: data,
      expiry: new Date().getTime() + ttl,
    };
    await chrome.storage.local.set({ [key]: item });
  }

  async function getFromCache(key) {
    const result = await chrome.storage.local.get(key);
    const item = result[key];

    if (!item || new Date().getTime() > item.expiry) {
      return null;
    }
    return item.data;
  }

  // --- Event Listeners ---

  document
    .getElementById("next")
    .addEventListener("click", () => fetchSequentialAyah(true));
  document
    .getElementById("previous")
    .addEventListener("click", () => fetchSequentialAyah(false));

  const player = document.querySelector(".play-pause");
  player.addEventListener("click", () => {
    if (audio) {
      audio.paused ? audio.play() : audio.pause();
      player.querySelector(".play").classList.toggle("hidden");
      player.querySelector(".pause").classList.toggle("hidden");
    }
  });

  document.getElementById("toggleTafseer").addEventListener("click", (e) => {
    tafseerDisplayed = !tafseerDisplayed;
    e.currentTarget.classList.toggle("toggle-up");
    document.querySelector(".tooltiptext").textContent = tafseerDisplayed
      ? "Hide Tafseer"
      : "Show Tafseer";
    document
      .querySelector(".tafseer-container")
      .classList.toggle("hidden-tafseer");
  });

  if (themeSwitch) {
    themeSwitch.addEventListener("change", function () {
      chrome.storage.sync.set({ theme: this.checked ? "dark" : "light" });
    });
  }

  document.body.onkeyup = function (e) {
    if (e.code === "Space") {
      if (audio) {
        audio.paused ? audio.play() : audio.pause();
        player.querySelector(".play").classList.toggle("hidden");
        player.querySelector(".pause").classList.toggle("hidden");
      }
    }
  };
  document.body.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      fetchSequentialAyah(false);
    } else if (e.key === "ArrowRight") {
      fetchSequentialAyah(true);
    }
  });

  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.theme) {
      applyTheme(changes.theme.newValue === "dark");
    }
  });

  // --- Initial Load ---
  initBackgroundImage();
  fetchRandomAyah();
  displayTime();
  setInterval(displayTime, 1000);
  displayRandomDekr();
  getPrayerTimes();

  chrome.storage.sync.get("theme", function (data) {
    applyTheme(data.theme === "dark");
  });
});
