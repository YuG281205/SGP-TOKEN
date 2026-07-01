document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const username = document.getElementById("Username").value;
    const password = document.getElementById("Password").value;

    const response = await fetch("/api/login/", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            username: username,
            password: password

        })

    });

    const data = await response.json();

    if (response.ok) {

        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        alert("Login Successful");

        window.location.href = "/dashboard/";

    } else {

        alert(data.non_field_errors || "Login Failed");

    }

});