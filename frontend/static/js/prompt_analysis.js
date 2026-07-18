document.addEventListener("DOMContentLoaded", () => {

    checkAuthentication();

    loadPromptAnalysis();

});


async function loadPromptAnalysis() {

    const token = localStorage.getItem("access");

    try {

        const response = await fetch(
            "/api/prompt_analysis/",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        renderPromptAnalysis(data.prompts);

    }

    catch (error) {

        console.error(error);

    }

}


function renderPromptAnalysis(prompts) {

    const container = document.getElementById("promptAnalysisContainer");

    if (!prompts.length) {

        container.innerHTML = `
            <div class="empty-state">
                No prompt analysis available.
            </div>
        `;

        return;

    }

    container.innerHTML = "";

    prompts.forEach(prompt => {

        container.innerHTML += `

        <div class="analysis-card">

            <div class="analysis-header">

                <h3>${prompt.ai_model}</h3>

                <span>${prompt.created_at}</span>

            </div>

            <div class="prompt-box">

                <h4>Original Prompt</h4>

                <p>${prompt.original_prompt}</p>

            </div>

            <div class="prompt-box">

                <h4>Optimized Prompt</h4>

                <p>${prompt.optimized_prompt}</p>

            </div>

            <div class="metrics-grid">

                <div class="metric">

                    <h5>Semantic Accuracy</h5>

                    <span>${prompt.semantic_accuracy}%</span>

                </div>

                <div class="metric">

                    <h5>Optimization Score</h5>

                    <span>${prompt.optimization_score}</span>

                </div>

                <div class="metric">

                    <h5>Quality Rating</h5>

                    <span>${prompt.quality_rating}</span>

                </div>

                <div class="metric">

                    <h5>Original Tokens</h5>

                    <span>${prompt.original_tokens}</span>

                </div>

                <div class="metric">

                    <h5>Optimized Tokens</h5>

                    <span>${prompt.optimized_tokens}</span>

                </div>

                <div class="metric">

                    <h5>Tokens Saved</h5>

                    <span>${prompt.tokens_saved}</span>

                </div>

                <div class="metric">

                    <h5>Cost Saved</h5>

                    <span>$${prompt.estimated_cost_saved}</span>

                </div>

                <div class="metric">

                    <h5>Processing Time</h5>

                    <span>${prompt.processing_time} sec</span>

                </div>

            </div>

        </div>

        `;

    });

}


function checkAuthentication() {

    const token = localStorage.getItem("access");

    if (!token) {

        window.location.href = "/login/";

    }

}