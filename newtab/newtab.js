document.addEventListener("DOMContentLoaded", () => {
  const IMAGES_COUNT = 18;
  const TOTAL_AYAHS = 6236;
  const QURAN_API = "https://api.alquran.cloud/v1/ayah";
  const PRAYERS = [
    ["Fajr", "الفجر"],
    ["Dhuhr", "الظهر"],
    ["Asr", "العصر"],
    ["Maghrib", "المغرب"],
    ["Isha", "العشاء"],
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    ayah: $("ayah"),
    surah: $("surah-name"),
    text: $("text"),
    tafseer: $("tafseer"),
    tafseerPanel: $("tafseer-panel"),
    tafseerToggle: $("toggle-tafseer"),
    play: $("play"),
    next: $("next"),
    previous: $("previous"),
    clock: $("clock"),
    date: $("date"),
    hijri: $("hijri"),
    dekr: $("random-dekr"),
    nextPrayer: $("next-prayer"),
    nextPrayerName: $("next-prayer-name"),
    countdown: $("countdown"),
    prayerList: $("prayer-list"),
    location: $("prayer-location"),
  };

  const audio = new Audio();
  audio.preload = "none";
  let currentAyah = null;
  let requestId = 0;
  let autoAdvance = false;

  const toArabicDigits = (n) => Number(n).toLocaleString("ar-EG", { useGrouping: false });

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
  }

  async function loadAyah(number, { play = false } = {}) {
    const id = ++requestId;
    const target = ((number - 1 + TOTAL_AYAHS) % TOTAL_AYAHS) + 1;
    els.ayah.setAttribute("aria-busy", "true");

    try {
      const { data } = await fetchJson(`${QURAN_API}/${target}/editions/ar.alafasy,ar.muyassar`);
      if (id !== requestId) return;
      const [recitation, tafseer] = data;
      renderAyah({
        number: target,
        surah: recitation.surah.name.replace(/^سُورَةُ\s*/, ""),
        numberInSurah: recitation.numberInSurah,
        text: recitation.text,
        audio: recitation.audio,
        tafseer: tafseer.text,
      });
      if (play) playAudio();
      else stopAudio();
    } catch (error) {
      console.error("Failed to load ayah:", error);
      if (id === requestId && currentAyah === null) renderAyah(AYAT_AL_KURSI);
    } finally {
      if (id === requestId) els.ayah.setAttribute("aria-busy", "false");
    }
  }

  function renderAyah(ayah) {
    currentAyah = ayah;
    els.surah.textContent = ayah.surah;
    els.text.textContent = ayah.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ\s+/, "");
    const marker = document.createElement("span");
    marker.className = "ayah-number";
    marker.textContent = `﴿${toArabicDigits(ayah.numberInSurah)}﴾`;
    els.text.append(" ", marker);
    els.text.classList.toggle("long", ayah.text.length > 420);
    els.tafseer.textContent = ayah.tafseer;
    audio.src = ayah.audio;
  }

  function playAudio() {
    if (!currentAyah) return;
    setPlayState("loading");
    audio.play().catch(() => setPlayState("paused"));
  }

  function stopAudio() {
    audio.pause();
    setPlayState("paused");
  }

  function togglePlay() {
    if (audio.paused) {
      autoAdvance = true;
      playAudio();
    } else {
      autoAdvance = false;
      stopAudio();
    }
  }

  function setPlayState(state) {
    els.play.classList.toggle("playing", state === "playing");
    els.play.classList.toggle("loading", state === "loading");
    els.play.setAttribute("aria-label", state === "paused" ? "تشغيل التلاوة" : "إيقاف التلاوة");
  }

  function step(direction) {
    if (!currentAyah) return;
    loadAyah(currentAyah.number + direction, { play: !audio.paused });
  }

  audio.addEventListener("playing", () => setPlayState("playing"));
  audio.addEventListener("waiting", () => setPlayState("loading"));
  audio.addEventListener("pause", () => setPlayState("paused"));
  audio.addEventListener("error", () => setPlayState("paused"));
  audio.addEventListener("ended", () => {
    if (autoAdvance) loadAyah(currentAyah.number + 1, { play: true });
  });

  function toggleTafseer() {
    const open = els.tafseerPanel.hidden;
    els.tafseerPanel.hidden = !open;
    els.tafseerToggle.setAttribute("aria-expanded", String(open));
  }

  function displayTime() {
    const now = new Date();
    els.clock.textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    els.clock.dateTime = now.toISOString();
    els.date.textContent = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    els.hijri.textContent = now.toLocaleDateString("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  async function displayRandomDekr() {
    try {
      const adkar = Object.values(await fetchJson("../data/adkar.json")).flat();
      const show = () => {
        const dekr = adkar[Math.floor(Math.random() * adkar.length)];
        els.dekr.classList.add("fading");
        setTimeout(() => {
          els.dekr.textContent = dekr.content;
          els.dekr.classList.remove("fading");
        }, els.dekr.textContent ? 250 : 0);
      };
      show();
      els.dekr.addEventListener("click", show);
    } catch (error) {
      console.error("Failed to load adkar:", error);
    }
  }

  function initBackgroundImage() {
    const photo = $("photo");
    const src = `images/${Math.floor(Math.random() * IMAGES_COUNT) + 1}.jpeg`;
    const image = new Image();
    image.onload = () => {
      photo.style.backgroundImage = `url(${src})`;
      requestAnimationFrame(() => photo.classList.add("ready"));
    };
    image.src = src;
  }

  const todayKey = () => new Date().toLocaleDateString("en-CA");

  function parseTime(value, dayOffset = 0) {
    const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function formatTime(value) {
    return parseTime(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  function getPosition() {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 6 * 60 * 60 * 1000, timeout: 15000 })
    );
  }

  async function loadPrayerTimes() {
    const { prayerTimes } = await chrome.storage.local.get("prayerTimes");
    if (prayerTimes?.date === todayKey()) return startPrayerTimes(prayerTimes);

    try {
      const { coords } = await getPosition();
      const { data } = await fetchJson(
        `https://api.aladhan.com/v1/timings?latitude=${coords.latitude}&longitude=${coords.longitude}`
      );
      const cached = { date: todayKey(), timings: data.timings, location: data.meta.timezone };
      await chrome.storage.local.set({ prayerTimes: cached });
      startPrayerTimes(cached);
    } catch (error) {
      console.error("Failed to load prayer times:", error);
      if (prayerTimes) return startPrayerTimes(prayerTimes);
      const denied = error?.code === 1;
      showPrayerStatus(
        denied ? "اسمح بالوصول إلى موقعك لعرض مواقيت الصلاة." : "تعذّر تحميل مواقيت الصلاة.",
        true
      );
    }
  }

  function showPrayerStatus(message, retry = false) {
    els.prayerList.replaceChildren();
    const item = document.createElement("li");
    item.className = "prayer-status";
    item.textContent = message;
    if (retry) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "إعادة المحاولة";
      button.addEventListener("click", () => {
        showPrayerStatus("جارٍ تحميل مواقيت الصلاة…");
        loadPrayerTimes();
      });
      item.append(button);
    }
    els.prayerList.append(item);
  }

  function getSchedule(timings) {
    const now = new Date();
    const times = PRAYERS.map(([key, label]) => ({ key, label, at: parseTime(timings[key]) }));
    const nextIndex = times.findIndex((prayer) => prayer.at > now);
    const next = nextIndex === -1 ? { ...times[0], at: parseTime(timings.Fajr, 1) } : times[nextIndex];
    return { times, next, nextIndex };
  }

  function startPrayerTimes({ timings, location }) {
    els.location.textContent = location.replace(/_/g, " ").split("/").pop();
    let renderedIndex = null;

    const tick = () => {
      if (renderedIndex !== null && todayKey() !== startPrayerTimes.day) {
        clearInterval(timer);
        return loadPrayerTimes();
      }
      const { times, next, nextIndex } = getSchedule(timings);
      if (nextIndex !== renderedIndex) {
        renderedIndex = nextIndex;
        renderPrayerList(times, nextIndex, timings);
      }
      const diff = Math.max(0, next.at - new Date());
      const pad = (n) => String(n).padStart(2, "0");
      els.nextPrayerName.textContent = next.label;
      els.countdown.textContent = `${pad(Math.floor(diff / 3.6e6))}:${pad(Math.floor((diff % 3.6e6) / 6e4))}:${pad(
        Math.floor((diff % 6e4) / 1000)
      )}`;
      els.nextPrayer.hidden = false;
    };

    startPrayerTimes.day = todayKey();
    clearInterval(startPrayerTimes.timer);
    const timer = setInterval(tick, 1000);
    startPrayerTimes.timer = timer;
    tick();
  }

  function renderPrayerList(times, nextIndex, timings) {
    els.prayerList.replaceChildren(
      ...times.map((prayer, index) => {
        const item = document.createElement("li");
        item.className = "prayer";
        if (index === nextIndex) {
          item.classList.add("next");
          item.setAttribute("aria-current", "time");
        } else if (nextIndex === -1 || index < nextIndex) {
          item.classList.add("passed");
        }
        const name = document.createElement("span");
        name.className = "name";
        name.textContent = prayer.label;
        const time = document.createElement("span");
        time.className = "time";
        time.dir = "ltr";
        time.textContent = formatTime(timings[prayer.key]);
        item.append(name, time);
        return item;
      })
    );
  }

  els.play.addEventListener("click", togglePlay);
  els.next.addEventListener("click", () => step(1));
  els.previous.addEventListener("click", () => step(-1));
  els.tafseerToggle.addEventListener("click", toggleTafseer);

  document.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, [contenteditable]") || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "ArrowRight") {
      step(1);
    } else if (event.key === "ArrowLeft") {
      step(-1);
    } else if (event.key.toLowerCase() === "t") {
      toggleTafseer();
    }
  });

  const AYAT_AL_KURSI = {
    number: 262,
    surah: "البقرة",
    numberInSurah: 255,
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3",
    text: "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
    tafseer:
      "الله الذي لا يستحق الألوهية والعبودية إلا هو، الحيُّ الذي له جميع معاني الحياة الكاملة كما يليق بجلاله، القائم على كل شيء، لا تأخذه سِنَة أي: نعاس، ولا نوم، كل ما في السماوات وما في الأرض ملك له، ولا يتجاسر أحد أن يشفع عنده إلا بإذنه، محيط علمه بجميع الكائنات ماضيها وحاضرها ومستقبلها، يعلم ما بين أَيْدِي الخلائق من الأمور المستقبلة، وما خلفهم من الأمور الماضية، ولا يَطَّلعُ أحد من الخلق على شيء من علمه إلا بما أعلمه الله وأطلعه عليه. وسع كرسيه السماوات والأرض، ولا يثقله سبحانه حفظهما، وهو العلي بذاته وصفاته على جميع مخلوقاته، الجامع لجميع صفات العظمة والكبرياء. وهذه الآية أعظم آية في القرآن، وتسمى: (آية الكرسي).",
  };

  initBackgroundImage();
  displayTime();
  setInterval(displayTime, 1000);
  loadAyah(Math.floor(Math.random() * TOTAL_AYAHS) + 1);
  displayRandomDekr();
  loadPrayerTimes();
});
