document.addEventListener("DOMContentLoaded", async function () {

    const token = localStorage.getItem("access");

    if (!token) {
        alert("Please login first.");
        window.location.href = "/login/";
        return;
    }

    const tableBody = document.getElementById("historyBody");

    let historyData = [];

    try {

        const response = await fetch("/api/history/", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        console.log("History API Response");
        console.log(result);

        if (!response.ok) {
            alert(result.message || "Unable to fetch history.");
            return;
        }

        historyData = result.data;

        tableBody.innerHTML = "";

        if (historyData.length === 0) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align:center;">
                        No Prompt History Found
                    </td>
                </tr>
            `;

            return;
        }

        historyData.forEach((item, index) => {

            tableBody.innerHTML += `

                <tr>

                    <td>${index + 1}</td>

                    <td>
                        ${new Date(item.created_at).toLocaleDateString()}
                    </td>

                    <td>${item.ai_model}</td>

                    <td>${item.optimization_level}</td>

                    <td>${item.original_total_tokens}</td>

                    <td>${item.optimized_total_tokens}</td>

                    <td>${item.tokens_saved}</td>

                    <td>$${item.estimated_cost_saved}</td>

                    <td>${item.processing_time} sec</td>

                    <td>${item.status}</td>

                    <td>

                        <button
                            class="view-btn"
                            data-id="${item.id}"
                        >
                            View
                        </button>

                    </td>

                </tr>

            `;

        });

        addViewButtonEvents(historyData);

    }

    catch (error) {

        console.error(error);

        tableBody.innerHTML = `

            <tr>

                <td colspan="11" style="text-align:center;color:red;">

                    Unable to load history.

                </td>

            </tr>

        `;

    }

});

// =====================================================
// VIEW BUTTON EVENTS
// =====================================================

function addViewButtonEvents(historyData) {

    const buttons = document.querySelectorAll(".view-btn");

    buttons.forEach(button => {

        button.addEventListener("click", function () {

            const id = Number(this.dataset.id);

            const item = historyData.find(record => record.id === id);

            if (!item) {
                alert("Record not found.");
                return;
            }

            // ===========================
            // PROMPTS
            // ===========================

            document.getElementById("originalPrompt").value =
                item.original_prompt || "";

            document.getElementById("optimizedPrompt").value =
                item.optimized_prompt || "";

            // ===========================
            // TOKEN DETAILS
            // ===========================

            document.getElementById("originalInputTokens").textContent =
                item.original_input_tokens;

            document.getElementById("originalOutputTokens").textContent =
                item.original_output_tokens;

            document.getElementById("originalTotalTokens").textContent =
                item.original_total_tokens;

            document.getElementById("optimizedInputTokens").textContent =
                item.optimized_input_tokens;

            document.getElementById("optimizedOutputTokens").textContent =
                item.optimized_output_tokens;

            document.getElementById("optimizedTotalTokens").textContent =
                item.optimized_total_tokens;

            document.getElementById("tokensSaved").textContent =
                item.tokens_saved;

            document.getElementById("costSaved").textContent =
                "$" + item.estimated_cost_saved;

            document.getElementById("processingTime").textContent =
                item.processing_time + " sec";

            // ===========================
            // OTHER DETAILS
            // ===========================

            document.getElementById("modelName").textContent =
                item.ai_model;

            document.getElementById("optimizationLevel").textContent =
                item.optimization_level;

            document.getElementById("status").textContent =
                item.status;

            document.getElementById("createdAt").textContent =
                new Date(item.created_at).toLocaleString();

            // ===========================
            // OPEN MODAL
            // ===========================

            document.getElementById("historyModal").style.display = "block";

        });

    });

}


// =====================================================
// CLOSE MODAL
// =====================================================

const modal = document.getElementById("historyModal");

const closeBtn = document.querySelector(".close");

if (closeBtn) {

    closeBtn.onclick = function () {

        modal.style.display = "none";

    };

}

window.onclick = function (event) {

    if (event.target === modal) {

        modal.style.display = "none";

    }

};


// =====================================================
// OPTIONAL: ESC KEY CLOSES MODAL
// =====================================================

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        document.getElementById("historyModal").style.display = "none";

    }

});