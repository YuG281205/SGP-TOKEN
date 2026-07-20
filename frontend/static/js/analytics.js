document.addEventListener("DOMContentLoaded", () => {
    loadAnalytics();
    initializeLogout();
});

// =====================================================
// LOAD ANALYTICS
// =====================================================
async function loadAnalytics() {
    try {
        const token = localStorage.getItem("access");

        const response = await fetch("/api/analytics/", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        console.log("Analytics Response:", data);

        setText("username", data.username);

        loadOverview(data.overview);
        loadInsights(data.insights);
        loadPerformance(data.performance);
        loadActivity(data.activity);
        loadDateAnalytics(data.date_analytics);
    }
    catch (error) {
        console.error("Analytics Error:", error);
    }
}

// =====================================================
// OVERVIEW CARDS
// =====================================================
function loadOverview(data) {
    if (!data) return;

    setText("totalOptimizations", data.total_optimizations);
    setText("totalTokenUsage", data.total_token_usage);
    setText("totalTokensSaved", data.total_tokens_saved);
    setText("averageReduction", data.average_reduction + "%");
    setText("totalOptimizedTokens", data.total_optimized_tokens);
    setText("totalCostSaved", "$" + data.total_cost_saved);
    setText("successRate", data.success_rate + "%");
    setText("averageProcessingTime", data.average_processing_time + " sec");
}

// =====================================================
// INSIGHTS
// =====================================================
function loadInsights(data) {
    if (!data) return;

    setText("bestOptimizationLevel", data.best_optimization_level);
    setText("mostUsedModel", data.most_used_model);
    setText("highestCostSaving", "$" + data.highest_cost_saving);
    setText("averageTokensSaved", data.average_tokens_saved + " Tokens");
    setText("fastestOptimization", data.fastest_optimization + " sec");
}

// =====================================================
// ACTIVITY TABLE
// =====================================================
function loadActivity(activity) {
    const tbody = document.getElementById("recentActivityBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    activity.forEach(item => {
        tbody.innerHTML += `
        <tr>
            <td>${item.prompt || ""}</td>
            <td>${item.model || ""}</td>
            <td>${item.level || ""}</td>
            <td>${item.original_tokens}</td>
            <td>${item.optimized_tokens}</td>
            <td>${item.tokens_saved}</td>
            <td>${item.processing_time}s</td>
            <td>${item.status}</td>
            <td>${item.created_at}</td>
        </tr>
        `;
    });
}

// =====================================================
// CHARTS
// =====================================================
function loadPerformance(data) {
    if (!data) return;

    createTokenChart(data.token_usage);
    createModelChart(data.model_usage);
    createLevelChart(data.optimization_levels);
}

// =====================================================
// TOKEN USAGE CHART
// =====================================================
function createTokenChart(data) {
    const canvas = document.getElementById("tokenUsageChart");
    if (!canvas || !data) return;

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Original Tokens", "Optimized Tokens", "Tokens Saved"],
            datasets: [
                {
                    label: "Tokens",
                    data: [data.original_tokens, data.optimized_tokens, data.saved_tokens]
                }
            ]
        },
        options: {
            responsive: true
        }
    });
}

// =====================================================
// MODEL USAGE CHART
// =====================================================
function createModelChart(data) {
    const canvas = document.getElementById("modelUsageChart");
    if (!canvas || !data) return;

    new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: data.map(item => item.ai_model),
            datasets: [
                {
                    label: "Requests",
                    data: data.map(item => item.total)
                }
            ]
        },
        options: {
            responsive: true
        }
    });
}

// =====================================================
// OPTIMIZATION LEVEL CHART
// =====================================================
function createLevelChart(data) {
    const canvas = document.getElementById("optimizationLevelChart");
    if (!canvas || !data) return;

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map(item => item.optimization_level),
            datasets: [
                {
                    label: "Optimizations",
                    data: data.map(item => item.total)
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// =====================================================
// SAFE UPDATE
// =====================================================
function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerText = value ?? 0;
    }
}

// =====================================================
// DATE BASED TOKEN SAVING BAR CHART
// =====================================================
function loadDateAnalytics(data) {
    const canvas = document.getElementById("dateSavingsChart");
    if (!canvas || !data) {
        console.error("Date chart data missing");
        return;
    }

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map(item => item.date),
            datasets: [
                {
                    label: "Tokens Saved",
                    data: data.map(item => item.tokens_saved)
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Tokens"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Date"
                    }
                }
            }
        }
    });
}
// =====================================================
// LOGOUT
// =====================================================
function initializeLogout() {

    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", logout);
}

function logout() {

    // Remove stored authentication
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("email");

    // Redirect to login page
    window.location.href = "/login/";
}