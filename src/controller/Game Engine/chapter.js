window.onload = async function () {
    if (!localStorage.getItem("deviceId")) {
        window.location.href = "error.html";
    }
}

function openSettings() {
    window.location.href = 'setting.html'
}

function goBack() {
    window.history.back();
}

function denyAnger() {
    localStorage.setItem("gameSavedChap", 1);
    localStorage.setItem("currentStory", "denyAnger");
    localStorage.setItem("gameSavedDialog", "deny1");

    window.location.href = 'storyline.html';
}

function memories() {
    localStorage.setItem("gameSavedChap", 2);
    localStorage.setItem("currentStory", "memories");
    localStorage.setItem("gameSavedDialog", "memories1");

    window.location.href = 'storyline.html'
}

function lettingGo() {
    localStorage.setItem("gameSavedChap", 3);
    localStorage.setItem("currentStory", "lettingGo");
    localStorage.setItem("gameSavedDialog", "letting1");

    window.location.href = 'storyline.html'
}