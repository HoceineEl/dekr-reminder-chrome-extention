const body = document.body;

// const format = window.innerWidth > 1400 ? "raw" : "regular"

// const keywords = "nature,landscape"; // Specify the keyword as "nature"

// const unsplashUrl = `https://api.unsplash.com/photos/random?page=1&query=${keywords}&client_id=dCpaD9oTx3ZEhfB0inDvHF01bN5btda7qkFWX5cQyjg&orientation=landscape&content_filter=high&featured=true&category=4`;

// fetch(unsplashUrl)
//     .then(response => {
//         if (!response.ok) {
//             throw new Error("Network response was not ok");
//         }
//         return response.json();
//     })
//     .then(image => {

//         body.style.backgroundImage = `url(${image.urls[format]})`;
//         document.getElementById('bg-color').style.backgroundColor = `${image.color}8f`
//     })
//     .catch(error => {
//         console.error("Fetch error:", error);
//     });

const imagesNumber = 11;
const randomImage = Math.floor(Math.random() * imagesNumber) + 1;
let audio = null;

body.style.backgroundImage = `url(images/${randomImage}.jpeg)`;

const ayahTxt = document.getElementById("text");
const surah = document.getElementById("surah-name");
const randomAyah = Math.floor(Math.random() * 6236) + 1;
const quranAyah = `http://api.alquran.cloud/v1/ayah/${randomAyah}/ar.alafasy`;
const tafseerTxt = document.getElementById('tafseer')
const tafseerContainer = document.querySelector('.tafseer-container')
let currentAyahNumber = null;
var tafseerDisplayed = false;
// Function to fetch a random Quranic verse
function fetchRandomAyah() {
    const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
    const randomQuranAyah = `http://api.alquran.cloud/v1/ayah/${randomAyahNumber}/ar.alafasy`;

    fetch(randomQuranAyah)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((ayah) => {
            if (ayah.data && ayah.data['text']) {
                ayahTxt.textContent = ayah.data['text'];
                surah.textContent = ayah.data.surah.name;
                currentAyahNumber = randomAyahNumber;
                audio = new Audio(ayah.data.audio);
                audio.onended = fetchNextSequentialAyah;
                getAyahTafseer(ayah.data.surah.number, ayah.data.numberInSurah)
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
        });
}

// Function to fetch the next sequential ayah
function fetchNextSequentialAyah() {
    if (currentAyahNumber !== null) {
        const nextAyahNumber = currentAyahNumber + 1;
        const nextQuranAyah = `http://api.alquran.cloud/v1/ayah/${nextAyahNumber}/ar.alafasy`;

        fetch(nextQuranAyah)
            .then((response) => {
                if (!response.ok) {
                    throw Error("Network response was not ok");
                }
                return response.json();
            })
            .then((ayah) => {
                if (ayah.data && ayah.data['text']) {
                    ayahTxt.textContent = ayah.data['text'];
                    surah.textContent = ayah.data.surah.name;
                    currentAyahNumber = nextAyahNumber; // Update the current ayah number
                    audio = new Audio(ayah.data.audio);
                    audio.play()
                    audio.onended = fetchNextSequentialAyah;
                    getAyahTafseer(ayah.data.surah.number, ayah.data.numberInSurah)
                }
            })
            .catch((error) => {
                console.error("Fetch error:", error);
            });
    }
}
function getAyahTafseer(surah, ayah) {
    const tafseerUrl = `http://api.quran-tafseer.com/tafseer/1/${surah}/${ayah}`;

    fetch(tafseerUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((tafseer) => {
            if (tafseer.text)
                tafseerTxt.textContent = tafseer.text

        })
        .catch((error) => {
            console.error("Fetch error:", error);
        });
}

fetchRandomAyah();




const player = document.querySelector('.fake-player');

function clickHandler() {
    audio && audio.paused ? audio.play() : audio.pause();
    player.querySelector('.play').classList.toggle('hidden');
    player.querySelector('.pause').classList.toggle('hidden');
}

document.getElementById('toggleTafseer').addEventListener('click', (e) => {
    tafseerDisplayed = !tafseerDisplayed;
    e.target.classList.toggle('toggle-down');
    e.target.classList.toggle('toggle-up');
    document.querySelector('.tooltiptext').textContent = tafseerDisplayed ? "Hide Tafseer" : "Show Tafseer";
    tafseerContainer.classList.toggle('hidden-tafseer');
});

player.addEventListener('click', clickHandler);
document.body.onkeyup = function (e) {
    if (e.key == " " ||
        e.code == "Space" ||
        e.keyCode == 32
    ) {
        clickHandler()

    }
}

