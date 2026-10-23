import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

const viteBin = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

const uiAlreadyRunning = await isPortInUse(5173);
const children = [spawn(process.execPath, ["server/index.js"], { stdio: "inherit" })];
if (uiAlreadyRunning) {
  console.log("Using the local UI already running at http://127.0.0.1:5173");
} else {
  children.push(spawn(process.execPath, [viteBin, "--host", "127.0.0.1"], { stdio: "inherit" }));
}

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  process.exitCode = code;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error("Could not start the local app:", error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
