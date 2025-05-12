document.addEventListener("DOMContentLoaded", () => {
    const birthInput = document.getElementById("birthDate");
    const today = new Date().toISOString().split("T")[0];
    birthInput.setAttribute("max", today);
});

document.getElementById("phone").addEventListener("input", function () {
    this.value = this.value.replace(/[^\d\s\-]/g, '');
});