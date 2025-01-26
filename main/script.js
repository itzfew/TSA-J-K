// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkw9Vh_fxRrVf2l1qErXexBZVdDuoYEyk",
  authDomain: "waheedchalla.firebaseapp.com",
  databaseURL: "https://waheedchalla-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "waheedchalla",
  storageBucket: "waheedchalla.appspot.com",
  messagingSenderId: "460397540007",
  appId: "1:460397540007:web:d39c857878aad2bae7e182",
  measurementId: "G-5P3W3EEF1C"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Save visit details (date, time, location, device, browser)
async function saveVisitDetails() {
  const visit = {
    time: new Date().toISOString() // Save the current timestamp
  };

  // Fetch user's location
  try {
    const response = await fetch("https://ipapi.co/json/");
    const location = await response.json();

    // Ensure the location data is valid
    if (location && location.city && location.region && location.country_name) {
      visit.location = {
        country: location.country_name,
        state: location.region,
        city: location.city,
        ip: location.ip
      };
    } else {
      visit.location = "Unable to fetch valid location";
    }
  } catch (error) {
    console.error("Error fetching location:", error);
    visit.location = "Unable to fetch location";
  }

  // Get device and browser information from the user agent
  const userAgent = navigator.userAgent;

  // Device detection (Mobile or Desktop)
  let device = "Desktop";
  let deviceType = "Desktop";

  const mobileDevices = [
    /iPhone/i,            // iPhone
    /iPad/i,              // iPad
    /iPod/i,              // iPod
    /Samsung Galaxy/i,     // Samsung Galaxy
    /Pixel/i,             // Google Pixel
    /OnePlus/i,           // OnePlus
    /Redmi/i,             // Xiaomi
    /Huawei/i,            // Huawei
    /Oppo/i,              // Oppo
    /Realme/i,            // Realme
    /Vivo/i,              // Vivo
    /Moto/i               // Motorola
  ];

  // Check for Mobile device
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(userAgent)) {
    device = "Mobile";
    deviceType = mobileDevices.find(device => device.test(userAgent)) || "Other Mobile";
  }

  // Browser detection
  const browsers = {
    Chrome: /Chrome/i,
    Firefox: /Firefox/i,
    Safari: /Safari/i,
    Edge: /Edg/i,
    Opera: /Opera|OPR/i,
    IE: /MSIE|Trident/i,
    Brave: /Brave/i,
    Vivaldi: /Vivaldi/i,
    SamsungBrowser: /SamsungBrowser/i,
    UCBrowser: /UCBrowser/i,
    Yandex: /YaBrowser/i,
    DuckDuckGo: /DuckDuckGo/i,
    Chromium: /Chromium/i
  };

  let browserType = "Other";

  // Detect browser
  for (const [key, regex] of Object.entries(browsers)) {
    if (regex.test(userAgent)) {
      browserType = key;
      break;
    }
  }

  console.log("Device:", deviceType);  // Log detected device type (Mobile/Desktop)
  console.log("Browser:", browserType); // Log detected browser type

  // Save the visit data to Firebase with the detailed device and browser info
  const visitKey = `${visit.location.city}_${visit.location.state}_${visit.location.country}_${deviceType}_${browserType}`;
  
  const locationRef = database.ref("locations/" + `${visit.location.city}_${visit.location.state}_${visit.location.country}`);

  // Check if the combination of location, device, and browser exists
  locationRef.child(visitKey).once('value').then((snapshot) => {
    if (!snapshot.exists()) {
      locationRef.child(visitKey).set({
        visits: 1,
        device: deviceType,
        browser: browserType,
        ...visit.location
      }).then(() => {
        console.log("Visit data saved/updated.");
      }).catch((error) => {
        console.error("Error saving visit to Firebase:", error);
      });
    } else {
      // Increment visit count
      locationRef.child(visitKey).transaction((currentData) => {
        if (currentData === null) {
          return { visits: 1 };
        } else {
          currentData.visits += 1;
          return currentData;
        }
      }).then(() => {
        console.log("Visit count incremented.");
      }).catch((error) => {
        console.error("Error incrementing visit count:", error);
      });
    }
  });
}

// Update and display the view count
function updateViewCount() {
  const viewCountRef = database.ref("viewCount");
  viewCountRef.transaction((currentCount) => (currentCount || 0) + 1); // Increment view count
  viewCountRef.on("value", (snapshot) => {
    document.getElementById("viewCount").textContent = snapshot.val(); // Display updated count
  });
}

// Display all visit details (location, device, browser, and visit count) for the user
function displayVisitDetails() {
  const visitDetailsRef = database.ref("locations");
  const userVisitKey = localStorage.getItem("userVisitKey");

  visitDetailsRef.on("child_added", (snapshot) => {
    const visitData = snapshot.val();

    if (visitData) {
      Object.keys(visitData).forEach((visitKey) => {
        if (visitKey === userVisitKey) {
          const visitInfo = visitData[visitKey];
          const visitItem = document.createElement("li");

          const { city, state, country, visits } = visitInfo;
          const device = visitKey.split('_')[3];
          const browser = visitKey.split('_')[4];

          const locationText = `${city}, ${state}, ${country}`;
          const visitText = `Visits: ${visits || "No visits"}`;

          visitItem.textContent = `Location: ${locationText} - ${visitText} - Device: ${device} - Browser: ${browser}`;
          document.getElementById("visitDetails").appendChild(visitItem);
        }
      });
    }
  });
}

// Initialize functions
saveVisitDetails(); // Save current visit
updateViewCount();  // Update and display view count
displayVisitDetails(); // Display visit details only for the current user


    
// Function to get current date in DD-MM-YYYY format
        const getCurrentDate = () => {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth is zero-indexed
            const year = now.getFullYear();
            return `${day}-${month}-${year}`;
        };

        const dateTimeElement = document.getElementById("date-time");

        const updateDateTime = async () => {
            const currentDate = getCurrentDate(); // Get current date

            // API for Hijri and Gregorian Calendar Data for the current date
            const hijriApiUrl = `https://api.aladhan.com/v1/gToH/${currentDate}?calendarMethod=UAQ`;

            try {
                const response = await fetch(hijriApiUrl);
                const data = await response.json();

                if (data.code === 200) {
                    const hijriData = data.data;
                    const gregorian = hijriData.gregorian;
                    const hijri = hijriData.hijri;

                    // Formatting the date information with both English and Arabic weekday names
                    const fullDate = `${gregorian.weekday.en}, ${gregorian.day} ${gregorian.month.en} ${gregorian.year} | ${hijri.day} ${hijri.month.en} ${hijri.year} (${hijri.weekday.en}) (${hijri.weekday.ar})`;

                    // Displaying in the Marquee
                    dateTimeElement.querySelector("p").innerText = `${fullDate} | Gregorian: ${gregorian.date}`;
                } else {
                    dateTimeElement.querySelector("p").innerText = "Error fetching Hijri data.";
                }
            } catch (error) {
                dateTimeElement.querySelector("p").innerText = "Unable to fetch date and time.";
            }
        };

        // Update every second to display real-time changes
        setInterval(updateDateTime, 1000);

        // Initial load on page load
        window.onload = updateDateTime;
        // Fetch Geolocation Automatically
        window.onload = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const { latitude, longitude } = position.coords;
                    dateTimeElement.querySelector("p").innerText =
                        `Your Location: Lat: ${latitude.toFixed(2)}, Long: ${longitude.toFixed(2)}`;
                }, () => {
                    dateTimeElement.querySelector("p").innerText = "Unable to fetch location.";
                });
            } else {
                dateTimeElement.querySelector("p").innerText = "Geolocation is not supported by your browser.";
            }
        };

        // Fetch Random Quote from quote.json
        fetch('quotes.json')
            .then(response => response.json())
            .then(data => {
                const randomQuote = data[Math.floor(Math.random() * data.length)];
                document.getElementById("quote").querySelector(".quote").innerText =
                    `"${randomQuote.quoteText}" - ${randomQuote.quoteAuthor}`;
            })
            .catch(() => {
                document.getElementById("quote").querySelector(".quote").innerText = "Failed to load quote.";
            });
        
        
    
    
