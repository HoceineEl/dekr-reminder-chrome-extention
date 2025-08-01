const body = document.body;
const imagesNumber = 18;
let audio = null;
let currentAyahNumber = null;
let tafseerDisplayed = false;

// Function to fetch data from a URL (either API or local file)
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

// Function to fetch a random Quranic verse
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

// Function to update the displayed ayah data
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

// Function to fetch a sequential ayah
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

// Function to fetch and display tafseer
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

// Function to display clock and date
function displayTime() {
  const now = new Date();
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");

  // Clock
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  clockEl.textContent = `${hours}:${minutes}`;

  // Date
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateEl.textContent = now.toLocaleDateString("en-US", options);
}

// Function to display a random dekr
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

// Function to initialize the background image
function initBackgroundImage() {
  const randomImage = Math.floor(Math.random() * imagesNumber) + 1;
  document.querySelector(
    ".content"
  ).style.backgroundImage = `url(images/${randomImage}.jpeg)`;
}

// Set default Ayah (Ayat Al-Kursi) as a fallback
function setAyatAlkursi() {
  document.getElementById("text").textContent =
    "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ ٢٥٥";
  document.getElementById("surah-name").textContent = "سورة البقرة";
  document.getElementById("tafseer").textContent =
    "الله الذي لا يستحق الألوهية والعبودية إلا هو، الحيُّ الذي له جميع معاني الحياة الكاملة كما يليق بجلاله، القائم على كل شيء، لا تأخذه سِنَة أي: نعاس، ولا نوم، كل ما في السماوات وما في الأرض ملك له، ولا يتجاسر أحد أن يشفع عنده إلا بإذنه، محيط علمه بجميع الكائنات ماضيها وحاضرها ومستقبلها، يعلم ما بين أيدي الخلائق من الأمور المستقبلة، وما خلفهم من الأمور الماضية، ولا يَطَّلعُ أحد من الخلق على شيء من علمه إلا بما أعلمه الله وأطلعه عليه. وسع كرسيه السماوات والأرض، والكرسي: هو موضع قدمي الرب -جل جلاله- ولا يعلم كيفيته إلا الله سبحانه، ولا يثقله سبحانه حفظهما، وهو العلي بذاته وصفاته على جميع مخلوقاته، الجامع لجميع صفات العظمة والكبرياء. وهذه الآية أعظم آية في القرآن، وتسمى: (آية الكرسي). ";
}

// --- Event Listeners and Initializations ---

// Initialize Background Image
window.addEventListener("load", initBackgroundImage);

// Navigation Buttons
document
  .getElementById("next")
  .addEventListener("click", () => fetchSequentialAyah(true));
document
  .getElementById("previous")
  .addEventListener("click", () => fetchSequentialAyah(false));

// Play/Pause Button
const player = document.querySelector(".play-pause");
player.addEventListener("click", () => {
  if (audio) {
    audio.paused ? audio.play() : audio.pause();
    player.querySelector(".play").classList.toggle("hidden");
    player.querySelector(".pause").classList.toggle("hidden");
  }
});

// Tafseer Toggle
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

// Theme Management
const themeSwitch = document.getElementById("checkbox");

function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  themeSwitch.checked = isDark;
}

themeSwitch.addEventListener("change", function () {
  const isDark = this.checked;
  chrome.storage.sync.set({ theme: isDark ? "dark" : "light" }, () => {
    applyTheme(isDark);
  });
});

// Keyboard Controls
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

// Initial Function Calls
chrome.storage.sync.get("theme", (data) => {
  applyTheme(data.theme === "dark");
});

fetchRandomAyah();
displayTime();
setInterval(displayTime, 1000); // Update time every second
displayRandomDekr();
