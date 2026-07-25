document.addEventListener("DOMContentLoaded", () => {
    setupChartTheme();
    loadAnalytics();
    initializeLogout();
});

// =====================================================
// THEME — pull the live values straight from auth-shared.css
// so charts always stay in sync with the design tokens instead
// of hard-coding a second copy of the palette here.
// =====================================================
let THEME = {};

function setupChartTheme() {
    const css = getComputedStyle(document.documentElement);
    const read = (name, fallback) => (css.getPropertyValue(name) || fallback).trim();

    THEME = {
        ink: read("--ink", "#f5f3ee"),
        mist: read("--mist", "#b9bdc9"),
        mistDim: read("--mist-dim", "#767c8c"),
        amber: read("--amber", "#ff9f5b"),
        amberDeep: read("--amber-deep", "#e07a2e"),
        teal: read("--teal", "#2ed8a0"),
        coral: read("--coral", "#ff6b6b"),
        gold: read("--accent-gold", "#f0c26b"),
        seafoam: read("--accent-seafoam", "#57d9c9"),
        gridLine: "rgba(255, 255, 255, 0.07)",
        panelBorder: read("--panel-border", "rgba(255, 255, 255, 0.14)"),
        fontBody: "Inter, sans-serif",
        fontMono: "'JetBrains Mono', monospace",
    };

    // Chart.js global defaults — every chart on the page inherits this
    // so tooltips, legends, and axis text always look like part of the
    // same frosted surface rather than Chart.js's own defaults.
    Chart.defaults.color = THEME.mist;
    Chart.defaults.font.family = THEME.fontBody;
    Chart.defaults.font.size = 12.5;
    Chart.defaults.plugins.tooltip.backgroundColor = "rgba(20, 22, 28, 0.92)";
    Chart.defaults.plugins.tooltip.titleColor = THEME.ink;
    Chart.defaults.plugins.tooltip.bodyColor = THEME.mist;
    Chart.defaults.plugins.tooltip.borderColor = THEME.panelBorder;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.titleFont = { family: THEME.fontBody, weight: "600" };
    Chart.defaults.plugins.tooltip.bodyFont = { family: THEME.fontMono, size: 12 };
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 6;
}

// helper: vertical gradient fill, used for bars/areas so every chart
// picks up a soft glow instead of a flat block of color
function verticalGradient(ctx, chartArea, colorTop, colorBottom) {
    if (!chartArea) return colorTop;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, colorBottom);
    return gradient;
}

function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

    if (!activity || !activity.length) {
        tbody.innerHTML = `
        <tr>
            <td colspan="9" class="empty-state">No optimization history available.</td>
        </tr>`;
        return;
    }

    tbody.innerHTML = "";

    activity.forEach(item => {
        const statusClass = (item.status || "").toString().toLowerCase();
        tbody.innerHTML += `
        <tr>
            <td>${item.prompt || ""}</td>
            <td>${item.model || ""}</td>
            <td>${item.level || ""}</td>
            <td>${item.original_tokens}</td>
            <td>${item.optimized_tokens}</td>
            <td>${item.tokens_saved}</td>
            <td>${item.processing_time}s</td>
            <td><span class="status-pill ${statusClass}">${item.status}</span></td>
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

    // Chart.js can measure its container mid-layout on first paint,
    // especially inside grids. A resize on the next frame forces it
    // to re-measure against the final, settled container width.
    requestAnimationFrame(() => {
        Object.values(Chart.instances).forEach(instance => instance.resize());
    });
}

// =====================================================
// TOKEN USAGE CHART — glassy gradient bars
// =====================================================
function createTokenChart(data) {
    const canvas = document.getElementById("tokenUsageChart");
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Original Tokens", "Optimized Tokens", "Tokens Saved"],
            datasets: [
                {
                    label: "Tokens",
                    data: [data.original_tokens, data.optimized_tokens, data.saved_tokens],
                    backgroundColor: (context) => {
                        const { chart } = context;
                        const { ctx, chartArea } = chart;
                        const colors = [
                            [hexToRgba(THEME.amberDeep, 0.85), hexToRgba(THEME.amber, 0.25)],
                            [hexToRgba(THEME.seafoam, 0.85), hexToRgba(THEME.seafoam, 0.2)],
                            [hexToRgba(THEME.teal, 0.9), hexToRgba(THEME.teal, 0.2)],
                        ];
                        const pair = colors[context.dataIndex] || colors[0];
                        return verticalGradient(ctx, chartArea, pair[0], pair[1]);
                    },
                    borderRadius: 10,
                    borderSkipped: false,
                    maxBarThickness: 84,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { color: THEME.gridLine },
                    ticks: { font: { family: THEME.fontMono, size: 11.5 } },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: THEME.gridLine },
                    border: { display: false },
                    ticks: { font: { family: THEME.fontMono, size: 11 } },
                },
            },
        }
    });
}

// =====================================================
// MODEL USAGE CHART — soft-cut doughnut
// =====================================================
function createModelChart(data) {
    const canvas = document.getElementById("modelUsageChart");
    if (!canvas || !data) return;

    const palette = [THEME.amber, THEME.teal, THEME.gold, THEME.seafoam, THEME.coral, THEME.amberDeep];

    new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: data.map(item => item.ai_model),
            datasets: [
                {
                    label: "Requests",
                    data: data.map(item => item.total),
                    backgroundColor: data.map((_, i) => hexToRgba(palette[i % palette.length], 0.85)),
                    borderColor: "rgba(10, 12, 16, 0.6)",
                    borderWidth: 2,
                    hoverOffset: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 14,
                        font: { family: THEME.fontBody, size: 12 },
                    },
                },
            },
        }
    });
}

// =====================================================
// OPTIMIZATION LEVEL CHART — rounded horizontal-feel bars
// =====================================================
function createLevelChart(data) {
    const canvas = document.getElementById("optimizationLevelChart");
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");
    const palette = [THEME.seafoam, THEME.amber, THEME.coral];

    new Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map(item => item.optimization_level),
            datasets: [
                {
                    label: "Optimizations",
                    data: data.map(item => item.total),
                    backgroundColor: (context) => {
                        const { chart } = context;
                        const { chartArea } = chart;
                        const color = palette[context.dataIndex % palette.length];
                        return verticalGradient(ctx, chartArea, hexToRgba(color, 0.9), hexToRgba(color, 0.18));
                    },
                    borderRadius: 10,
                    borderSkipped: false,
                    maxBarThickness: 56,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { color: THEME.gridLine },
                    ticks: { font: { family: THEME.fontMono, size: 11.5 } },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: THEME.gridLine },
                    border: { display: false },
                    ticks: { font: { family: THEME.fontMono, size: 11 }, precision: 0 },
                },
            },
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
// DATE BASED TOKEN SAVING CHART — glowing filled area line
// =====================================================
function loadDateAnalytics(data) {
    const canvas = document.getElementById("dateSavingsChart");
    if (!canvas || !data) {
        console.error("Date chart data missing");
        return;
    }

    const ctx = canvas.getContext("2d");

    new Chart(canvas, {
        type: "line",
        data: {
            labels: data.map(item => item.date),
            datasets: [
                {
                    label: "Tokens Saved",
                    data: data.map(item => item.tokens_saved),
                    borderColor: THEME.teal,
                    borderWidth: 2.5,
                    backgroundColor: (context) => {
                        const { chart } = context;
                        const { chartArea } = chart;
                        return verticalGradient(ctx, chartArea, hexToRgba(THEME.teal, 0.32), hexToRgba(THEME.teal, 0));
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: THEME.void || "#0a0c10",
                    pointBorderColor: THEME.teal,
                    pointBorderWidth: 2,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        usePointStyle: true,
                        pointStyle: "circle",
                        font: { family: THEME.fontBody, size: 12 },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: THEME.gridLine },
                    border: { display: false },
                    ticks: { font: { family: THEME.fontMono, size: 11 } },
                    title: {
                        display: true,
                        text: "Tokens",
                        color: THEME.mistDim,
                        font: { family: THEME.fontMono, size: 11 },
                    },
                },
                x: {
                    grid: { display: false },
                    border: { color: THEME.gridLine },
                    ticks: { font: { family: THEME.fontMono, size: 11 } },
                    title: {
                        display: true,
                        text: "Date",
                        color: THEME.mistDim,
                        font: { family: THEME.fontMono, size: 11 },
                    },
                },
            },
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