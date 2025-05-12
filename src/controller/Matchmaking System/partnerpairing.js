import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
  window.location.href ='dashboard.html'
};

window.onload = function () {
  playBackgroundMusic("../Asset Manager/musics/main/bgm.mp3");
};

let currentBGM = null;

function playBackgroundMusic(filePath) {
  if (currentBGM) {
    currentBGM.pause();
    currentBGM.currentTime = 0;
  }

  gameVolume = (parseInt(localStorage.getItem("gameVolume")) / 100);

  currentBGM = new Audio(filePath);
  currentBGM.loop = true;
  currentBGM.volume = gameVolume;
  currentBGM.play().catch((err) => {
    console.warn("Autoplay blocked or error occurred:", err);
  });

};

async function fetchTraitsByDeviceId(deviceId) {
  try {
    const traitsQuery = query(collection(db, "traits"), where("deviceId", "==", deviceId));
    const traitsSnapshot = await getDocs(traitsQuery);
    if (!traitsSnapshot.empty) {
      const traitsData = traitsSnapshot.docs[0].data();
      const allowedTraits = ["direct", "humorous", "kind", "optimistic", "romantic", "shy"];
      // 返回特征和对应的值
      return Object.entries(traitsData)
        .filter(([key, value]) => allowedTraits.includes(key))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    }
  } catch (error) {
    console.error(`获取设备ID ${deviceId} 的特征时出错:`, error);
  }
  return {};
}

// 计算匹配分数
function calculateMatchingScore(selectedTraits, partnerTraits) {
  let totalScore = 0;
  let maxPossibleScore = 0;

  // 如果没有选择特征，使用所有特征计算
  if (selectedTraits.length === 0) {
    Object.entries(partnerTraits).forEach(([trait, value]) => {
      totalScore += value;
      maxPossibleScore += 10;
    });
  } else {
    // 只计算选中的特征
    selectedTraits.forEach(trait => {
      const traitLower = trait.toLowerCase();
      if (partnerTraits[traitLower] !== undefined) {
        totalScore += partnerTraits[traitLower];
        maxPossibleScore += 10;
      }
    });
  }

  // 如果没有可计算的特征，返回默认值
  if (maxPossibleScore === 0) return 3; // 返回中等匹配度

  // 计算最终得分（1-5颗心）
  const normalizedScore = (totalScore / maxPossibleScore) * 5;
  // 确保分数在1-5之间，且高分值得到更好的显示
  return Math.max(1, Math.min(5, Math.round(normalizedScore)));
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
        traits = await fetchTraitsByDeviceId(data.deviceId);
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
          return `${trait.charAt(0).toUpperCase() + trait.slice(1)}: ${percentage}%`;
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
// ... existing code ...

searchButton.addEventListener("click", () => {
  const gender = genderFilter.value;
  const traits = traitFilter.val();
  renderCards(gender, traits);
});

loadPartners();

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
    document.getElementById("notes").innerHTML =
      `<strong>NOTES</strong><br>Has class on Tuesdays.`; // Replace or customize if notes field exists

    // You can dynamically update the image if URLs are stored in the DB
    // document.getElementById("profile-img").src = player.imageURL || "default.jpg";
  }
}

loadPlayerProfile();

const maxTraitValue = 10;
const maxTotalScore = Object.keys(traitWeights).length * maxTraitValue;

// Function to calculate total score for a user
function calculateTotalScore(traits) {
  let total = 0;
  for (let trait in traitWeights) {
    const traitValue = traits[trait] || 0;
    total += traitValue * traitWeights[trait];
  }
  return total;
}

// Function to normalize score to a scale of 0 to 6
function normalizeScore(score) {
  return Math.round((score / maxTotalScore) * 6);
}

// Function to create heart icons
function createHearts(count) {
  const heartContainer = document.createElement('div');
  heartContainer.classList.add('heart-container');
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.classList.add('heart');
    heart.innerHTML = '&#10084;'; // Unicode for heart symbol
    heartContainer.appendChild(heart);
  }
  return heartContainer;
}

// Function to render user profiles
function renderProfiles(users) {
  const container = document.getElementById('profiles-container');
  users.forEach(user => {
    const totalScore = calculateTotalScore(user.traits);
    const heartCount = normalizeScore(totalScore);

    const card = document.createElement('div');
    card.classList.add('profile-card');

    const name = document.createElement('h3');
    name.textContent = user.name;

    const hearts = createHearts(heartCount);

    card.appendChild(name);
    card.appendChild(hearts);
    container.appendChild(card);
  });
}

// Initialize rendering
renderProfiles(users);

function calculateMatchingLevel(traits1, traits2) {
  let matches = traits1.filter(trait => traits2.includes(trait));
  return matches.length / Math.max(traits1.length, traits2.length);
}

const selectedProfiles = [profile1, profile2]; // assume these are your selected objects

const level = calculateMatchingLevel(selectedProfiles[0].traits, selectedProfiles[1].traits);
console.log("Matching Level:", level);

$('.card').on('click', function () {
  // collect selected cards
  const selected = $('.card.selected');
  if (selected.length === 2) {
    const profile1 = selected.eq(0).data('profile');
    const profile2 = selected.eq(1).data('profile');

    const level = calculateMatchingLevel(profile1.traits, profile2.traits);
    alert(`Matching Level: ${(level * 100).toFixed(2)}%`);
  }
});

window.onload = async function () {
  if (!localStorage.getItem("deviceId")) {
    window.location.href = "error.html";
  }
}

