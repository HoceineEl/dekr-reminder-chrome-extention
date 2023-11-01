const body = document.body;


const imagesNumber = 11;
const randomImage = Math.floor(Math.random() * (imagesNumber)) + 1;

body.style.backgroundImage = `url(images/${randomImage}.jpeg)`



const keywords = "nature"; // Specify the keyword as "nature"
const imageSize = "full";

const ayahTxt = document.getElementById("text")
const quranAyah = `http://api.alquran.cloud/v1/ayah/262/ar.alafasy`;

fetch(quranAyah)
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        return response.json();
    })
    .then(ayah => {
        if (ayah.data && ayah.data['text']) {
            ayahTxt.textContent = ayah.data['text']
        }
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });

