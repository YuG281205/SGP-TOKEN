document.addEventListener("DOMContentLoaded", () => {

    // Check if user is logged in
    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
        alert("Please login first.");
        window.location.href = "/login/";
        return;
    }

    // Get user details
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    // Display username
    const usernameElement = document.getElementById("username");
    if (usernameElement) {
        usernameElement.textContent = username || "User";
    }

    // Display email (optional)
    const emailElement = document.getElementById("email");
    if (emailElement) {
        emailElement.textContent = email || "";
    }

});