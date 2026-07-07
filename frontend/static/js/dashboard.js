console.log("Dashboard JS Loaded");
const optimizeBtn = document.getElementById("optimizeBtn");

optimizeBtn.addEventListener("click", async () => {

    const originalPrompt = document.getElementById("prompt").value.trim();

    const aiModel = document.getElementById("model").value;

    const optimizationLevel = document.querySelector(
        'input[name="optimization"]:checked'
    ).value;

    const accessToken = localStorage.getItem("access");
    console.log(accessToken);
    const response = await fetch("http://127.0.0.1:8000/api/save-prompt/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            original_prompt: originalPrompt,
            ai_model: aiModel,
            optimization_level: optimizationLevel
        })
    });

    const result = await response.json();

    console.log(result);
});