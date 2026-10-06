document.addEventListener("DOMContentLoaded", () => {
  const TOTAL_AYAHS = 6236;
  const LOCAL_IMAGES = 18;
  const QURAN_API = "https://api.alquran.cloud/v1/ayah";
  const AUDIO_CDN = "https://everyayah.com/data";
  const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
  const PHOTO_CATEGORIES = [
    "Featured_pictures_of_mountains",
    "Featured_pictures_of_forests",
    "Featured_pictures_of_waterfalls",
    "Featured_pictures_of_lakes",
  ];
  const PHOTO_BLOCKLIST = /church|chapel|cathedral|temple|monaster|abbey|statue|shrine|pagoda|buddha|cross|castle|city|town|village|bridge|people|portrait/i;
  const PHOTO_POOL_TTL = 7 * 24 * 60 * 60 * 1000;

  const RECITERS = [
    { id: "Minshawy_Murattal_128kbps", name: "محمد صديق المنشاوي", group: "murattal" },
    { id: "Alafasy_128kbps", name: "مشاري العفاسي", group: "murattal" },
    { id: "Abdul_Basit_Murattal_192kbps", name: "عبد الباسط عبد الصمد", group: "murattal" },
    { id: "Husary_128kbps", name: "محمود خليل الحصري", group: "murattal" },
    { id: "Yasser_Ad-Dussary_128kbps", name: "ياسر الدوسري", group: "murattal" },
    { id: "MaherAlMuaiqly128kbps", name: "ماهر المعيقلي", group: "murattal" },
    { id: "Abdurrahmaan_As-Sudais_192kbps", name: "عبد الرحمن السديس", group: "murattal" },
    { id: "Saood_ash-Shuraym_128kbps", name: "سعود الشريم", group: "murattal" },
    { id: "Ghamadi_40kbps", name: "سعد الغامدي", group: "murattal" },
    { id: "ahmed_ibn_ali_al_ajamy_128kbps", name: "أحمد العجمي", group: "murattal" },
    { id: "Nasser_Alqatami_128kbps", name: "ناصر القطامي", group: "murattal" },
    { id: "Fares_Abbad_64kbps", name: "فارس عباد", group: "murattal" },
    { id: "Abdul_Basit_Mujawwad_128kbps", name: "عبد الباسط عبد الصمد", group: "mujawwad" },
    { id: "Husary_128kbps_Mujawwad", name: "محمود خليل الحصري", group: "mujawwad" },
    { id: "Minshawy_Mujawwad_192kbps", name: "محمد صديق المنشاوي", group: "mujawwad" },
    { id: "Mohammad_al_Tablaway_128kbps", name: "محمد محمود الطبلاوي", group: "mujawwad" },
    { id: "Mustafa_Ismail_48kbps", name: "مصطفى إسماعيل (مختارات)", group: "mujawwad" },
    { id: "mahmoud_ali_al_banna_32kbps", name: "محمود علي البنا", group: "mujawwad" },
    { id: "Husary_Muallim_128kbps", name: "الحصري (المصحف المعلّم)", group: "muallim" },
    { id: "warsh/warsh_ibrahim_aldosary_128kbps", name: "إبراهيم الدوسري", group: "warsh" },
    { id: "warsh/warsh_yassin_al_jazaery_64kbps", name: "ياسين الجزائري", group: "warsh" },
    { id: "warsh/warsh_Abdul_Basit_128kbps", name: "عبد الباسط عبد الصمد", group: "warsh" },
  ];

  const RECITER_GROUPS = {
    murattal: "مرتّل",
    mujawwad: "مجوّد",
    muallim: "تعليمي",
    warsh: "رواية ورش عن نافع",
  };

  const PRAYERS = [
    ["Fajr", "الفجر"],
    ["Dhuhr", "الظهر"],
    ["Asr", "العصر"],
    ["Maghrib", "المغرب"],
    ["Isha", "العشاء"],
  ];

  const DEFAULT_SETTINGS = {
    reciter: "Minshawy_Murattal_128kbps",
    photoInterval: 5,
    photoMotion: true,
    showTafseer: false,
    showPrayers: true,
    showDekr: true,
    clock12: false,
    method: "auto",
    continueReading: false,
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    ayah: $("ayah"),
    surah: $("surah-name"),
    text: $("text"),
    tafseer: $("tafseer"),
    tafseerPanel: $("tafseer-panel"),
    tafseerToggle: $("toggle-tafseer"),
    tafseerBody: $("tafseer-body"),
    tafseerRef: $("tafseer-ref"),
    closeTafseer: $("close-tafseer"),
    play: $("play"),
    next: $("next"),
    previous: $("previous"),
    reciterSelect: $("reciter-select"),
    clock: $("clock"),
    date: $("date"),
    hijri: $("hijri"),
    dekr: $("random-dekr"),
    prayers: $("prayers"),
    nextPrayer: $("next-prayer"),
    nextPrayerName: $("next-prayer-name"),
    countdown: $("countdown"),
    prayerList: $("prayer-list"),
    location: $("prayer-location"),
    photos: [$("photo-a"), $("photo-b")],
    credit: $("photo-credit"),
    nextPhoto: $("next-photo"),
    settings: $("settings"),
    openSettings: $("open-settings"),
    copy: $("copy-ayah"),
    toast: $("toast"),
  };

  let settings = { ...DEFAULT_SETTINGS };
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let currentAyah = null;
  let requestId = 0;
  let autoAdvance = false;
  const ayahCache = new Map();
  const audio = new Audio();
  const preloader = new Audio();
  preloader.preload = "auto";
  preloader.muted = true;

  const toArabicDigits = (n) => Number(n).toLocaleString("ar-EG", { useGrouping: false });
  const wrapAyah = (n) => ((n - 1 + TOTAL_AYAHS) % TOTAL_AYAHS) + 1;
  const reciter = () =>
    RECITERS.find((r) => r.id === settings.reciter) ?? RECITERS.find((r) => r.id === DEFAULT_SETTINGS.reciter);
  const pad3 = (n) => String(n).padStart(3, "0");
  const audioUrl = (ayah, r = reciter()) => `${AUDIO_CDN}/${r.id}/${pad3(ayah.surahNumber)}${pad3(ayah.numberInSurah)}.mp3`;

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    return response.json();
  }

  function fetchAyah(number) {
    if (!ayahCache.has(number)) {
      const request = fetchJson(`${QURAN_API}/${number}/editions/quran-uthmani,ar.muyassar`).then(({ data }) => {
        const [text, tafseer] = data;
        return {
          number,
          surah: text.surah.name.replace(/^سُورَةُ\s*/, ""),
          surahNumber: text.surah.number,
          numberInSurah: text.numberInSurah,
          text: text.text,
          tafseer: tafseer.text,
        };
      });
      request.catch(() => ayahCache.delete(number));
      ayahCache.set(number, request);
    }
    return ayahCache.get(number);
  }

  function prefetchAround(number) {
    fetchAyah(wrapAyah(number + 1))
      .then((next) => (preloader.src = audioUrl(next)))
      .catch(() => {});
    fetchAyah(wrapAyah(number - 1)).catch(() => {});
  }

  async function loadAyah(number, { play = false } = {}) {
    const id = ++requestId;
    const target = wrapAyah(number);
    els.ayah.setAttribute("aria-busy", "true");

    try {
      const ayah = await fetchAyah(target);
      if (id !== requestId) return;
      renderAyah(ayah);
      chrome.storage.local.set({ lastAyah: target });
      if (play) playAudio();
      else stopAudio();
      prefetchAround(target);
    } catch (error) {
      console.error("Failed to load ayah:", error);
      if (id === requestId && currentAyah === null) renderAyah(AYAT_AL_KURSI);
    } finally {
      if (id === requestId) els.ayah.setAttribute("aria-busy", "false");
    }
  }

  function renderAyah(ayah) {
    const first = currentAyah === null;
    currentAyah = ayah;
    els.ayah.classList.remove("initial");
    if (!first && !reducedMotion.matches) {
      els.ayah.classList.remove("entering");
      void els.ayah.offsetWidth;
      els.ayah.classList.add("entering");
    }
    els.surah.textContent = `سورة ${ayah.surah}`;
    els.text.textContent = ayah.text;
    const marker = document.createElement("span");
    marker.className = "ayah-number";
    marker.textContent = toArabicDigits(ayah.numberInSurah);
    marker.setAttribute("aria-label", `الآية ${toArabicDigits(ayah.numberInSurah)}`);
    els.text.append(" ", marker);
    els.text.classList.toggle("long", ayah.text.length > 420);
    els.tafseer.textContent = ayah.tafseer;
    els.tafseerRef.textContent = `${ayah.surah} · ${toArabicDigits(ayah.numberInSurah)}`;
    els.tafseerBody.scrollTop = 0;
    updateTafseerFade();
    els.play.style.setProperty("--progress", "0");
    audio.src = audioUrl(ayah);
  }

  function playAudio() {
    if (!currentAyah) return;
    const fallback = RECITERS.find((r) => r.id === DEFAULT_SETTINGS.reciter);
    if (reciter() !== fallback && audio.src === audioUrl(currentAyah, fallback)) {
      showToast(`هذه الآية غير متوفرة بصوت ${reciter().name}، فتُتلى بصوت ${fallback.name}`);
    }
    setPlayState("loading");
    audio.play().catch(() => setPlayState("paused"));
  }

  function stopAudio() {
    audio.pause();
    setPlayState("paused");
  }

  function togglePlay() {
    autoAdvance = audio.paused;
    if (audio.paused) playAudio();
    else stopAudio();
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

  function switchReciter(id) {
    const wasPlaying = !audio.paused;
    saveSettings({ reciter: id });
    if (!currentAyah) return;
    audio.src = audioUrl(currentAyah);
    prefetchAround(currentAyah.number);
    if (wasPlaying) playAudio();
  }

  audio.addEventListener("playing", () => setPlayState("playing"));
  audio.addEventListener("timeupdate", () => {
    if (audio.duration) els.play.style.setProperty("--progress", (audio.currentTime / audio.duration).toFixed(4));
  });
  audio.addEventListener("waiting", () => setPlayState("loading"));
  audio.addEventListener("pause", () => setPlayState("paused"));
  audio.addEventListener("error", () => {
    const fallback = RECITERS.find((r) => r.id === DEFAULT_SETTINGS.reciter);
    const fallbackSrc = currentAyah && audioUrl(currentAyah, fallback);
    if (!fallbackSrc || audio.src === fallbackSrc) return setPlayState("paused");
    const wasRequested = els.play.classList.contains("loading") || autoAdvance;
    audio.src = fallbackSrc;
    if (wasRequested) playAudio();
  });
  audio.addEventListener("ended", () => {
    if (photoDue) changePhoto();
    if (autoAdvance) loadAyah(currentAyah.number + 1, { play: true });
  });

  let toastTimer;

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    toastTimer = setTimeout(() => els.toast.classList.remove("visible"), message.length > 30 ? 3500 : 1800);
  }

  async function copyAyah() {
    if (!currentAyah) return;
    try {
      await navigator.clipboard.writeText(
        `${currentAyah.text} ﴿${toArabicDigits(currentAyah.numberInSurah)}﴾\n[سورة ${currentAyah.surah}]`
      );
      showToast("نُسخت الآية");
    } catch {
      showToast("تعذّر النسخ");
    }
  }

  function setTafseer(open) {
    els.tafseerPanel.hidden = !open;
    els.tafseerToggle.setAttribute("aria-expanded", String(open));
    els.ayah.classList.toggle("with-tafseer", open);
    if (!open) return;
    els.tafseerBody.scrollTop = 0;
    requestAnimationFrame(() => {
      els.tafseerBody.scrollTop = 0;
      updateTafseerFade();
    });
  }

  function updateTafseerFade() {
    const { scrollTop, scrollHeight, clientHeight } = els.tafseerBody;
    els.tafseerBody.classList.toggle("fade-end", scrollTop + clientHeight < scrollHeight - 4);
    els.tafseerBody.classList.toggle("fade-start", scrollTop > 4);
  }

  function displayTime() {
    const now = new Date();
    els.clock.textContent = now.toLocaleTimeString(settings.clock12 ? "en-US" : "en-GB", {
      hour: settings.clock12 ? "numeric" : "2-digit",
      minute: "2-digit",
    });
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

  let activePhoto = 0;

  const tinyPhoto = (src) => (/\/\d+px-/.test(src) ? src.replace(/\/\d+px-/, "/64px-") : null);

  function showPhoto(photo) {
    const next = els.photos[1 - activePhoto];
    const tiny = tinyPhoto(photo.src);
    if (tiny && !document.body.classList.contains("photo-loaded")) {
      const preview = new Image();
      preview.onload = () => {
        if (document.body.classList.contains("photo-loaded")) return;
        $("photo-preview").style.backgroundImage = `url("${tiny}")`;
        $("photo-preview").classList.add("ready");
      };
      preview.src = tiny;
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        document.body.classList.add("photo-loaded");
        next.style.backgroundImage = `url("${photo.src}")`;
        next.style.setProperty("--drift-x", `${((Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 3)).toFixed(2)}%`);
        next.style.setProperty("--drift-y", `${((Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 2)).toFixed(2)}%`);
        next.style.animationDelay = `-${(4 + Math.random() * 10).toFixed(1)}s`;
        next.style.animationName = "none";
        void next.offsetWidth;
        next.style.animationName = "";
        requestAnimationFrame(() => {
          next.classList.add("ready");
          els.photos[activePhoto].classList.remove("ready");
          activePhoto = 1 - activePhoto;
        });
        els.credit.hidden = !photo.page;
        if (photo.page) {
          els.credit.href = photo.page;
          els.credit.textContent = "الصورة من ويكيميديا كومنز";
          els.credit.title = photo.title;
        }
        resolve();
      };
      image.onerror = reject;
      image.src = photo.src;
    });
  }

  const localPhoto = () => ({ src: `images/${Math.floor(Math.random() * LOCAL_IMAGES) + 1}.jpeg` });

  async function getPhotoPool() {
    const { photoPool } = await chrome.storage.local.get("photoPool");
    if (photoPool && Date.now() - photoPool.fetchedAt < PHOTO_POOL_TTL) return photoPool.photos;

    const lists = await Promise.all(
      PHOTO_CATEGORIES.map((category) =>
        fetchJson(
          `${COMMONS_API}?action=query&generator=categorymembers&gcmtitle=Category:${category}&gcmtype=file&gcmlimit=500&prop=imageinfo&iiprop=url|size&iiurlwidth=2560&format=json&origin=*`
        )
          .then((json) => Object.values(json.query?.pages ?? {}))
          .catch(() => [])
      )
    );
    const photos = lists
      .flat()
      .filter((page) => {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl || PHOTO_BLOCKLIST.test(page.title)) return false;
        const ratio = info.width / info.height;
        return info.width >= 2400 && ratio >= 1.3 && ratio <= 2.1;
      })
      .map((page) => ({
        src: page.imageinfo[0].thumburl,
        page: page.imageinfo[0].descriptionurl,
        title: page.title.replace(/^File:/, "").replace(/\.\w+$/, ""),
      }));

    if (photos.length) await chrome.storage.local.set({ photoPool: { fetchedAt: Date.now(), photos } });
    return photos;
  }

  async function queueNextPhoto() {
    try {
      const pool = await getPhotoPool();
      if (!pool.length) return;
      const photo = pool[Math.floor(Math.random() * pool.length)];
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = photo.src;
      });
      await chrome.storage.local.set({ nextPhoto: photo });
    } catch (error) {
      console.error("Failed to queue photo:", error);
    }
  }

  let photoTimer;
  let photoDue = false;

  function schedulePhotoRotation() {
    clearInterval(photoTimer);
    photoDue = false;
    if (!settings.photoInterval) return;
    photoTimer = setInterval(() => {
      if (document.hidden || els.settings.open) return;
      if (audio.paused) changePhoto();
      else photoDue = true;
    }, settings.photoInterval * 60 * 1000);
  }

  async function changePhoto() {
    photoDue = false;
    els.nextPhoto.disabled = true;
    const { nextPhoto } = await chrome.storage.local.get("nextPhoto");
    await chrome.storage.local.remove("nextPhoto");
    await showPhoto(nextPhoto ?? localPhoto()).catch(() => showPhoto(localPhoto()));
    els.nextPhoto.disabled = false;
    queueNextPhoto();
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
    return parseTime(value).toLocaleTimeString(settings.clock12 ? "en-US" : "en-GB", {
      hour: settings.clock12 ? "numeric" : "2-digit",
      minute: "2-digit",
    });
  }

  function getPosition() {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 6 * 60 * 60 * 1000, timeout: 15000 })
    );
  }

  let prayerTimer;
  let prayerData = null;

  async function loadPrayerTimes() {
    const { prayerTimes } = await chrome.storage.local.get("prayerTimes");
    if (prayerTimes?.date === todayKey() && prayerTimes.method === settings.method) return startPrayerTimes(prayerTimes);

    try {
      const { coords } = await getPosition();
      const method = settings.method === "auto" ? "" : `&method=${settings.method}`;
      const { data } = await fetchJson(
        `https://api.aladhan.com/v1/timings?latitude=${coords.latitude}&longitude=${coords.longitude}${method}`
      );
      const cached = { date: todayKey(), method: settings.method, timings: data.timings, location: data.meta.timezone };
      await chrome.storage.local.set({ prayerTimes: cached });
      startPrayerTimes(cached);
    } catch (error) {
      console.error("Failed to load prayer times:", error);
      if (prayerTimes) return startPrayerTimes(prayerTimes);
      showPrayerStatus(
        error?.code === 1 ? "اسمح بالوصول إلى موقعك لعرض مواقيت الصلاة." : "تعذّر تحميل مواقيت الصلاة.",
        true
      );
    }
  }

  function showPrayerStatus(message, retry = false) {
    els.nextPrayer.hidden = true;
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
    els.prayerList.replaceChildren(item);
  }

  function getSchedule(timings) {
    const now = new Date();
    const times = PRAYERS.map(([key, label]) => ({ key, label, at: parseTime(timings[key]) }));
    const nextIndex = times.findIndex((prayer) => prayer.at > now);
    const next = nextIndex === -1 ? { ...times[0], at: parseTime(timings.Fajr, 1) } : times[nextIndex];
    return { times, next, nextIndex };
  }

  function startPrayerTimes(data) {
    prayerData = data;
    const day = todayKey();
    let renderedIndex = null;
    els.location.textContent = data.location.replace(/_/g, " ").split("/").pop();

    const tick = () => {
      if (todayKey() !== day) {
        clearInterval(prayerTimer);
        return loadPrayerTimes();
      }
      const { times, next, nextIndex } = getSchedule(data.timings);
      if (nextIndex !== renderedIndex) {
        renderedIndex = nextIndex;
        renderPrayerList(times, nextIndex, data.timings);
      }
      const diff = Math.max(0, next.at - new Date());
      const pad = (n) => String(n).padStart(2, "0");
      els.nextPrayerName.textContent = next.label;
      els.countdown.textContent = `${pad(Math.floor(diff / 3.6e6))}:${pad(Math.floor((diff % 3.6e6) / 6e4))}:${pad(
        Math.floor((diff % 6e4) / 1000)
      )}`;
      els.nextPrayer.hidden = false;
    };

    clearInterval(prayerTimer);
    prayerTimer = setInterval(tick, 1000);
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

  function renderReciterSelect() {
    els.reciterSelect.replaceChildren(
      ...Object.entries(RECITER_GROUPS).map(([key, label]) => {
        const group = document.createElement("optgroup");
        group.label = label;
        group.append(...RECITERS.filter((r) => r.group === key).map((r) => new Option(r.name, r.id)));
        return group;
      })
    );
  }

  function applySettings(previous = {}) {
    els.reciterSelect.value = reciter().id;
    els.settings.querySelectorAll("[data-setting]").forEach((input) => {
      const value = settings[input.dataset.setting];
      if (input.type === "checkbox") input.checked = value;
      else input.value = value;
    });
    if (previous.photoInterval !== settings.photoInterval) schedulePhotoRotation();
    document.body.classList.toggle("photo-motion", settings.photoMotion);
    els.prayers.hidden = !settings.showPrayers;
    els.dekr.hidden = !settings.showDekr;
    displayTime();

    if (previous.showTafseer !== settings.showTafseer) setTafseer(settings.showTafseer);
    if (previous.method && previous.method !== settings.method) {
      showPrayerStatus("جارٍ تحميل مواقيت الصلاة…");
      loadPrayerTimes();
    } else if (previous.clock12 !== undefined && previous.clock12 !== settings.clock12 && prayerData) {
      startPrayerTimes(prayerData);
    }
  }

  function saveSettings(patch) {
    const previous = settings;
    settings = { ...settings, ...patch };
    chrome.storage.sync.set({ newtab: settings });
    applySettings(previous);
  }

  els.play.addEventListener("click", togglePlay);
  els.next.addEventListener("click", () => step(1));
  els.previous.addEventListener("click", () => step(-1));
  els.tafseerToggle.addEventListener("click", () => setTafseer(els.tafseerPanel.hidden));
  els.closeTafseer.addEventListener("click", () => {
    setTafseer(false);
    els.tafseerToggle.focus();
  });
  els.tafseerBody.addEventListener("scroll", updateTafseerFade, { passive: true });
  window.addEventListener("resize", updateTafseerFade);
  els.nextPhoto.addEventListener("click", () => {
    changePhoto();
    schedulePhotoRotation();
  });
  els.copy.addEventListener("click", copyAyah);
  els.openSettings.addEventListener("click", () => els.settings.showModal());
  els.reciterSelect.addEventListener("change", () => {
    switchReciter(els.reciterSelect.value);
    els.reciterSelect.blur();
  });
  els.settings.addEventListener("change", (event) => {
    const input = event.target.closest("[data-setting]");
    if (!input) return;
    const value = input.type === "checkbox" ? input.checked : input.dataset.type === "number" ? Number(input.value) : input.value;
    saveSettings({ [input.dataset.setting]: value });
  });
  els.settings.addEventListener("click", (event) => {
    if (event.target === els.settings) els.settings.close();
  });

  document.addEventListener("keydown", (event) => {
    if (els.settings.open || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target.closest("input, textarea, [contenteditable]")) return;
    if (event.target.closest("select") && event.code !== "Space" && !/^[a-z]$/i.test(event.key)) return;
    const key = event.key.toLowerCase();
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "ArrowLeft") {
      step(1);
    } else if (event.key === "ArrowRight") {
      step(-1);
    } else if (key === "t" || key === "ف") {
      setTafseer(els.tafseerPanel.hidden);
    } else if (key === "c" || key === "ؤ") {
      copyAyah();
    } else if (key === "b" || key === "لا") {
      changePhoto();
    } else if (key === "s" || key === "س") {
      els.settings.showModal();
    }
  });

  const AYAT_AL_KURSI = {
    number: 262,
    surah: "البقرة",
    surahNumber: 2,
    numberInSurah: 255,
    text: "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
    tafseer:
      "الله الذي لا يستحق الألوهية والعبودية إلا هو، الحيُّ الذي له جميع معاني الحياة الكاملة كما يليق بجلاله، القائم على كل شيء، لا تأخذه سِنَة أي: نعاس، ولا نوم، كل ما في السماوات وما في الأرض ملك له، ولا يتجاسر أحد أن يشفع عنده إلا بإذنه، محيط علمه بجميع الكائنات ماضيها وحاضرها ومستقبلها، يعلم ما بين أَيْدِي الخلائق من الأمور المستقبلة، وما خلفهم من الأمور الماضية، ولا يَطَّلعُ أحد من الخلق على شيء من علمه إلا بما أعلمه الله وأطلعه عليه. وسع كرسيه السماوات والأرض، ولا يثقله سبحانه حفظهما، وهو العلي بذاته وصفاته على جميع مخلوقاته، الجامع لجميع صفات العظمة والكبرياء. وهذه الآية أعظم آية في القرآن، وتسمى: (آية الكرسي).",
  };

  async function init() {
    const stored = await chrome.storage.sync.get("newtab");
    settings = { ...DEFAULT_SETTINGS, ...stored.newtab };
    renderReciterSelect();
    applySettings({});

    changePhoto();
    schedulePhotoRotation();
    setInterval(displayTime, 1000);
    const { lastAyah } = await chrome.storage.local.get("lastAyah");
    loadAyah(settings.continueReading && lastAyah ? lastAyah : Math.floor(Math.random() * TOTAL_AYAHS) + 1);
    displayRandomDekr();
    loadPrayerTimes();
  }

  init();
});
