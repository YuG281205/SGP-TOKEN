console.log("Dashboard JS Loaded");
const username = localStorage.getItem("username");
document.getElementById("username").innerText = username;
document.getElementById("welcomeUser").innerText = username;
const optimizeBtn = document.getElementById("optimizeBtn");

optimizeBtn.addEventListener("click", async () => {

    const prompt = document.getElementById("prompt").value.trim();

    const aiModel = document.getElementById("model").value;

    const optimizationLevel = document.querySelector(
        'input[name="optimization"]:checked'
    ).value;

    const accessToken = localStorage.getItem("access");

    if (!prompt) {
        alert("Please enter a prompt.");
        return;
    }

    if (!aiModel) {
        alert("Please select an AI model.");
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/api/optimize/",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },

                body: JSON.stringify({

                    prompt: prompt,

                    ai_model: aiModel,

                    optimization_level: optimizationLevel

                })
            }
        );

        const result = await response.json();

        console.log(result);

        if (result.success) {

            document.getElementById("optimizedPrompt").value =
                result.optimized_prompt;

            document.getElementById("originalTotalTokens").textContent =
                result.original_total_tokens;

            document.getElementById("optimizedTotalTokens").textContent =
                result.optimized_total_tokens;

            document.getElementById("originalInputTokens").textContent =
                result.original_input_tokens;

            document.getElementById("originalOutputTokens").textContent =
                result.original_output_tokens;

            document.getElementById("optimizedInputTokens").textContent =
                result.optimized_input_tokens;

            document.getElementById("optimizedOutputTokens").textContent =
                result.optimized_output_tokens;

            document.getElementById("savedTokens").textContent =
                result.tokens_saved;

            document.getElementById("savedCost").textContent =
                result.estimated_cost_saved;

            document.getElementById("processingTime").textContent =
                result.processing_time + " s";

            document.getElementById("statusBadge").textContent =
                result.status;
        }
        else {

            alert(result.message);
        }

    }
    catch (error) {

        console.error(error);

        alert("Something went wrong.");
    }

});