
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

    // Save visit details (date, time, and location)
    async function saveVisitDetails() {
      const visit = {
        time: new Date().toISOString() // Save the current timestamp
      };

      // Fetch user's location
      try {
        const response = await fetch("https://ipapi.co/json/");
        const location = await response.json();
        visit.location = {
          country: location.country_name,
          state: location.region,
          city: location.city,
          ip: location.ip
        };
        console.log("Location fetched:", visit.location); // Check location data
      } catch (error) {
        console.error("Error fetching location:", error);
        visit.location = "Unable to fetch location";
      }

      console.log("Visit Data:", visit); // Log visit data before saving

      // Construct a unique key based on location (city, state, country)
      const locationKey = `${visit.location.city}_${visit.location.state}_${visit.location.country}`;

      // Get the reference to that specific location in Firebase
      const locationRef = database.ref("locations/" + locationKey);

      // Update or create the location entry
      locationRef.transaction((currentData) => {
        if (currentData === null) {
          // First time visit, create a new entry
          return { visits: 1, ...visit.location };
        } else {
          // Increment visit count for the location
          currentData.visits += 1;
          return currentData; // Save the updated data
        }
      }).then(() => {
        console.log("Visit data saved/updated.");
      }).catch((error) => {
        console.error("Error saving visit to Firebase:", error);
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

    // Display all visit details (location and visit count)
    function displayVisitDetails() {
      const visitDetailsRef = database.ref("locations");
      visitDetailsRef.on("child_added", (snapshot) => {
        const visit = snapshot.val();
        const visitItem = document.createElement("li");

        visitItem.textContent = `Location: ${visit.city}, ${visit.state}, ${visit.country} - Visits: ${visit.visits}`;
        document.getElementById("visitDetails").appendChild(visitItem);
      });
    }

    // Initialize functions
    saveVisitDetails(); // Save current visit
    updateViewCount();  // Update and display view count
    displayVisitDetails(); // Display visit details
  
