const languageSelect = document.getElementById("language-select");
const translationSelect = document.getElementById("translation-select");
const applyButton = document.getElementById("apply");
const contentDiv = document.getElementById("content");
const selectedTranslations = new Map(); // Track selected translations per language
const settingsIcon = document.getElementById("settings-icon");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");

// Toggle the settings panel visibility
settingsIcon.addEventListener("click", () => {
  settingsPanel.classList.toggle("open");
  contentDiv.style.marginRight = settingsPanel.classList.contains("open") ? "100%" : "0";
});

// Close settings panel
closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("open");
  contentDiv.style.marginRight = "0";
});

async function fetchLanguages() {
  try {
    const res = await fetch("https://api.alquran.cloud/v1/edition/language");
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      populateLanguageDropdown(data.data);
    } else {
      console.error("No languages found.");
    }
  } catch (error) {
    console.error("Error fetching languages:", error);
  }
}

function populateLanguageDropdown(languages) {
  languages.forEach(lang => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = lang.toUpperCase();
    languageSelect.appendChild(option);
  });

  // Set default selection for English (en) and Urdu (ur)
  languageSelect.querySelectorAll('option').forEach(option => {
    if (option.value === 'en' || option.value === 'ur') {
      option.selected = true;
    }
  });

  // Trigger change event to populate translation dropdown
  languageSelect.dispatchEvent(new Event('change'));
}

languageSelect.addEventListener("change", async () => {
  const selectedLanguages = Array.from(languageSelect.selectedOptions).map(opt => opt.value);
  translationSelect.disabled = selectedLanguages.length === 0;
  translationSelect.innerHTML = ''; // Clear existing options

  for (const language of selectedLanguages) {
    await fetchTranslations(language);
  }

  // Enable Apply button if translations are available
  applyButton.disabled = translationSelect.options.length === 0;

  // Set default translation for Urdu and English
  if (selectedLanguages.includes('ur')) {
    const urduDefaultTranslation = document.createElement("option");
    urduDefaultTranslation.value = JSON.stringify({
      language: 'ur',
      identifier: 'ur.kanzuliman'
    });
    urduDefaultTranslation.textContent = "Ahmed Raza Khan (احمد رضا خان) - [Urdu]";
    translationSelect.appendChild(urduDefaultTranslation);
    urduDefaultTranslation.selected = true;
  }

  if (selectedLanguages.includes('en')) {
    const englishDefaultTranslation = document.createElement("option");
    englishDefaultTranslation.value = JSON.stringify({
      language: 'en',
      identifier: 'en.ahmedraza'
    });
    englishDefaultTranslation.textContent = "Ahmed Raza Khan (Ahmed Raza Khan) - [English]";
    translationSelect.appendChild(englishDefaultTranslation);
    englishDefaultTranslation.selected = true;
  }

  // Trigger the Apply button click programmatically after loading languages
  applyButton.click();
});

async function fetchTranslations(language) {
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/edition/language/${language}`);
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      data.data.forEach(translation => {
        const option = document.createElement("option");
        option.value = JSON.stringify({ language, identifier: translation.identifier });
        option.textContent = `${translation.englishName} (${translation.name}) - [${language}]`;
        translationSelect.appendChild(option);
      });
    } else {
      console.error(`No translations found for ${language}`);
    }
  } catch (error) {
    console.error(`Error fetching translations for language ${language}:`, error);
  }
}

applyButton.addEventListener("click", () => {
  selectedTranslations.clear();
  Array.from(translationSelect.selectedOptions).forEach(option => {
    const { language, identifier } = JSON.parse(option.value);
    selectedTranslations.set(language, identifier);
  });

  // Store selections locally on the browser/device
  localStorage.setItem('selectedTranslations', JSON.stringify(Array.from(selectedTranslations.entries())));

  fetchVerses();
});

async function fetchVerses() {
  contentDiv.innerHTML = ''; // Clear existing verses

  // Example: Load Surah 1 (Al-Fatiha) with 7 verses
  const surahNumber = 1; // Change this to dynamically select surah
  const surahRes = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`);
  const surahData = await surahRes.json();

  const verseCount = surahData.data.ayahs.length;

  // Loop through all verses in the selected Surah
  for (let verseNumber = 1; verseNumber <= verseCount; verseNumber++) {
    const verseContainer = document.createElement("div");
    verseContainer.className = "ayah-container";

    const verseRes = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/ar`);
    const verseData = await verseRes.json();
    const verseText = verseData.data.text;

    verseContainer.innerHTML = `<div class="text">${verseText}</div>`;

    // Fetch translations for this specific verse
    for (const [language, identifier] of selectedTranslations.entries()) {
      const translationRes = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/${identifier}`);
      const translationData = await translationRes.json();
      const translationText = translationData.data.text;

      const languageCode = language.slice(0, 2).toUpperCase();

      const translationDiv = document.createElement("div");
      translationDiv.className = "language";
      translationDiv.innerHTML = `
        <div class="language">${languageCode}</div>
        <div class="text">${translationText}</div>
      `;

      verseContainer.appendChild(translationDiv);
    }

    contentDiv.appendChild(verseContainer);
  }
}

// Initialize the language fetch process
fetchLanguages();

// Retrieve previously selected translations from localStorage (if any)
const savedTranslations = JSON.parse(localStorage.getItem('selectedTranslations'));
if (savedTranslations && savedTranslations.length > 0) {
  savedTranslations.forEach(([language, identifier]) => {
    selectedTranslations.set(language, identifier);
  });
  applyButton.click(); // Trigger to apply saved translations
}
