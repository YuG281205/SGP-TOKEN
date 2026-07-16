/* =========================================================
   AI PROCESSING OVERLAY — ANIMATION CONTROLLER
   Vanilla JS. No dependencies.

   Public API (attached to window.AIOptimizerAnimation):
     start(promptText)
     showStage(stageNumber)
     updateStatus(text)
     updateProgress(percent)
     animateTokenCounter(el, from, to, duration)
     typeOptimizedPrompt(text, onDone)
     finish(resultData)   -> runs stage 5 + 6 with real numbers, then resolves
     reset()

   Usage from dashboard.js:
     await AIOptimizerAnimation.start(promptText);
     // ...fetch happens in parallel...
     await AIOptimizerAnimation.finish(resultFromApi);
   ========================================================= */

(function () {
  "use strict";

  const STAGE_MESSAGES = {
    1: ["Receiving prompt..."],
    2: [
      "Analyzing prompt...",
      "Understanding intent...",
      "Extracting key instructions...",
      "Removing unnecessary words...",
    ],
    3: [
      "Removing filler words...",
      "Compressing instructions...",
      "Optimizing locally...",
    ],
    4: [
      "Sending to Gemini...",
      "Semantic optimization...",
      "Improving clarity...",
      "Reducing token usage...",
    ],
    5: ["Benchmarking results..."],
    6: ["Optimization complete"],
  };

  // Rough progress checkpoints per stage (animated toward, not jumped to)
  const STAGE_PROGRESS = { 1: 8, 2: 32, 3: 55, 4: 82, 5: 96, 6: 100 };

  let els = {};
  let messageTimer = null;
  let currentStage = 0;

  function cacheElements() {
    els = {
      overlay: document.getElementById("aiOverlay"),
      panel: document.querySelector("#aiOverlay .ai-panel"),
      statusText: document.getElementById("aiStatusText"),
      progressFill: document.getElementById("aiProgressFill"),
      progressPercent: document.getElementById("aiProgressPercent"),
      stages: document.querySelectorAll("#aiOverlay .ai-stage"),
      promptPreview: document.getElementById("stage1PromptPreview"),
      particles: document.getElementById("stage1Particles"),
      scanText: document.getElementById("stage2Text"),
      liveTokenCount: document.getElementById("liveTokenCount"),
      neuralCore: document.getElementById("neuralCore"),
      benchOriginal: document.getElementById("benchOriginal"),
      benchOptimized: document.getElementById("benchOptimized"),
      benchSaved: document.getElementById("benchSaved"),
      benchTime: document.getElementById("benchTime"),
      benchCost: document.getElementById("benchCost"),
      finalPromptTyped: document.getElementById("finalPromptTyped"),
    };
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* ---------- Public: showStage ---------- */

  function showStage(stageNumber) {
    if (!els.stages) return;
    els.stages.forEach((stageEl) => {
      const isActive = Number(stageEl.dataset.stage) === stageNumber;
      stageEl.classList.toggle("is-active", isActive);
    });
    currentStage = stageNumber;
  }

  /* ---------- Public: updateStatus ---------- */

  function updateStatus(text) {
    if (els.statusText) {
      els.statusText.textContent = text;
    }
  }

  /* ---------- Public: updateProgress ---------- */

  function updateProgress(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    if (els.progressFill) {
      els.progressFill.style.width = clamped + "%";
    }
    if (els.progressPercent) {
      els.progressPercent.textContent = Math.round(clamped) + "%";
    }
  }

  /* ---------- Public: animateTokenCounter ---------- */

  function animateTokenCounter(el, from, to, duration) {
    return new Promise((resolve) => {
      if (!el) return resolve();
      duration = duration || 900;
      const startTime = performance.now();
      const diff = to - from;

      function tick(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const value = Math.round(from + diff * eased);
        el.textContent = value.toLocaleString();
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = to.toLocaleString();
          resolve();
        }
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Public: typeOptimizedPrompt ---------- */

  function typeOptimizedPrompt(text, onDone) {
    return new Promise((resolve) => {
      if (!els.finalPromptTyped) return resolve();
      els.finalPromptTyped.innerHTML = "";
      const cursor = document.createElement("span");
      cursor.className = "typing-cursor";

      const safeText = text || "";
      let i = 0;
      const speed = safeText.length > 260 ? 6 : 14; // ms per char, faster for long prompts

      function typeChar() {
        if (i <= safeText.length) {
          els.finalPromptTyped.textContent = safeText.slice(0, i);
          els.finalPromptTyped.appendChild(cursor);
          i++;
          setTimeout(typeChar, speed);
        } else {
          cursor.remove();
          if (typeof onDone === "function") onDone();
          resolve();
        }
      }
      typeChar();
    });
  }

  /* ---------- Stage 1 helpers ---------- */

  function fillPromptPreview(promptText) {
    if (!els.promptPreview) return;
    const preview = (promptText || "").slice(0, 220);
    els.promptPreview.textContent = preview + (promptText && promptText.length > 220 ? "…" : "");
  }

  function spawnParticles(count) {
    if (!els.particles) return;
    els.particles.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "ai-particle";
      p.style.left = 10 + Math.random() * 80 + "%";
      p.style.setProperty("--drift", (Math.random() * 30 - 15) + "px");
      p.style.animationDelay = Math.random() * 0.4 + "s";
      els.particles.appendChild(p);
    }
  }

  /* ---------- Stage 2 helper: cycle analysis messages with keyword highlight ---------- */

  async function runAnalyzingMessages() {
    const messages = STAGE_MESSAGES[2];
    for (let i = 0; i < messages.length; i++) {
      updateStatus(messages[i]);
      if (els.scanText) {
        els.scanText.innerHTML = messages[i].replace(
          /(intent|instructions|filler|prompt)/i,
          '<span class="kw">$1</span>'
        );
      }
      updateProgress(lerp(STAGE_PROGRESS[1], STAGE_PROGRESS[2], (i + 1) / messages.length));
      await sleep(340);
    }
  }

  /* ---------- Stage 3 helper: live decreasing token count ---------- */

  async function runLocalOptimizationMessages(estimatedTokens) {
    const messages = STAGE_MESSAGES[3];
    const start = estimatedTokens || 240;
    const end = Math.round(start * 0.62);
    let step = 0;
    for (const msg of messages) {
      updateStatus(msg);
      step++;
      const from = step === 1 ? start : Math.round(lerp(start, end, (step - 1) / messages.length));
      const to = Math.round(lerp(start, end, step / messages.length));
      await animateTokenCounter(els.liveTokenCount, from, to, 380);
      updateProgress(lerp(STAGE_PROGRESS[2], STAGE_PROGRESS[3], step / messages.length));
      await sleep(160);
    }
  }

  /* ---------- Stage 4 helper: neural network nodes + streams ---------- */

  function buildNeuralCore() {
    const core = els.neuralCore;
    if (!core || core.dataset.built === "1") return;
    core.dataset.built = "1";

    const nodePositions = [
      [20, 30], [50, 15], [80, 32], [15, 70], [50, 85], [85, 68], [50, 50],
    ];

    nodePositions.forEach(([x, y], idx) => {
      const node = document.createElement("span");
      node.className = "ai-neural-node";
      node.style.left = x + "%";
      node.style.top = y + "%";
      node.style.animationDelay = idx * 0.15 + "s";
      core.appendChild(node);
    });

    // connecting lines from center node to each outer node
    const [cx, cy] = [50, 50];
    nodePositions.forEach(([x, y]) => {
      if (x === cx && y === cy) return;
      const dx = x - cx;
      const dy = y - cy;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const line = document.createElement("span");
      line.className = "ai-neural-line";
      line.style.left = cx + "%";
      line.style.top = cy + "%";
      line.style.width = length + "%";
      line.style.transform = `rotate(${angle}deg)`;
      core.appendChild(line);

      const stream = document.createElement("span");
      stream.className = "ai-neural-stream";
      stream.style.left = cx + "%";
      stream.style.top = cy + "%";
      stream.style.setProperty("--tx", (x - cx) + "%");
      stream.style.setProperty("--ty", (y - cy) + "%");
      stream.style.transform = `translate(0,0)`;
      stream.style.animationDelay = Math.random() * 1.2 + "s";
      // animate travel via WAAPI since distance/direction is dynamic per-node
      stream.animate(
        [
          { left: cx + "%", top: cy + "%", opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { left: x + "%", top: y + "%", opacity: 0 },
        ],
        { duration: 1400, iterations: Infinity, delay: Math.random() * 1000 }
      );
      core.appendChild(stream);
    });
  }

  async function runLLMOptimizationMessages() {
    buildNeuralCore();
    const messages = STAGE_MESSAGES[4];
    for (let i = 0; i < messages.length; i++) {
      updateStatus(messages[i]);
      updateProgress(lerp(STAGE_PROGRESS[3], STAGE_PROGRESS[4], (i + 1) / messages.length));
      await sleep(360);
    }
  }

  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  /* ---------- Public: reset ---------- */

  function reset() {
    if (messageTimer) clearInterval(messageTimer);
    updateProgress(0);
    updateStatus("");
    showStage(1);
    if (els.liveTokenCount) els.liveTokenCount.textContent = "0";
    if (els.finalPromptTyped) els.finalPromptTyped.textContent = "";
    if (els.benchOriginal) els.benchOriginal.textContent = "0";
    if (els.benchOptimized) els.benchOptimized.textContent = "0";
    if (els.benchSaved) els.benchSaved.textContent = "0";
    if (els.benchTime) els.benchTime.textContent = "0.00s";
    if (els.benchCost) els.benchCost.textContent = "$0.00";
    if (els.overlay) els.overlay.classList.remove("is-visible");
  }

  /* ---------- Public: start ----------
     Runs stages 1-4 with simulated timings/messages.
     Resolves once stage 4 finishes, so callers can then
     call finish(resultData) as soon as their API call resolves. */

  async function start(promptText, estimatedTokens) {
    cacheElements();
    if (!els.overlay) {
      console.warn("AIOptimizerAnimation: #aiOverlay not found in DOM.");
      return;
    }
    reset();
    els.overlay.classList.add("is-visible");

    // Stage 1 — Receiving prompt
    showStage(1);
    updateStatus(STAGE_MESSAGES[1][0]);
    fillPromptPreview(promptText);
    spawnParticles(10);
    updateProgress(STAGE_PROGRESS[1]);
    await sleep(800);

    // Stage 2 — Analyzing
    showStage(2);
    await runAnalyzingMessages();

    // Stage 3 — Local optimization
    showStage(3);
    await runLocalOptimizationMessages(estimatedTokens);

    // Stage 4 — LLM optimization
    showStage(4);
    await runLLMOptimizationMessages();
  }

  /* ---------- Public: finish ----------
     Call once the backend response is available. Renders the
     real benchmark numbers (stage 5) then types the optimized
     prompt (stage 6), and leaves the overlay open until hide()
     is called (or it auto-hides after autoHideMs if provided). */

  async function finish(resultData, options) {
    options = options || {};
    const data = resultData || {};

    const originalTokens = Number(data.original_total_tokens) || 0;
    const optimizedTokens = Number(data.optimized_total_tokens) || 0;
    const tokensSaved = data.tokens_saved != null ? Number(data.tokens_saved) : Math.max(0, originalTokens - optimizedTokens);
    const processingTime = data.processing_time != null ? Number(data.processing_time) : 0;
    const costSaved = data.estimated_cost_saved != null ? data.estimated_cost_saved : "0.000000";
    const optimizedPromptText = data.optimized_prompt || "";

    // Stage 5 — Benchmark
    showStage(5);
    updateStatus(STAGE_MESSAGES[5][0]);
    updateProgress(STAGE_PROGRESS[5]);

    await Promise.all([
      animateTokenCounter(els.benchOriginal, 0, originalTokens, 900),
      animateTokenCounter(els.benchOptimized, 0, optimizedTokens, 900),
    ]);
    await animateTokenCounter(els.benchSaved, 0, tokensSaved, 700);

    if (els.benchTime) {
      let t = 0;
      const target = processingTime;
      const start2 = performance.now();
      await new Promise((resolve) => {
        function tick(now) {
          const elapsed = (now - start2) / 700;
          t = Math.min(1, elapsed);
          els.benchTime.textContent = (target * t).toFixed(2) + "s";
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        }
        requestAnimationFrame(tick);
      });
    }
    if (els.benchCost) {
      els.benchCost.textContent = "$" + Number(costSaved).toFixed(6);
    }

    updateProgress(100);
    await sleep(500);

    // Stage 6 — Completed
    showStage(6);
    updateStatus(STAGE_MESSAGES[6][0]);
    await typeOptimizedPrompt(optimizedPromptText);

    if (options.autoHideMs !== undefined && options.autoHideMs !== null) {
      await sleep(options.autoHideMs);
      hide();
    }
  }

  function hide() {
    if (els.overlay) {
      els.overlay.classList.remove("is-visible");
    }
  }

  window.AIOptimizerAnimation = {
    start,
    showStage,
    updateStatus,
    updateProgress,
    animateTokenCounter,
    typeOptimizedPrompt,
    finish,
    hide,
    reset,
  };
})();