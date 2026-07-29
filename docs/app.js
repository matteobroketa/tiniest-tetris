(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const challengeSelect = $("#challenge-select");
  const versionSelect = $("#version-select");
  const sourceCode = $("#source-code");
  const sourceFilename = $("#source-filename");
  const sourceViewNote = $("#source-view-note");
  const copySource = $("#copy-source");
  const downloadSource = $("#download-source");
  const proofPill = $("#proof-pill");
  const candidateSummary = $("#candidate-summary");
  const metricBytes = $("#metric-bytes");
  const metricRuntime = $("#metric-runtime");
  const metricHash = $("#metric-hash");
  const runtimePill = $("#runtime-pill");
  const terminalTitle = $("#terminal-title");
  const terminalState = $("#terminal-state");
  const terminalOutput = $("#terminal-output");
  const startDemo = $("#start-demo");
  const stepDemo = $("#step-demo");
  const resetDemo = $("#reset-demo");
  const runPython = $("#run-python");
  const speedControl = $("#speed-control");
  const keyControls = $("#key-controls");
  const demoNote = $("#demo-note");
  const tabs = [...document.querySelectorAll(".tab")];

  let manifest;
  let selected;
  let currentTab = "golfed";
  let sourceViews = { golfed: "", readable: "" };
  let activeDemo;
  let timer = null;
  let pythonWorker = null;
  let pythonFrames = null;
  let pythonFrameIndex = 0;
  let pythonTimeout = null;
  let proofKeyValues = [];

  const SAMPLE_BOARD = [
    "          ",
    "          ",
    "          ",
    "          ",
    " #    #  #",
    " ## ######"
  ];
  const SCRIPTED_COMMANDS = [
    ["T", 2], ["Z", 6], ["I", 0], ["T", 7]
  ];
  const SCRIPTED_SHAPES = {
    I: [[0, 0], [1, 0], [2, 0], [3, 0]],
    J: [[0, 1], [1, 1], [2, 0], [2, 1]],
    L: [[0, 0], [1, 0], [2, 0], [2, 1]],
    O: [[0, 0], [0, 1], [1, 0], [1, 1]],
    S: [[0, 1], [0, 2], [1, 0], [1, 1]],
    T: [[0, 0], [0, 1], [0, 2], [1, 1]],
    Z: [[0, 0], [0, 1], [1, 1], [1, 2]]
  };

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
  }

  function renderTerminal(text, options = {}) {
    const escaped = escapeHtml(text);
    let highlighted = escaped
      .replaceAll("#", '<span class="block">#</span>')
      .replace(/^(frame|score|lines|commands|runtime|source|mode):.*$/gmi, '<span class="frame">$&</span>')
      .replace(/^(keys|status|note):.*$/gmi, '<span class="dim">$&</span>');
    if (options.error) highlighted = `<span class="error">${escaped}</span>`;
    terminalOutput.innerHTML = highlighted;
  }

  function safeByteView(bytes) {
    let output = "";
    for (const byte of bytes) {
      if (byte === 10) output += "\n";
      else if (byte === 9) output += "\t";
      else if (byte >= 32 && byte <= 126) output += String.fromCharCode(byte);
      else output += `\\x${byte.toString(16).padStart(2, "0")}`;
    }
    return output;
  }

  function basename(path) {
    return path.split("/").pop();
  }

  async function fetchBytes(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Unable to load ${path} (${response.status})`);
    return new Uint8Array(await response.arrayBuffer());
  }

  function stopTimer() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    startDemo.textContent = "Start";
  }

  function stopPythonAnimation() {
    pythonFrames = null;
    pythonFrameIndex = 0;
    if (pythonTimeout !== null) window.clearTimeout(pythonTimeout);
    pythonTimeout = null;
  }

  function setTerminalState(text) {
    terminalState.textContent = text;
  }

  function updateSourcePanel() {
    sourceCode.textContent = sourceViews[currentTab] || "";
    const path = currentTab === "golfed" ? selected.candidate : selected.readable;
    sourceFilename.textContent = basename(path);
    downloadSource.href = selected.candidate;
    downloadSource.download = basename(selected.candidate);
    sourceViewNote.textContent = currentTab === "golfed"
      ? "Exact byte count; non-printing bytes are escaped as \\xNN."
      : "Decompressed or readable source; non-printing bytes are escaped as \\xNN.";
  }

  function buildDemo() {
    stopTimer();
    stopPythonAnimation();
    if (selected.challenge === "playable") {
      activeDemo = new PlayableDemo(proofKeyValues);
      keyControls.hidden = false;
      terminalTitle.textContent = `${selected.versionLabel} / playable core`;
    } else {
      activeDemo = new ScriptedDemo();
      keyControls.hidden = true;
      terminalTitle.textContent = `${selected.versionLabel} / scripted simulator`;
    }
    runtimePill.textContent = "JavaScript model";
    setTerminalState("ready");
    renderTerminal(activeDemo.render());
  }

  async function loadSelection() {
    stopTimer();
    stopPythonAnimation();
    const challengeKey = challengeSelect.value;
    const versionKey = versionSelect.value;
    const challenge = manifest.challenges[challengeKey];
    const version = challenge.versions[versionKey];
    selected = {
      ...version,
      challenge: challengeKey,
      challengeLabel: challenge.label,
      challengeSummary: challenge.summary,
      version: versionKey,
      versionLabel: version.label
    };

    proofPill.textContent = version.proof;
    candidateSummary.textContent = challenge.summary;
    metricBytes.textContent = `${version.bytes} bytes`;
    metricRuntime.textContent = version.label;
    metricHash.textContent = version.sha256;
    metricHash.title = version.sha256;
    demoNote.textContent = version.note;
    runPython.disabled = !version.actualBrowserRun;
    runPython.textContent = version.actualBrowserRun ? "Run exact Python" : "Python browser run unavailable";

    sourceCode.textContent = "Loading source…";
    try {
      const [golfedBytes, readableBytes] = await Promise.all([
        fetchBytes(version.candidate),
        fetchBytes(version.readable)
      ]);
      sourceViews = {
        golfed: safeByteView(golfedBytes),
        readable: safeByteView(readableBytes)
      };
      updateSourcePanel();
    } catch (error) {
      sourceViews = { golfed: String(error), readable: String(error) };
      updateSourcePanel();
    }

    buildDemo();
  }

  function startOrPause() {
    if (pythonFrames) {
      if (timer !== null) stopTimer();
      else startPythonAnimation();
      return;
    }
    if (timer !== null) {
      stopTimer();
      setTerminalState("paused");
      return;
    }
    if (activeDemo.done) activeDemo.reset();
    timer = window.setInterval(() => {
      activeDemo.step();
      renderTerminal(activeDemo.render());
      if (activeDemo.done) {
        stopTimer();
        setTerminalState("complete");
      }
    }, Number(speedControl.value));
    startDemo.textContent = "Pause";
    setTerminalState("running");
  }

  function stepOnce() {
    if (pythonFrames) {
      stopTimer();
      pythonFrameIndex = Math.min(pythonFrameIndex + 1, pythonFrames.length - 1);
      renderPythonFrame();
      return;
    }
    stopTimer();
    activeDemo.step();
    renderTerminal(activeDemo.render());
    setTerminalState(activeDemo.done ? "complete" : "stepped");
  }

  function resetCurrent() {
    stopTimer();
    stopPythonAnimation();
    runtimePill.textContent = "JavaScript model";
    activeDemo.reset();
    renderTerminal(activeDemo.render());
    setTerminalState("ready");
  }

  function createPythonWorker() {
    if (pythonWorker) pythonWorker.terminate();
    pythonWorker = new Worker("python-worker.js");
    pythonWorker.addEventListener("message", handlePythonMessage);
    pythonWorker.addEventListener("error", (event) => {
      clearPythonTimeout();
      runPython.disabled = false;
      renderTerminal(`Python worker error:\n${event.message}`, { error: true });
      setTerminalState("error");
    });
    return pythonWorker;
  }

  function clearPythonTimeout() {
    if (pythonTimeout !== null) window.clearTimeout(pythonTimeout);
    pythonTimeout = null;
  }

  function handlePythonMessage(event) {
    const message = event.data;
    if (message.type === "status") {
      setTerminalState(message.status);
      demoNote.textContent = message.detail;
      return;
    }
    clearPythonTimeout();
    runPython.disabled = false;
    if (message.type === "error") {
      runtimePill.textContent = "Pyodide error";
      setTerminalState("error");
      renderTerminal(message.error, { error: true });
      return;
    }
    if (message.type === "result") {
      runtimePill.textContent = `Exact source · ${message.pythonVersion}`;
      pythonFrames = message.frames.length ? message.frames : [message.stdout || "No output"];
      pythonFrameIndex = 0;
      setTerminalState("Python complete");
      demoNote.textContent = message.note;
      renderPythonFrame();
      if (pythonFrames.length > 1) startPythonAnimation();
    }
  }

  async function runExactPython() {
    if (!selected.actualBrowserRun) return;
    stopTimer();
    stopPythonAnimation();
    runPython.disabled = true;
    runtimePill.textContent = "Loading Pyodide";
    setTerminalState("loading Python");
    renderTerminal("Loading the browser Python runtime…\n\nThe interactive JavaScript model remains available through Reset.");

    const worker = createPythonWorker();
    pythonTimeout = window.setTimeout(() => {
      worker.terminate();
      pythonWorker = null;
      runPython.disabled = false;
      runtimePill.textContent = "Pyodide timeout";
      setTerminalState("timeout");
      renderTerminal("The Python runtime did not finish within 75 seconds.\nUse Reset to return to the JavaScript model.", { error: true });
    }, 75000);

    worker.postMessage({
      type: "run",
      mode: selected.challenge,
      sourceUrl: selected.candidate,
      inputUrl: "data/scripted-sample.in",
      keysUrl: "data/playable-keys.txt"
    });
  }

  function renderPythonFrame() {
    if (!pythonFrames?.length) return;
    const raw = pythonFrames[pythonFrameIndex];
    const header = [
      "mode: exact committed Python 3 source",
      `frame: ${pythonFrameIndex + 1}/${pythonFrames.length}`,
      ""
    ].join("\n");
    renderTerminal(header + raw);
    setTerminalState(pythonFrameIndex >= pythonFrames.length - 1 ? "complete" : "replay");
  }

  function startPythonAnimation() {
    if (!pythonFrames?.length) return;
    if (pythonFrameIndex >= pythonFrames.length - 1) pythonFrameIndex = 0;
    timer = window.setInterval(() => {
      renderPythonFrame();
      pythonFrameIndex += 1;
      if (pythonFrameIndex >= pythonFrames.length) {
        pythonFrameIndex = pythonFrames.length - 1;
        renderPythonFrame();
        stopTimer();
        setTerminalState("complete");
      }
    }, Math.max(45, Number(speedControl.value)));
    startDemo.textContent = "Pause";
    setTerminalState("replay");
  }

  class PlayableDemo {
    constructor(autoKeys = []) {
      this.autoKeys = autoKeys;
      this.reset();
    }

    reset() {
      this.board = Array(20).fill(0).concat(Array(4).fill(1023));
      this.pieces = [15, 51, 39, 113, 116, 54, 99];
      this.pieceIndex = 0;
      this.piece = this.pieces[0];
      this.x = 3;
      this.y = 0;
      this.lines = 0;
      this.frame = 0;
      this.done = false;
      this.pending = null;
      this.autoIndex = 0;
    }

    collision(x = this.x, y = this.y, piece = this.piece) {
      if (x < 0) return true;
      for (let row = 0; row < 4; row += 1) {
        const shapeRow = (piece >> (row * 4)) & 15;
        if ((((this.board[y + row] | -1024) >> x) & shapeRow) !== 0) return true;
      }
      return false;
    }

    rotate(piece = this.piece) {
      let result = 0;
      for (let i = 0; i < 16; i += 1) {
        result |= ((piece >> i) & 1) << ((4 * i + 3) % 17);
      }
      return result;
    }

    queue(action) { this.pending = action; }

    applyAction(action) {
      let nextX = this.x;
      let nextPiece = this.piece;
      if (action === "left") nextX -= 1;
      else if (action === "right") nextX += 1;
      else if (action === "rotate") nextPiece = this.rotate();
      if (!this.collision(nextX, this.y, nextPiece)) {
        this.x = nextX;
        this.piece = nextPiece;
      }
    }

    step(action = this.pending) {
      if (this.done) return;
      this.pending = null;
      if (!action && this.autoIndex < this.autoKeys.length) {
        const key = this.autoKeys[this.autoIndex];
        this.autoIndex += 1;
        action = key === 97 ? "left" : key === 98 ? "rotate" : key === 99 ? "right" : null;
      }
      if (action) this.applyAction(action);
      if (this.collision(this.x, this.y + 1, this.piece)) {
        for (let row = 0; row < 4; row += 1) {
          this.board[this.y + row] |= ((this.piece >> (row * 4)) & 15) << this.x;
        }
        const kept = this.board.filter((value) => value < 1023);
        const cleared = 20 - kept.length;
        this.lines += cleared;
        this.board = Array(20 - kept.length).fill(0).concat(kept, Array(4).fill(1023));
        this.pieceIndex = (this.pieceIndex + 1) % this.pieces.length;
        this.piece = this.pieces[this.pieceIndex];
        this.x = 3;
        this.y = 0;
        if (this.collision()) this.done = true;
      } else {
        this.y += 1;
      }
      this.frame += 1;
    }

    render() {
      const rows = this.board.slice(0, 20);
      if (!this.done) {
        for (let row = 0; row < 4; row += 1) {
          if (this.y + row >= 0 && this.y + row < 20) {
            rows[this.y + row] |= ((this.piece >> (row * 4)) & 15) << this.x;
          }
        }
      }
      const boardText = rows.map((value) => {
        let row = "";
        for (let x = 0; x < 10; x += 1) row += (value >> x) & 1 ? "#" : " ";
        return `│${row}│`;
      }).join("\n");
      return [
        "mode: representative bitboard demo",
        `frame: ${String(this.frame).padStart(4, "0")}    lines: ${this.lines}`,
        "┌──────────┐",
        boardText,
        "└──────────┘",
        this.done ? "status: game over" : "keys: A left · B rotate · C right"
      ].join("\n");
    }
  }

  class ScriptedDemo {
    constructor() { this.reset(); }

    reset() {
      this.board = SAMPLE_BOARD.map((row) => [...row]);
      this.commands = SCRIPTED_COMMANDS.map(([piece, x]) => ({ piece, x }));
      this.commandIndex = 0;
      this.active = null;
      this.lines = 0;
      this.frame = 0;
      this.done = false;
    }

    collision(piece, x, y) {
      for (const [row, column] of SCRIPTED_SHAPES[piece]) {
        const boardY = y + row;
        const boardX = x + column;
        if (boardX < 0 || boardX >= 10 || boardY >= 6) return true;
        if (boardY >= 0 && this.board[boardY][boardX] === "#") return true;
      }
      return false;
    }

    step() {
      if (this.done) return;
      if (!this.active) {
        if (this.commandIndex >= this.commands.length) {
          this.done = true;
          return;
        }
        const command = this.commands[this.commandIndex];
        this.active = { ...command, y: -4 };
      }
      const { piece, x, y } = this.active;
      if (!this.collision(piece, x, y + 1)) {
        this.active.y += 1;
      } else {
        for (const [row, column] of SCRIPTED_SHAPES[piece]) {
          const boardY = y + row;
          const boardX = x + column;
          if (boardY >= 0) this.board[boardY][boardX] = "#";
        }
        const kept = this.board.filter((row) => row.some((cell) => cell !== "#"));
        const cleared = 6 - kept.length;
        this.lines += cleared;
        this.board = Array.from({ length: cleared }, () => Array(10).fill(" ")).concat(kept);
        this.commandIndex += 1;
        this.active = null;
        if (this.commandIndex >= this.commands.length) this.done = true;
      }
      this.frame += 1;
    }

    render() {
      const board = this.board.map((row) => row.slice());
      if (this.active) {
        for (const [row, column] of SCRIPTED_SHAPES[this.active.piece]) {
          const boardY = this.active.y + row;
          const boardX = this.active.x + column;
          if (boardY >= 0 && boardY < 6) board[boardY][boardX] = "#";
        }
      }
      const boardText = board.map((row) => `[${row.join("")}]`).join("\n");
      const commandText = this.commands.map(({ piece, x }, index) => {
        if (index < this.commandIndex) return `✓${piece}${x}`;
        if (index === this.commandIndex && !this.done) return `>${piece}${x}`;
        return ` ${piece}${x}`;
      }).join("  ");
      return [
        "mode: representative scripted demo",
        `commands: ${commandText}`,
        `frame: ${String(this.frame).padStart(3, "0")}    score: ${this.lines * 10}`,
        boardText,
        "[==========]",
        this.done ? "status: final board" : "note: fixed orientation; pieces fall automatically"
      ].join("\n");
    }
  }

  challengeSelect.addEventListener("change", loadSelection);
  versionSelect.addEventListener("change", loadSelection);
  startDemo.addEventListener("click", startOrPause);
  stepDemo.addEventListener("click", stepOnce);
  resetDemo.addEventListener("click", resetCurrent);
  runPython.addEventListener("click", runExactPython);
  speedControl.addEventListener("input", () => {
    if (timer !== null) {
      stopTimer();
      startOrPause();
    }
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      currentTab = tab.dataset.tab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      updateSourcePanel();
    });
  });

  copySource.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(sourceViews[currentTab]);
      copySource.textContent = "Copied";
      window.setTimeout(() => { copySource.textContent = "Copy view"; }, 1400);
    } catch {
      copySource.textContent = "Copy failed";
      window.setTimeout(() => { copySource.textContent = "Copy view"; }, 1400);
    }
  });

  keyControls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-key]");
    if (!button || selected.challenge !== "playable" || pythonFrames) return;
    activeDemo.queue(button.dataset.key);
    if (timer === null) {
      activeDemo.step();
      renderTerminal(activeDemo.render());
      setTerminalState(activeDemo.done ? "complete" : "stepped");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (selected?.challenge !== "playable" || pythonFrames) return;
    const key = event.key.toLowerCase();
    const action = key === "a" || key === "arrowleft" ? "left"
      : key === "b" || key === "arrowup" ? "rotate"
      : key === "c" || key === "arrowright" ? "right" : null;
    if (!action) return;
    event.preventDefault();
    activeDemo.queue(action);
    if (timer === null) {
      activeDemo.step();
      renderTerminal(activeDemo.render());
      setTerminalState(activeDemo.done ? "complete" : "stepped");
    }
  });

  Promise.all([
    fetch("data/candidates.json", { cache: "no-cache" }).then((response) => {
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      return response.json();
    }),
    fetch("data/playable-keys.txt", { cache: "no-cache" }).then((response) => {
      if (!response.ok) throw new Error(`Key stream HTTP ${response.status}`);
      return response.text();
    })
  ])
    .then(([data, keyText]) => {
      manifest = data;
      proofKeyValues = keyText.trim().split(/\s+/).map(Number).filter(Number.isFinite);
      return loadSelection();
    })
    .catch((error) => {
      proofPill.textContent = "Manifest error";
      candidateSummary.textContent = String(error);
      renderTerminal(String(error), { error: true });
    });
})();
