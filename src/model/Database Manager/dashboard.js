// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getFirestore, getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAGSZM98qLSSIXfSor4_Mn_jqxPs__a_S0",
    authDomain: "takotsubo-4f61d.firebaseapp.com",
    projectId: "takotsubo-4f61d",
    storageBucket: "takotsubo-4f61d.firebasestorage.app",
    messagingSenderId: "59472372412",
    appId: "1:59472372412:web:a192e23b031683988266b9",
    measurementId: "G-QQ6VXX1M7C"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const deviceId = localStorage.getItem("deviceId");

const docRef = doc(db, "players", deviceId);
const docSnap = await getDoc(docRef);

if (docSnap.exists()) {
    const data = docSnap.data();

    document.getElementById("name").textContent = `Name: ${data.name}`;
    document.getElementById("gender").textContent = `Gender: ${data.gender}`;
    document.getElementById("birth").textContent = `Birth Date: ${data.birthDate}`;
    document.getElementById("email").textContent = `Email: ${data.email}`;
    document.getElementById("phone").textContent = `Phone: ${data.phone}`;

    document.getElementById("editName").value = data.name || "";
    document.getElementById("editBirthDate").value = data.birthDate || "";
    document.getElementById("editEmail").value = data.email || "";
    document.getElementById("editPhone").value = data.phone || "";

    if (data.gender === "Male") {
        document.getElementById("editMale").checked = true;
    } else if (data.gender === "Female") {
        document.getElementById("editFemale").checked = true;
    }

    const btn = document.getElementById("storyBtn");
    if (data.newGame === "Yes") {
        btn.textContent = "Start Game";
    } else if (data.allChapUnlock === "Yes") {
        btn.textContent = "Select Chapter";
    } else {
        btn.textContent = "Continue the Story";
    }

    let unlocked = 0;
    if (data.denyAnger === "Yes") unlocked++;
    if (data.memories === "Yes") unlocked++;
    if (data.lettingGo === "Yes") unlocked++;

    const percent = (unlocked / 3) * 100;
    document.getElementById("chapterProgress").style.width = `${percent}%`;
    document.getElementById("chapterCount").textContent = `${unlocked}/3`;

    let overallProgress = 0;
    if (data.allChapUnlock === "Yes") {
        overallProgress = 100;
        document.getElementById("partnerPairing").style.display = "block";
        document.getElementById("storyBtn").style.width = "35%";
    } else {
        overallProgress = data.overallProgress
    }

    var ctx = document.getElementById('doughnutChart').getContext('2d');
    var doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                label: 'Progress',
                data: [overallProgress, 100 - overallProgress],
                backgroundColor: ['#2ecc71', '#7f8c8d'],
                borderColor: ['#ffffff', '#ffffff'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: false
                },
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 32
                    },
                    formatter: function (value, context) {
                        if (context.dataIndex === 0) {
                            return value + '%';
                        } else {
                            return '';
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
} else {
    console.log("no such document!");
}

const traitsRef = doc(db, "traits", deviceId);
const traitsSnap = await getDoc(traitsRef);

if (traitsSnap.exists()) {
    const data = traitsSnap.data();

    const fixedTraits = ['romantic', 'optimistic', 'humorous', 'kind', 'direct', 'shy'];

    const values = fixedTraits.map(trait => data[trait] || 0);

    const backgroundColors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
    ];

    const borderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
    ];

    const ctx = document.getElementById('traitsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: fixedTraits.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
                label: 'Trait Level',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.2)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    bodyColor: 'white',
                    titleColor: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
                }
            }
        }
    });
}
else {
    console.log("Traits data not found");
}

async function saveEditedProfile() {
    const updatedData = {
        name: document.getElementById("editName").value,
        gender: document.querySelector('input[name="editGender"]:checked')?.value || "",
        birthDate: document.getElementById("editBirthDate").value,
        email: document.getElementById("editEmail").value,
        phone: document.getElementById("editPhone").value,
    };

    console.log(updatedData)

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!updatedData.name || !updatedData.gender || !updatedData.birthDate || !updatedData.email || !updatedData.phone) {
        alert("Please fill out all fields before proceeding.");
        return;
    }

    if (!emailPattern.test(updatedData.email)) {
        alert("Please enter a valid email address.");
        return;
    }

    try {
        const docRef = doc(db, "players", deviceId);
        await updateDoc(docRef, updatedData);
        alert("Profile updated successfully!");

        location.reload();
    } catch (error) {
        alert("Failed to update profile.");
    }
}

window.saveEditedProfile = saveEditedProfile;