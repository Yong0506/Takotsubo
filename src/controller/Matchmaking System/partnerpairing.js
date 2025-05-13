import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGSZM98qLSSIXfSor4_Mn_jqxPs__a_S0",
  authDomain: "takotsubo-4f61d.firebaseapp.com",
  projectId: "takotsubo-4f61d",
  storageBucket: "takotsubo-4f61d.appspot.com",
  messagingSenderId: "59472372412",
  appId: "1:59472372412:web:a192e23b031683988266b9",
  measurementId: "G-QQ6VXX1M7C"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const container = document.getElementById("card-container");
const genderFilter = document.getElementById("genderFilter");
const traitFilter = $('#traitFilter');
const searchButton = document.getElementById("searchButton");
traitFilter.select2();

let allPartners = [];


window.openSettings = function () {
  window.location.href = 'setting.html';
};

window.goBack = function () {
  window.location.href = 'dashboard.html'
};

window.onload = function () {

    if (localStorage.getItem("overallProgress") != 100) {
      window.history.back();
  }
  loadPlayerProfile();
  loadPartners();
  if (!localStorage.getItem("deviceId")) {
    window.location.href = "error.html";
  }

  playBackgroundMusic("../Asset Manager/musics/main/bgm.mp3");
};

let currentBGM = null;

function playBackgroundMusic(filePath) {
  if (currentBGM) {
    currentBGM.pause();
    currentBGM.currentTime = 0;
  }

  const gameVolume = (parseInt(localStorage.getItem("gameVolume")) / 100);

  currentBGM = new Audio(filePath);
  currentBGM.loop = true;
  currentBGM.volume = gameVolume;
  currentBGM.play().catch((err) => {
    console.warn("Autoplay blocked or error occurred:", err);
  });

};

async function fetchTraitsByDeviceId(deviceId) {
  try {
    const traitsDoc = await getDoc(doc(db, "traits", deviceId));
    if (traitsDoc.exists()) {
      const traitsData = traitsDoc.data();
      const allowedTraits = ["direct", "humorous", "kind", "optimistic", "romantic", "shy"];
      return Object.entries(traitsData)
        .filter(([key, value]) => allowedTraits.includes(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});;
    }
  } catch (error) {
    console.error(`获取设备ID ${deviceId} 的特征时出错:`, error);
  }
  return {};
}

function calculateMatchingScore(selectedTraits, partnertraits) {
  const traitsToCheck = selectedTraits.length > 0
    ? selectedTraits.map(t => t.toLowerCase())
    : Object.keys(partnertraits);

  if (!partnertraits || Object.keys(partnertraits).length === 0) {
    return 1;
  }

  let totalScore = 0;
  traitsToCheck.forEach(trait => {
    totalScore += partnertraits[trait] || 0;
  });

  console.log("Total Score:", totalScore); // 调试输出

  // 基础分数范围
  let baseRanges = selectedTraits.length === 0 ? [0, 6, 13, 21, 27] : [0, 4, 8, 12, 16];

  // 根据选择的特征数量调整分数范围
  const rangeAdjustment = selectedTraits.length > 1 ? selectedTraits.length * 2 : 0;
  const adjustedRanges = baseRanges.map((range, index) => index === 0 ? range : range + rangeAdjustment);

  // 根据调整后的分数范围返回心数
  if (totalScore >= adjustedRanges[4]) return 5;
  if (totalScore >= adjustedRanges[3]) return 4;
  if (totalScore >= adjustedRanges[2]) return 3;
  if (totalScore >= adjustedRanges[1]) return 2;

  return 1;
}



function generateHearts(count) {
  return '💜'.repeat(count) + '🤍'.repeat(5 - count);
}


async function loadPartners() {
  try {
    const querySnapshot = await getDocs(collection(db, "players"));
    allPartners = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      let traits = {};
      if (data.deviceId) {
        console.log('Fetching traits for deviceId:', data.deviceId);
        traits = await fetchTraitsByDeviceId(data.deviceId);
        console.log('Fetched traits:', traits);
      }
      allPartners.push({
        id: docSnap.id,
        name: data.name || "unknown",
        gender: data.gender || "unknown",
        imgUrl: data.imgUrl || "../Asset Manager/images/partnerpairing/kate.jpg",
        email: data.email || "Null",
        phone: data.phone || "Null",
        traits: traits
      });
    }
    renderCards();
  } catch (error) {
    console.error("加载伙伴数据时出错:", error);
    container.innerHTML = "<p style='color: red; text-align: center;'>Loading failed, please try again</p>";
  }
}

function renderCards(gender = "all", selectedTraits = []) {
  container.innerHTML = "";
  let filtered = allPartners;

  // Gender filter
  if (gender !== "all") {
    filtered = filtered.filter(p => p.gender.toLowerCase() === gender.toLowerCase());
  }

  // Trait filter (only include cards with non-zero trait values for selected traits)
  if (selectedTraits.length > 0) {
    filtered = filtered.filter(p =>
      selectedTraits.every(trait =>
        p.traits && p.traits[trait.toLowerCase()] > 0 // Check if the trait exists and has a value greater than 0
      )
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = "<p style='color: red; text-align: center;'>No partner found!</p>";
    return;
  }

  filtered.forEach(partner => {
    if (partner.gender === "Male") {
      partner.imgUrl = "../Asset Manager/images/partnerpairing/boy.jpg";
    } else {
      partner.imgUrl = "../Asset Manager/images/partnerpairing/kate.jpg";
    }
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
                <img src="${partner.imgUrl}" alt="${partner.name}" onerror="this.src='../Asset Manager/images/partnerpairing/kate.jpg'">
                <p>${partner.name}</p>
            `;

    card.addEventListener("click", () => {
      document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      // Calculate matching score
      const matchingScore = calculateMatchingScore(selectedTraits, partner.traits);

      // Update profile panel
      document.getElementById("profile-title").textContent = partner.name;
      document.getElementById("character-name").textContent = partner.name;
      document.getElementById("profile-img").src = partner.imgUrl;

      // Calculate total score of all traits
      const totalScore = Object.values(partner.traits).reduce((sum, value) => sum + value, 0);

      // Sort traits by value in descending order
      const sortedTraits = Object.entries(partner.traits)
        .filter(([_, value]) => value > 0) // Only include traits with non-zero values
        .sort((a, b) => b[1] - a[1]); // Sort by value in descending order

      // Display sorted traits as percentages
      const traitsList = sortedTraits
        .map(([trait, value]) => {
          const percentage = parseInt((value / totalScore) * 100); // Convert to percentage
          return `${trait.charAt(0).toUpperCase() + trait.slice(1)}: ${value}`;
        })
        .join(", ");

      const traitsContent = traitsList || "No trait available";

      document.getElementById("traits").innerHTML = `<strong>Trait:</strong><br>${traitsContent}`;
      document.getElementById("matching-level").innerHTML = `Matching level: <span>${generateHearts(matchingScore)}</span>`;
      document.getElementById("contact-info").innerHTML = `<strong>Contact:</strong><br>Email: ${partner.email}<br>Phone: ${partner.phone}`;
    });

    container.appendChild(card);
  });
}


searchButton.addEventListener("click", () => {
  const gender = genderFilter.value;
  const traits = traitFilter.val();
  renderCards(gender, traits);
});



async function loadPlayerProfile() {
  const querySnapshot = await getDocs(collection(db, "players"));
  if (!querySnapshot.empty) {
    const firstDoc = querySnapshot.docs[0];
    const player = firstDoc.data();

    document.getElementById("profile-title").textContent = player.name || "No Name";
    document.getElementById("character-name").textContent = player.name || "Unknown";
    document.getElementById("contact-info").innerHTML =
      `<strong>Contact:</strong><br>Email: ${player.email || 'N/A'}<br>Phone: ${player.phone || 'N/A'}`;
    document.getElementById("traits").innerHTML =
      `<strong>Traits:</strong><br>${player.traits ? player.traits.join(", ") : "No traits available"}`;
  }
}