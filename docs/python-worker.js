/* Runs only the Python 3 candidates. Historical CPython versions remain CI-only. */
"use strict";

const PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v314.0.2/full/";
let pyodidePromise = null;

function status(statusText, detail) {
  self.postMessage({ type: "status", status: statusText, detail });
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function getPyodideRuntime() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      status("loading Python", "Downloading Pyodide on demand. The first run can take several seconds; later runs use the browser cache.");
      importScripts(`${PYODIDE_BASE}pyodide.js`);
      return self.loadPyodide({ indexURL: PYODIDE_BASE });
    })();
  }
  return pyodidePromise;
}

const RUNNER = String.raw`
import base64, json, sys, types, traceback

source = base64.b64decode(SOURCE_B64).decode("latin1")
result = {"frames": [], "stdout": "", "pythonVersion": sys.version.split()[0], "note": ""}

try:
    if MODE == "playable":
        frames = []
        keys = json.loads(KEY_VALUES_JSON)
        key_index = 0

        class Screen:
            def timeout(self, value):
                pass

            def getch(self):
                global key_index
                if key_index < len(keys):
                    value = keys[key_index]
                    key_index += 1
                    return value
                return -1

            def addstr(self, *args):
                if len(frames) < 2000:
                    frames.append(str(args[-1]))

        def wrapper(function):
            function(Screen())

        curses_module = types.ModuleType("curses")
        curses_module.wrapper = wrapper
        curses_module.__all__ = ["wrapper"]
        previous_curses = sys.modules.get("curses")
        sys.modules["curses"] = curses_module
        try:
            namespace = {}
            exec(compile(source, "tetris_445.py", "exec"), namespace, namespace)
        finally:
            if previous_curses is None:
                del sys.modules["curses"]
            else:
                sys.modules["curses"] = previous_curses

        result["frames"] = frames
        result["note"] = "The exact committed Python 3 source executed in Pyodide with the repository's deterministic curses key stream. Frames are replayed in this terminal."

    elif MODE == "scripted":
        import os
        input_data = base64.b64decode(INPUT_B64)
        chunks = [input_data[:91], input_data[91:]]
        output = []

        def fake_read(fd, size):
            if chunks:
                return chunks.pop(0)
            return b""

        def fake_write(fd, data):
            data = bytes(data)
            output.append(data)
            return len(data)

        original_read, original_write = os.read, os.write
        os.read, os.write = fake_read, fake_write
        try:
            namespace = {}
            exec(compile(source, "tetris_287.py", "exec"), namespace, namespace)
        finally:
            os.read, os.write = original_read, original_write

        stdout = b"".join(output).decode("latin1")
        result["stdout"] = stdout
        result["frames"] = [stdout]
        result["note"] = "The exact committed 287-byte Python 3 source executed in Pyodide with a controlled file-descriptor input/output shim."
    else:
        raise ValueError("unknown mode: " + MODE)
except Exception:
    result = {
        "error": traceback.format_exc(),
        "frames": [],
        "stdout": "",
        "pythonVersion": sys.version.split()[0],
        "note": ""
    }

json.dumps(result)
`;

self.addEventListener("message", async (event) => {
  if (event.data?.type !== "run") return;
  try {
    const { mode, sourceUrl, inputUrl, keysUrl } = event.data;
    status("loading source", "Fetching the exact candidate bytes and committed proof inputs.");
    const sourceResponse = await fetch(sourceUrl, { cache: "no-cache" });
    if (!sourceResponse.ok) throw new Error(`Candidate HTTP ${sourceResponse.status}`);
    const sourceBytes = new Uint8Array(await sourceResponse.arrayBuffer());

    let inputBytes = new Uint8Array();
    let keyValues = [];
    if (mode === "scripted") {
      const inputResponse = await fetch(inputUrl, { cache: "no-cache" });
      if (!inputResponse.ok) throw new Error(`Input HTTP ${inputResponse.status}`);
      inputBytes = new Uint8Array(await inputResponse.arrayBuffer());
    } else {
      const keysResponse = await fetch(keysUrl, { cache: "no-cache" });
      if (!keysResponse.ok) throw new Error(`Keys HTTP ${keysResponse.status}`);
      keyValues = (await keysResponse.text())
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter(Number.isFinite);
    }

    const pyodide = await getPyodideRuntime();
    status("executing Python", "Running the exact Python 3 byte artifact inside the browser runtime.");
    pyodide.globals.set("MODE", mode);
    pyodide.globals.set("SOURCE_B64", bytesToBase64(sourceBytes));
    pyodide.globals.set("INPUT_B64", bytesToBase64(inputBytes));
    pyodide.globals.set("KEY_VALUES_JSON", JSON.stringify(keyValues));
    const raw = await pyodide.runPythonAsync(RUNNER);
    const result = JSON.parse(raw);
    if (result.error) self.postMessage({ type: "error", error: result.error });
    else self.postMessage({ type: "result", ...result });
  } catch (error) {
    self.postMessage({ type: "error", error: error?.stack || String(error) });
  }
});
