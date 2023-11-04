const body = document.body;
const imagesNumber = 18;
let audio = null;
let currentAyahNumber = null;
let tafseerDisplayed = false;

// Function to fetch data from an API
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    } catch (error) {
        console.error("Fetch error:", error);
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
        audio.pause(); // Pause the current audio
        audio = null; // Release the current audio instance
    }
    audio = new Audio(data.audio);
    audio.onended = () => fetchSequentialAyah(true, true); // Automatically play the next ayah
    if (isPlayed) audio.play()
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
            console.error(`Error fetching ${isNext ? "next" : "previous"} ayah:`, error);
        }
    }
}

// Function to fetch and display tafseer for the current ayah
async function getAyahTafseer(surah, ayah) {
    const tafseerUrl = `http://api.quran-tafseer.com/tafseer/1/${surah}/${ayah}`;
    try {
        const tafseer = await fetchData(tafseerUrl);
        if (tafseer.text) {
            const tafseerTxt = document.getElementById('tafseer');
            tafseerTxt.textContent = tafseer.text;
        }
    } catch (error) {
        console.error("Error fetching tafseer:", error);
    }
}

// Initialize the background image
function initBackgroundImage() {
    const randomImage = Math.floor(Math.random() * imagesNumber) + 1;
    body.style.backgroundImage = `url(images/${randomImage}.jpeg)`;
}

// Event listener for background image initialization
window.addEventListener('load', initBackgroundImage);

// Event listeners for navigation buttons
const next = document.getElementById('next');
const previous = document.getElementById('previous');
next.addEventListener('click', () => fetchSequentialAyah(true));
previous.addEventListener('click', () => fetchSequentialAyah(false));

// Event listener for play/pause button
const player = document.querySelector('.play-pause');
player.addEventListener('click', () => {
    if (audio) {
        audio.paused ? audio.play() : audio.pause();
        player.querySelector('.play').classList.toggle('hidden');
        player.querySelector('.pause').classList.toggle('hidden');
    }
})

// Event listener for showing/hiding tafseer
document.getElementById('toggleTafseer').addEventListener('click', (e) => {
    tafseerDisplayed = !tafseerDisplayed;
    e.target.classList.toggle('toggle-down');
    e.target.classList.toggle('toggle-up');
    document.querySelector('.tooltiptext').textContent = tafseerDisplayed ? "Hide Tafseer" : "Show Tafseer";
    const tafseerContainer = document.querySelector('.tafseer-container');
    tafseerContainer.classList.toggle('hidden-tafseer');
});

// Event listener for space bar key to toggle play/pause
document.body.onkeyup = function (e) {
    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
        if (audio) {
            audio.paused ? audio.play() : audio.pause();
            player.querySelector('.play').classList.toggle('hidden');
            player.querySelector('.pause').classList.toggle('hidden');
        }
    }
};

// Initial fetch of a random ayah
fetchRandomAyah();
